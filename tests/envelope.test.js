/**
 * Unit tests for the Envelope Animation Controller (js/envelope.js)
 */

describe('Envelope Animation Controller', () => {
  let wrapper;
  let card;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div class="envelope-wrapper">
        <div class="envelope-flap"></div>
        <div class="envelope-back"></div>
        <div class="card">
          <div class="card-content">Hello</div>
        </div>
      </div>
    `;

    wrapper = document.querySelector('.envelope-wrapper');
    card = wrapper.querySelector('.card');

    // Reset window.Envelope
    delete window.Envelope;

    // Load envelope module
    jest.resetModules();
    require('../js/envelope.js');
  });

  describe('init()', () => {
    test('exposes window.Envelope.init function', () => {
      expect(window.Envelope).toBeDefined();
      expect(typeof window.Envelope.init).toBe('function');
    });

    test('does not throw when .envelope-wrapper is missing from DOM', () => {
      document.body.innerHTML = '';
      expect(() => window.Envelope.init()).not.toThrow();
    });

    test('does not throw when called without a callback', () => {
      expect(() => window.Envelope.init()).not.toThrow();
    });
  });

  describe('click to open', () => {
    beforeEach(() => {
      window.Envelope.init();
    });

    test('adds "opening" class on click', () => {
      wrapper.click();
      expect(wrapper.classList.contains('opening')).toBe(true);
    });

    test('does not add "open" class on click (only after animation ends)', () => {
      wrapper.click();
      expect(wrapper.classList.contains('open')).toBe(false);
    });

    test('does not re-add "opening" if already opening (double-click guard)', () => {
      wrapper.click();
      expect(wrapper.classList.contains('opening')).toBe(true);

      // Simulate second click while still animating
      wrapper.click();
      // Should still just have opening, no errors
      expect(wrapper.classList.contains('opening')).toBe(true);
    });

    test('does nothing if already open', () => {
      // Simulate already open state
      wrapper.classList.add('open');
      wrapper.click();
      expect(wrapper.classList.contains('opening')).toBe(false);
    });
  });

  describe('animationend handling', () => {
    beforeEach(() => {
      window.Envelope.init();
    });

    test('removes "opening" and adds "open" class on card animationend', () => {
      wrapper.click();
      expect(wrapper.classList.contains('opening')).toBe(true);

      // Dispatch animationend on card
      card.dispatchEvent(new Event('animationend'));

      expect(wrapper.classList.contains('opening')).toBe(false);
      expect(wrapper.classList.contains('open')).toBe(true);
    });

    test('envelope stays open after animation (no re-close)', () => {
      wrapper.click();
      card.dispatchEvent(new Event('animationend'));

      expect(wrapper.classList.contains('open')).toBe(true);

      // Clicking again should not change state
      wrapper.click();
      expect(wrapper.classList.contains('open')).toBe(true);
      expect(wrapper.classList.contains('opening')).toBe(false);
    });
  });

  describe('onOpenCallback', () => {
    test('calls the callback when animation completes', () => {
      const callback = jest.fn();
      window.Envelope.init(callback);

      wrapper.click();
      card.dispatchEvent(new Event('animationend'));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('does not call callback if no callback provided', () => {
      // Should not throw
      window.Envelope.init();
      wrapper.click();
      expect(() => card.dispatchEvent(new Event('animationend'))).not.toThrow();
    });

    test('does not call callback on click (only on animationend)', () => {
      const callback = jest.fn();
      window.Envelope.init(callback);

      wrapper.click();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('handles missing .card element gracefully', () => {
      document.body.innerHTML = `
        <div class="envelope-wrapper">
          <div class="envelope-flap"></div>
          <div class="envelope-back"></div>
        </div>
      `;

      delete window.Envelope;
      jest.resetModules();
      require('../js/envelope.js');

      expect(() => window.Envelope.init()).not.toThrow();

      // Click should still add opening class
      const w = document.querySelector('.envelope-wrapper');
      w.click();
      expect(w.classList.contains('opening')).toBe(true);
    });
  });
});
