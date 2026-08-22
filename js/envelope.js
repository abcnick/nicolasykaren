// Envelope animation controller
// Manages the click-to-open envelope interaction and CSS class transitions.
// States: closed (default) → opening (animation plays) → open (final, no re-close)

(function () {
  'use strict';

  /**
   * Initialize the envelope animation controller.
   * Finds the .envelope-wrapper element in the DOM, attaches click/tap listener,
   * and handles the animation lifecycle.
   *
   * @param {Function} [onOpenCallback] - Optional callback invoked when the opening animation completes.
   */
  function init(onOpenCallback) {
    var wrapper = document.querySelector('.envelope-wrapper');

    if (!wrapper) {
      return;
    }

    var card = wrapper.querySelector('.card');

    // Listen for click (works for both mouse clicks and mobile taps)
    wrapper.addEventListener('click', function handleClick() {
      // If already open, do nothing (prevent re-triggering)
      if (wrapper.classList.contains('open')) {
        return;
      }

      // If already animating, do nothing (prevent double-click during animation)
      if (wrapper.classList.contains('opening')) {
        return;
      }

      // Start the opening animation
      wrapper.classList.add('opening');
    });

    // Listen for animationend on the card element (last animation to finish)
    if (card) {
      card.addEventListener('animationend', function handleAnimationEnd() {
        // Remove the opening class (animation is done)
        wrapper.classList.remove('opening');

        // Set the open class for the final static state
        wrapper.classList.add('open');

        // Invoke callback if provided (e.g., to start loading guest data)
        if (typeof onOpenCallback === 'function') {
          onOpenCallback();
        }
      });
    }
  }

  // Expose as global
  window.Envelope = { init: init };
})();
