/**
 * Photos Section Module
 * Renders a responsive grid of couple photos from CONFIG.photos.
 * Images are lazy-loaded and include descriptive alt text for accessibility.
 *
 * Exposed as window.Photos = { init }
 */
(function () {
  'use strict';

  /**
   * Initialize the photos section.
   * - If CONFIG.photos is empty or undefined, hides the photos section.
   * - Otherwise, creates <img> elements for each photo and appends to the grid.
   */
  function init() {
    var section = document.getElementById('photos-section');
    var grid = document.getElementById('photos-grid');

    if (!section || !grid) {
      return;
    }

    var photos = (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.photos)) ? CONFIG.photos : [];

    if (photos.length === 0) {
      section.style.display = 'none';
      return;
    }

    // Clear any existing content in the grid
    grid.innerHTML = '';

    for (var i = 0; i < photos.length; i++) {
      var photo = photos[i];
      var img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt || 'Foto de la pareja';
      img.setAttribute('loading', 'lazy');
      img.className = 'photo-item';
      grid.appendChild(img);
    }
  }

  // Expose public API
  window.Photos = {
    init: init
  };
})();
