/**
 * Gift Section Module (Lluvia de Sobres Digital)
 * Renders the digital envelope / cash gift section from CONFIG.gift.
 * Hides the section if no gift configuration is provided.
 *
 * Exposed as window.Gift = { init }
 *
 * @module Gift
 * @requires CONFIG (global)
 */
(function () {
  'use strict';

  var DEFAULT_INSTRUCTIONS = 'Puedes enviar tu regalo a través de transferencia bancaria o por el enlace de pago.';

  /**
   * Initialize the gift section.
   * - If CONFIG.gift is undefined/null → hide #gift-section
   * - Render heading and message
   * - If bankDetails exists with non-empty values → show bank details
   * - If paymentLink exists → show link with target="_blank" and rel="noopener noreferrer"
   * - Always show instruction text
   */
  function init() {
    var section = document.getElementById('gift-section');
    if (!section) {
      return;
    }

    var gift = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.gift) ? CONFIG.gift : null;

    // Hide section if no gift configured
    if (!gift) {
      section.style.display = 'none';
      return;
    }

    // Render heading
    var headingEl = document.getElementById('gift-heading');
    if (headingEl && gift.heading) {
      headingEl.textContent = gift.heading;
    }

    // Render message
    var messageEl = document.getElementById('gift-message');
    if (messageEl && gift.message) {
      messageEl.textContent = gift.message;
    }

    // Render bank details
    var bankDetailsEl = document.getElementById('gift-bank-details');
    if (bankDetailsEl) {
      if (gift.bankDetails &&
          gift.bankDetails.bankName &&
          gift.bankDetails.accountHolder &&
          gift.bankDetails.accountNumber) {
        bankDetailsEl.style.display = '';

        var bankNameEl = document.getElementById('gift-bank-name');
        if (bankNameEl) {
          bankNameEl.textContent = gift.bankDetails.bankName;
        }

        var accountHolderEl = document.getElementById('gift-account-holder');
        if (accountHolderEl) {
          accountHolderEl.textContent = gift.bankDetails.accountHolder;
        }

        var accountNumberEl = document.getElementById('gift-account-number');
        if (accountNumberEl) {
          accountNumberEl.textContent = gift.bankDetails.accountNumber;
        }
      } else {
        bankDetailsEl.style.display = 'none';
      }
    }

    // Render payment link
    var paymentLinkEl = document.getElementById('gift-payment-link');
    if (paymentLinkEl) {
      if (gift.paymentLink) {
        paymentLinkEl.href = gift.paymentLink;
        paymentLinkEl.target = '_blank';
        paymentLinkEl.rel = 'noopener noreferrer';
        paymentLinkEl.style.display = '';
      } else {
        paymentLinkEl.style.display = 'none';
      }
    }

    // Render instruction text (always shown)
    var instructionsEl = document.getElementById('gift-instructions');
    if (instructionsEl) {
      instructionsEl.textContent = DEFAULT_INSTRUCTIONS;
    }
  }

  // Expose public API
  window.Gift = {
    init: init
  };
})();
