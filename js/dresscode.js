/**
 * Dress Code Section Module
 * Displays attire guidelines text and up to 6 color swatches from CONFIG.dressCode.
 * Hides the section entirely if no dress code is configured.
 *
 * Exposed as window.DressCode = { init }
 */
(function () {
  'use strict';

  var MAX_SWATCHES = 6;

  /**
   * Initialize the dress code section.
   * - If CONFIG.dressCode is undefined or null → hide #dresscode-section
   * - Otherwise, display the attire guidelines text in #dresscode-text
   * - Render up to 6 color swatches in #dresscode-colors
   */
  function init() {
    var section = document.getElementById('dresscode-section');
    var textEl = document.getElementById('dresscode-text');
    var colorsContainer = document.getElementById('dresscode-colors');

    if (!section) {
      return;
    }

    var dressCode = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.dressCode) ? CONFIG.dressCode : null;

    // Hide section if no dress code configured
    if (!dressCode) {
      section.style.display = 'none';
      return;
    }

    // Display attire guidelines text
    if (textEl && dressCode.text) {
      textEl.textContent = dressCode.text;
    }

    // Render color swatches (up to 6 max)
    if (colorsContainer && Array.isArray(dressCode.colors) && dressCode.colors.length > 0) {
      colorsContainer.innerHTML = '';

      var colors = dressCode.colors.slice(0, MAX_SWATCHES);

      for (var i = 0; i < colors.length; i++) {
        var color = colors[i];
        if (!color || !color.hex) {
          continue;
        }

        var swatch = document.createElement('div');
        swatch.className = 'color-swatch';

        var square = document.createElement('div');
        square.className = 'swatch-square';
        square.style.backgroundColor = color.hex;
        swatch.appendChild(square);

        var name = document.createElement('span');
        name.className = 'swatch-name';
        name.textContent = color.name || '';
        swatch.appendChild(name);

        colorsContainer.appendChild(swatch);
      }
    }
  }

  // Expose public API
  window.DressCode = {
    init: init
  };
})();
