(function () {
  'use strict';

  var YT_VIDEO_ID = 'pYLJ2DknYjM';
  var player = null;
  var isReady = false;
  var btn = null;
  var playIcon = null;
  var pauseIcon = null;

  function initElements() {
    btn = document.getElementById('music-toggle');
    if (btn) {
      playIcon = btn.querySelector('.music-icon--play');
      pauseIcon = btn.querySelector('.music-icon--pause');
    }
  }

  function setState(playing) {
    if (!btn) initElements();
    if (!btn) return;
    btn.classList.toggle('is-playing', playing);
    btn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    btn.setAttribute('title', playing ? 'Pause music' : 'Play music');
    if (playIcon) playIcon.style.display = playing ? 'none' : 'flex';
    if (pauseIcon) pauseIcon.style.display = playing ? 'flex' : 'none';
  }

  function onGesture() {
    removeGestureListeners();
    if (player && typeof player.playVideo === 'function') {
      try {
        player.unMute();
        player.setVolume(70);
        player.playVideo();
      } catch (err) {}
    }
  }

  function addGestureListeners() {
    window.addEventListener('click', onGesture, { once: true, passive: true });
    window.addEventListener('touchstart', onGesture, { once: true, passive: true });
    window.addEventListener('keydown', onGesture, { once: true, passive: true });
    window.addEventListener('scroll', onGesture, { once: true, passive: true });
    window.addEventListener('pointerdown', onGesture, { once: true, passive: true });
  }

  function removeGestureListeners() {
    window.removeEventListener('click', onGesture);
    window.removeEventListener('touchstart', onGesture);
    window.removeEventListener('keydown', onGesture);
    window.removeEventListener('scroll', onGesture);
    window.removeEventListener('pointerdown', onGesture);
  }

  function createYouTubePlayer() {
    if (player) return;
    var container = document.getElementById('yt-bg-player');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-bg-player';
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.width = '200px';
      container.style.height = '200px';
      container.style.opacity = '0.001';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-9999';
      document.body.appendChild(container);
    }

    player = new window.YT.Player('yt-bg-player', {
      height: '200',
      width: '200',
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: YT_VIDEO_ID,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1
      },
      events: {
        onReady: function (e) {
          isReady = true;
          try {
            e.target.playVideo();
            setTimeout(function () {
              try {
                e.target.unMute();
                e.target.setVolume(70);
              } catch (err) {}
            }, 300);
          } catch (err) {}
          addGestureListeners();
        },
        onStateChange: function (e) {
          if (window.YT && window.YT.PlayerState) {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setState(true);
            } else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
              setState(false);
            }
          }
        },
        onError: function (e) {
          console.warn('YouTube Player error:', e.data);
        }
      }
    });
  }

  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      createYouTubePlayer();
      return;
    }

    var prevHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prevHandler === 'function') prevHandler();
      createYouTubePlayer();
    };

    if (!document.getElementById('yt-iframe-api-script')) {
      var tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      var first = document.getElementsByTagName('script')[0];
      if (first && first.parentNode) {
        first.parentNode.insertBefore(tag, first);
      } else {
        document.head.appendChild(tag);
      }
    }
  }

  function setupToggle() {
    initElements();
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      removeGestureListeners();

      if (!player || !isReady || typeof player.getPlayerState !== 'function') {
        loadYouTubeAPI();
        return;
      }

      try {
        var state = player.getPlayerState();
        if (state === 1) { // PLAYING
          player.pauseVideo();
          setState(false);
        } else {
          player.unMute();
          player.setVolume(70);
          player.playVideo();
          setState(true);
        }
      } catch (err) {
        console.warn('Error toggling audio:', err);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupToggle();
      loadYouTubeAPI();
    });
  } else {
    setupToggle();
    loadYouTubeAPI();
  }
})();