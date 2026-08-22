/**
 * Music Player Module
 * Plays background music after envelope opens.
 * Shows a mute/unmute floating button.
 */
(function() {
  'use strict';

  var audio = null;
  var btn = null;
  var isPlaying = false;

  function createButton() {
    btn = document.createElement('button');
    btn.className = 'music-toggle';
    btn.setAttribute('aria-label', 'Toggle music');
    btn.innerHTML = '♪';
    btn.style.display = 'none';
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);
  }

  function play() {
    if (!audio) {
      audio = new Audio('audio/a-thousand-years.mp3');
      audio.loop = true;
      audio.volume = 0.4;
    }
    audio.play().then(function() {
      isPlaying = true;
      btn.classList.add('playing');
      btn.classList.remove('muted');
    }).catch(function() {
      // Autoplay blocked — show as muted
      isPlaying = false;
      btn.classList.add('muted');
      btn.classList.remove('playing');
    });
  }

  function toggle() {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      btn.classList.add('muted');
      btn.classList.remove('playing');
    } else {
      audio.play().then(function() {
        isPlaying = true;
        btn.classList.add('playing');
        btn.classList.remove('muted');
      }).catch(function() {});
    }
  }

  function show() {
    if (btn) {
      btn.style.display = 'flex';
    }
  }

  function init() {
    createButton();
  }

  function start() {
    show();
    play();
  }

  window.Music = {
    init: init,
    start: start
  };
})();
