const RECIPIENT = 'pavanmahadev9901@gmail.com';
const SITE = 'https://greennetspark.in';

export async function onRequestPost(context) {
  const { request } = context;
  const contentType = request.headers.get('content-type') || '';
  if (!/^application\/json(?:;|$)/i.test(contentType)) {
    return new Response(JSON.stringify({ success: false, message: 'Please use the enquiry form to send your details.' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  let input;
  try {
    input = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid body');
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Please check your details and try again.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  if (input.website) {
    return new Response(JSON.stringify({ success: false, message: 'Unable to submit this enquiry.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const message = typeof input.message === 'string' ? input.message.trim() : '';

  const errors = {};
  if (!name || name.length > 80) errors.name = 'Please enter your name (up to 80 characters).';
  if (!email || email.length > 254 || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) {
    errors.email = 'Please enter a valid email, such as name@example.com.';
  }
  if (!phone || phone.length > 32 || phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ success: false, errors, message: 'Please check the highlighted details.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  try {
    const formSubmitRes = await fetch('https://formsubmit.co/ajax/' + RECIPIENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': SITE + '/'
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        message: message || 'No project details provided.',
        _subject: 'Portfolio — new call enquiry',
        _template: 'table',
        _captcha: 'false',
        _url: SITE + '/'
      })
    });

    const result = await formSubmitRes.json();
    const needsActivation = /activat|confirm.{0,25}(?:email|address)|verif(?:y|ication)/i.test(String(result.message || ''));
    if (needsActivation) {
      return new Response(JSON.stringify({
        success: false,
        code: 'EMAIL_ACTIVATION_REQUIRED',
        message: 'FormSubmit activation email sent to ' + RECIPIENT + '. Please check your inbox and click Activate once to enable automatic submissions.'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    if (!formSubmitRes.ok || ![true, 'true'].includes(result.success)) {
      throw new Error('Delivery not accepted');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch {
    return new Response(JSON.stringify({
      success: false,
      message: 'Your enquiry could not be sent just now. Please try again or email me directly.'
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
}
