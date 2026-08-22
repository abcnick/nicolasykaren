/**
 * Guest Page Logic
 * Handles URL parsing, API fetching, personalized greeting rendering, and error states.
 * 
 * Flow:
 * 1. On DOMContentLoaded, parse ?guest=<id> from URL
 * 2. If no guest param → show landing page, hide everything else
 * 3. If guest param present → show ONLY envelope screen (full viewport centered)
 * 4. After envelope click + animation completes → call API.getGuest(id)
 * 5. On success → render greeting inside the card
 * 6. After greeting renders → fade in content sections below
 * 7. On error/not found → show error page
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

    var envelopeScreen = document.querySelector('.envelope-screen');
    var envelopeWrapper = document.querySelector('.envelope-wrapper');
    var cardContent = document.querySelector('.card-content');
    var errorPage = document.getElementById('error-page');
    var errorMessage = document.getElementById('error-message');
    var retryBtn = document.getElementById('retry-btn');

    // Hide envelope screen/wrapper and card content
    if (envelopeScreen) {
      envelopeScreen.style.display = 'none';
    }
    if (envelopeWrapper) {
      envelopeWrapper.style.display = 'none';
    }
    if (cardContent) {
      cardContent.style.display = 'none';
    }

    // Show error page
    if (errorPage) {
      errorPage.style.display = 'flex';
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
      var coupleEl = cardContent.querySelector('#couple-greeting');
      if (coupleEl) {
        coupleEl.textContent = coupleGreeting;
      }
      cardContent.style.display = 'block';
    }

    // After a short delay for the greeting to be visible, reveal content sections
    setTimeout(function () {
      showContentSections(guest);
    }, 500);
  }

  /**
   * Fetch guest data from API and render or show error.
   * @param {string} guestId - The guest identifier from URL
   */
  function loadGuest(guestId) {
    API.getGuest(guestId).then(function (result) {
      if (!result || result.error) {
        if (result && result.notFound) {
          showErrorPage(ERROR_INVALID_LINK);
        } else {
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
   * Show content sections with a smooth fade-in animation.
   * Initializes all content modules.
   * @param {Object} guest - Guest data from API
   */
  function showContentSections(guest) {
    // Show header
    var header = document.querySelector('header');
    if (header) header.style.display = '';
    var logoContainer = document.getElementById('logo-container');
    if (logoContainer) logoContainer.style.display = '';

    // Remove envelope-active class so header can show
    document.body.classList.remove('envelope-active');

    // Show and animate the invitation content wrapper
    var contentWrapper = document.querySelector('.invitation-content');
    if (contentWrapper) {
      contentWrapper.style.display = 'block';
      // Trigger reflow, then fade in
      void contentWrapper.offsetHeight;
      contentWrapper.style.opacity = '1';
    }

    // Initialize all content modules
    if (typeof CONFIG !== 'undefined' && CONFIG.wedding && CONFIG.wedding.date) {
      if (window.Countdown && typeof window.Countdown.start === 'function') {
        window.Countdown.start(CONFIG.wedding.date);
      }
    }
    if (window.EventDetails && typeof window.EventDetails.init === 'function') {
      window.EventDetails.init();
    }
    if (window.Photos && typeof window.Photos.init === 'function') {
      window.Photos.init();
    }
    if (window.Messages && typeof window.Messages.init === 'function') {
      window.Messages.init();
    }
    if (window.DressCode && typeof window.DressCode.init === 'function') {
      window.DressCode.init();
    }
    if (window.Gift && typeof window.Gift.init === 'function') {
      window.Gift.init();
    }
    if (window.Logo && typeof window.Logo.init === 'function') {
      window.Logo.init();
    }

    // Initialize RSVP: if already submitted, show read-only state; otherwise show form
    if (window.RSVP) {
      if (guest.rsvpStatus === 'submitted' && guest.rsvp) {
        if (typeof window.RSVP.showConfirmedState === 'function') {
          window.RSVP.showConfirmedState(guest.rsvp);
        }
      } else if (typeof window.RSVP.init === 'function') {
        window.RSVP.init(guest.id, guest.ticketCount || 1);
      }
    }

    // Set up Intersection Observer for scroll reveal animations
    var observerOptions = { threshold: 0.15 };
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    document.querySelectorAll('.reveal-on-scroll').forEach(function(el) {
      observer.observe(el);
    });
  }

  /**
   * Show a beautiful landing page when no guest parameter is provided.
   */
  function showLandingPage() {
    var envelopeScreen = document.querySelector('.envelope-screen');
    var envelopeWrapper = document.querySelector('.envelope-wrapper');
    var errorPage = document.getElementById('error-page');
    var header = document.querySelector('header');
    var contentWrapper = document.querySelector('.invitation-content');

    if (envelopeScreen) envelopeScreen.style.display = 'none';
    if (envelopeWrapper) envelopeWrapper.style.display = 'none';
    if (errorPage) errorPage.style.display = 'none';
    if (header) header.style.display = 'none';
    if (contentWrapper) contentWrapper.style.display = 'none';

    // Show the landing page if it exists
    var landingPage = document.getElementById('landing-page');
    if (landingPage) {
      landingPage.style.display = 'flex';
    } else {
      // Fallback: if no landing page element, show error
      showErrorPage(ERROR_INVALID_LINK);
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

    // Hide header and content while showing envelope
    var header = document.querySelector('header');
    var logoContainer = document.getElementById('logo-container');
    if (header) {
      header.style.display = 'none';
    }
    if (logoContainer) {
      logoContainer.style.display = 'none';
    }
    var contentWrapper = document.querySelector('.invitation-content');
    if (contentWrapper) {
      contentWrapper.style.display = 'none';
      contentWrapper.style.opacity = '0';
    }

    // Show the envelope screen (full viewport centered) or fallback to envelope-wrapper
    var envelopeScreen = document.querySelector('.envelope-screen');
    var envelopeWrapper = document.querySelector('.envelope-wrapper');

    // Add body class to ensure header stays hidden while envelope is active
    document.body.classList.add('envelope-active');

    if (envelopeScreen) {
      envelopeScreen.style.display = 'flex';
    } else if (envelopeWrapper) {
      envelopeWrapper.style.display = 'block';
    }

    // Initialize envelope: when it opens, fetch guest data
    if (window.Envelope && typeof window.Envelope.init === 'function') {
      window.Envelope.init(function () {
        // Hide the hint text
        var hint = document.querySelector('.envelope-hint');
        if (hint) hint.style.display = 'none';
        // Fetch guest data
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
