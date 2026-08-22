/**
 * Guest Page Logic
 * Handles URL parsing, API fetching, personalized greeting rendering, and error states.
 * 
 * Flow:
 * 1. On DOMContentLoaded, parse ?guest=<id> from URL
 * 2. If no guest param → show error page, hide envelope
 * 3. If guest param present → show envelope, wait for envelope open callback
 * 4. After envelope opens → call API.getGuest(id)
 * 5. On success → render greeting with guest name and ticket count
 * 6. On error/not found → show error page
 */

(function () {
  'use strict';

  var ERROR_INVALID_LINK = "Este enlace no es válido.";
  var ERROR_NETWORK = "No pudimos cargar tu invitación. Por favor intenta de nuevo.";
  var FALLBACK_NAME = "Invitado/a";
  var MAX_NAME_LENGTH = 100;

  /**
   * Truncate a guest name to a maximum length.
   * @param {string} name - The guest name to truncate
   * @param {number} [maxLength=100] - Maximum allowed length
   * @returns {string} Truncated name (no ellipsis, just cut)
   */
  function truncateGuestName(name, maxLength) {
    if (maxLength === undefined || maxLength === null) {
      maxLength = MAX_NAME_LENGTH;
    }
    if (typeof name !== 'string') {
      return '';
    }
    if (name.length <= maxLength) {
      return name;
    }
    return name.substring(0, maxLength);
  }

  /**
   * Show the error page with a message and optional retry button.
   * @param {string} message - Error text to display
   * @param {Object} [options] - Options
   * @param {boolean} [options.showRetry] - Whether to show the retry button
   * @param {Function} [options.onRetry] - Callback when retry button is clicked
   */
  function showErrorPage(message, options) {
    options = options || {};

    var envelopeWrapper = document.querySelector('.envelope-wrapper');
    var cardContent = document.querySelector('.card-content');
    var errorPage = document.getElementById('error-page');
    var errorMessage = document.getElementById('error-message');
    var retryBtn = document.getElementById('retry-btn');

    // Hide envelope and card content
    if (envelopeWrapper) {
      envelopeWrapper.style.display = 'none';
    }
    if (cardContent) {
      cardContent.style.display = 'none';
    }

    // Show error page
    if (errorPage) {
      errorPage.style.display = 'block';
    }
    if (errorMessage) {
      errorMessage.textContent = message;
    }

    // Handle retry button
    if (retryBtn) {
      if (options.showRetry && typeof options.onRetry === 'function') {
        retryBtn.style.display = 'inline-block';
        retryBtn.onclick = options.onRetry;
      } else {
        retryBtn.style.display = 'none';
      }
    }
  }

  /**
   * Render the personalized greeting with guest name and ticket count.
   * @param {Object} guest - Guest record from API
   * @param {string} guest.name - Guest name
   * @param {number} guest.ticketCount - Number of reserved spots
   */
  function renderGreeting(guest) {
    var greetingEl = document.getElementById('guest-greeting');
    var ticketEl = document.getElementById('ticket-count');
    var cardContent = document.querySelector('.card-content');

    // Determine display name
    var displayName;
    if (!guest.name || (typeof guest.name === 'string' && guest.name.trim() === '')) {
      displayName = FALLBACK_NAME;
    } else {
      displayName = truncateGuestName(guest.name, MAX_NAME_LENGTH);
    }

    // Build couple greeting line
    var coupleGreeting = CONFIG.wedding.couple.name1 + " & " + CONFIG.wedding.couple.name2 + " te invitan a su boda";

    // Render greeting
    if (greetingEl) {
      greetingEl.textContent = displayName;
    }

    // Render ticket count
    if (ticketEl) {
      var count = parseInt(guest.ticketCount, 10) || 1;
      if (count === 1) {
        ticketEl.textContent = "Tienes 1 lugar reservado";
      } else {
        ticketEl.textContent = "Tienes " + count + " lugares reservados";
      }
    }

    // Show card content with couple greeting
    if (cardContent) {
      // Set the couple greeting if there's a designated element, otherwise prepend
      var coupleEl = cardContent.querySelector('#couple-greeting');
      if (coupleEl) {
        coupleEl.textContent = coupleGreeting;
      }
      cardContent.style.display = 'block';
    }

    // Show all content sections now that guest is loaded
    showContentSections(guest);
  }

  /**
   * Fetch guest data from API and render or show error.
   * @param {string} guestId - The guest identifier from URL
   */
  function loadGuest(guestId) {
    API.getGuest(guestId).then(function (result) {
      if (!result || result.error) {
        // Determine if it's a not-found vs network error
        if (result && result.notFound) {
          showErrorPage(ERROR_INVALID_LINK);
        } else {
          showErrorPage(ERROR_NETWORK, {
            showRetry: true,
            onRetry: function () {
              // Hide error page and retry
              var errorPage = document.getElementById('error-page');
              if (errorPage) {
                errorPage.style.display = 'none';
              }
              loadGuest(guestId);
            }
          });
        }
        return;
      }

      renderGreeting(result);
    }).catch(function () {
      showErrorPage(ERROR_NETWORK, {
        showRetry: true,
        onRetry: function () {
          var errorPage = document.getElementById('error-page');
          if (errorPage) {
            errorPage.style.display = 'none';
          }
          loadGuest(guestId);
        }
      });
    });
  }

  /**
   * Show a beautiful landing page when no guest parameter is provided.
   * Hides all invitation content and shows a simple elegant welcome screen.
   */
  function showContentSections(guest) {
    var sections = document.querySelectorAll('#countdown-section, #event-details-section, #photos-section, #messages-section, #dresscode-section, #gift-section, #rsvp-section');
    sections.forEach(function (section) {
      section.style.display = '';
    });

    // Initialize RSVP form with guest data
    if (window.RSVP && typeof window.RSVP.init === 'function') {
      window.RSVP.init(guest.id, guest.ticketCount || 1);
    }
  }

  /**
   * Show a beautiful landing page when no guest parameter is provided.
   * Hides all invitation content and shows a simple elegant welcome screen.
   */
  function showLandingPage() {
    // Hide envelope, error page, and all content sections
    var envelopeWrapper = document.querySelector('.envelope-wrapper');
    var errorPage = document.getElementById('error-page');
    var header = document.querySelector('header');
    var sections = document.querySelectorAll('#countdown-section, #event-details-section, #photos-section, #messages-section, #dresscode-section, #gift-section, #rsvp-section');

    if (envelopeWrapper) envelopeWrapper.style.display = 'none';
    if (errorPage) errorPage.style.display = 'none';
    if (header) header.style.display = 'none';

    sections.forEach(function (section) {
      section.style.display = 'none';
    });

    // Show the landing page
    var landingPage = document.getElementById('landing-page');
    if (landingPage) {
      landingPage.style.display = 'flex';
    }
  }

  /**
   * Initialize the guest page.
   * Parses URL parameters and sets up the page flow.
   */
  function init() {
    var params = new URLSearchParams(window.location.search);
    var guestId = params.get('guest');

    // If guest parameter is missing or empty → show landing page
    if (!guestId || guestId.trim() === '') {
      showLandingPage();
      return;
    }

    // Show envelope and initialize it with a callback
    var envelopeWrapper = document.querySelector('.envelope-wrapper');
    if (envelopeWrapper) {
      envelopeWrapper.style.display = 'block';
    }

    // Initialize envelope: when it opens, fetch guest data
    if (window.Envelope && typeof window.Envelope.init === 'function') {
      window.Envelope.init(function () {
        loadGuest(guestId);
      });
    } else {
      // Fallback: if envelope module not available, load guest directly
      loadGuest(guestId);
    }
  }

  // Expose as global
  window.GuestPage = {
    init: init,
    _truncateName: truncateGuestName
  };

  // Auto-initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);
})();
