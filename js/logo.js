/**
 * Wedding Logo Module
 * Displays the wedding logo in the header area with fallback to couple's names as text.
 * The logo maintains aspect ratio, has a max width of 200px, and is responsive.
 *
 * Exposed as window.Logo = { init }
 */
(function () {
  'use strict';

  /**
   * Initialize the logo display.
   * - If CONFIG.logo is configured, creates an <img> element with appropriate styles.
   * - On image load error, falls back to displaying couple's names as text.
   * - If CONFIG.logo is not configured, shows text fallback immediately.
   */
  function init() {
    var container = document.getElementById('logo-container');
    if (!container) {
      return;
    }

    var logoConfig = (typeof CONFIG !== 'undefined' && CONFIG.logo) ? CONFIG.logo : null;
    var coupleNames = getCoupleNames();

    if (!logoConfig || !logoConfig.src) {
      showTextFallback(container, coupleNames);
      return;
    }

    var img = document.createElement('img');
    img.src = logoConfig.src;
    img.alt = logoConfig.alt || coupleNames;
    img.className = 'wedding-logo';
    img.style.maxWidth = '200px';
    img.style.width = 'auto';
    img.style.height = 'auto';

    img.onerror = function () {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
      showTextFallback(container, coupleNames);
    };

    container.appendChild(img);
  }

  /**
   * Get the couple's names from CONFIG.
   * @returns {string} Couple's names (e.g., "Karen & Nicolas")
   */
  function getCoupleNames() {
    if (typeof CONFIG !== 'undefined' && CONFIG.wedding && CONFIG.wedding.couple) {
      var couple = CONFIG.wedding.couple;
      return (couple.name1 || '') + ' & ' + (couple.name2 || '');
    }
    return '';
  }

  /**
   * Display couple's names as text fallback in the container.
   * @param {HTMLElement} container - The logo container element
   * @param {string} names - The couple's names to display
   */
  function showTextFallback(container, names) {
    var span = document.createElement('span');
    span.className = 'logo-fallback-text';
    span.textContent = names;
    container.appendChild(span);
  }

  // Expose public API
  window.Logo = {
    init: init
  };
})();
