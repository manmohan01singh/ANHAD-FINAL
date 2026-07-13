(function () {
  'use strict';

  if (window.DarbarLive) return;

  var audio = null;
  var isPlaying = false;
  var retryTimer = null;
  var listeners = {};

  var SGPC_URL = 'https://live.sgpc.net:8443/;nocache=1';

  function emit(event, data) {
    var fns = listeners[event];
    if (fns) fns.forEach(function (fn) { try { fn(data); } catch (e) {} });
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return function () {
      var arr = listeners[event];
      if (arr) { arr.splice(arr.indexOf(fn), 1); }
    };
  }

  function init() {
    if (audio) return;
    audio = new Audio();
    audio.preload = 'auto';
    audio.volume = 0.8;

    function onPlay() {
      isPlaying = true;
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      emit('statechange', { isPlaying: true, currentStream: 'darbar' });
    }

    function onPause() {
      isPlaying = false;
      emit('statechange', { isPlaying: false, currentStream: 'darbar' });
    }

    audio.addEventListener('playing', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onPause);
    audio.addEventListener('error', function () {
      isPlaying = false;
      emit('statechange', { isPlaying: false, currentStream: 'darbar' });
    });
  }

  function freshUrl() {
    return SGPC_URL + '?t=' + Math.floor(Date.now() / 5000) * 5000;
  }

  function play() {
    init();
    if (isPlaying && audio && !audio.paused) return;

    var url = freshUrl();
    audio.src = url;
    audio.play().then(function () {
      isPlaying = true;
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      emit('statechange', { isPlaying: true, currentStream: 'darbar' });
    }).catch(function () {
      isPlaying = false;
      emit('statechange', { isPlaying: false, currentStream: 'darbar' });
      if (!retryTimer) {
        retryTimer = setTimeout(function () {
          retryTimer = null;
          if (!isPlaying) play();
        }, 1500);
      }
    });
  }

  function pause() {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    if (audio) { audio.pause(); }
    isPlaying = false;
    emit('statechange', { isPlaying: false, currentStream: 'darbar' });
  }

  function toggle() {
    if (isPlaying) pause();
    else play();
  }

  function getState() {
    return { isPlaying: isPlaying, currentStream: 'darbar' };
  }

  function getAudio() { return audio; }

  window.DarbarLive = {
    play: play,
    pause: pause,
    toggle: toggle,
    getState: getState,
    getAudio: getAudio,
    on: on,
    init: init
  };
})();
