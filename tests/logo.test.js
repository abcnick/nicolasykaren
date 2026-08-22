/**
 * Unit tests for the Wedding Logo Module (js/logo.js)
 */

// Set up CONFIG before loading the module
global.CONFIG = {
  wedding: {
    couple: { name1: 'Karen', name2: 'Nicolas' }
  },
  logo: {
    src: 'img/logo.png',
    alt: 'Karen & Nicolas Wedding'
  }
};

require('../js/logo.js');

describe('Logo Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="logo-container"></div>';
    // Reset CONFIG to defaults
    CONFIG.logo = {
      src: 'img/logo.png',
      alt: 'Karen & Nicolas Wedding'
    };
    CONFIG.wedding = {
      couple: { name1: 'Karen', name2: 'Nicolas' }
    };
  });

  describe('init() — logo display', () => {
    test('creates an img element in #logo-container', () => {
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');
      expect(img).not.toBeNull();
    });

    test('img has correct src from CONFIG.logo.src', () => {
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.src).toContain('img/logo.png');
    });

    test('img has alt text from CONFIG.logo.alt containing couple names', () => {
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.alt).toBe('Karen & Nicolas Wedding');
    });

    test('img has class "wedding-logo"', () => {
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.className).toBe('wedding-logo');
    });

    test('img has max-width 200px style', () => {
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.style.maxWidth).toBe('200px');
    });

    test('img has width auto style for responsive behavior', () => {
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.style.width).toBe('auto');
    });

    test('img has height auto style to maintain aspect ratio', () => {
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.style.height).toBe('auto');
    });
  });

  describe('init() — error fallback', () => {
    test('on image load error, removes img and shows text fallback', () => {
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');

      // Simulate image load error
      img.onerror();

      var imgAfter = container.querySelector('img');
      expect(imgAfter).toBeNull();

      var fallback = container.querySelector('.logo-fallback-text');
      expect(fallback).not.toBeNull();
      expect(fallback.textContent).toBe('Karen & Nicolas');
    });

    test('text fallback displays couple names from CONFIG.wedding.couple', () => {
      CONFIG.wedding.couple = { name1: 'María', name2: 'José' };
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');

      img.onerror();

      var fallback = container.querySelector('.logo-fallback-text');
      expect(fallback.textContent).toBe('María & José');
    });

    test('text fallback has class "logo-fallback-text"', () => {
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');

      img.onerror();

      var fallback = container.querySelector('.logo-fallback-text');
      expect(fallback.className).toBe('logo-fallback-text');
    });
  });

  describe('init() — no logo configured', () => {
    test('shows text fallback immediately when CONFIG.logo is null', () => {
      CONFIG.logo = null;
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');
      expect(img).toBeNull();

      var fallback = container.querySelector('.logo-fallback-text');
      expect(fallback).not.toBeNull();
      expect(fallback.textContent).toBe('Karen & Nicolas');
    });

    test('shows text fallback immediately when CONFIG.logo is undefined', () => {
      CONFIG.logo = undefined;
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');
      expect(img).toBeNull();

      var fallback = container.querySelector('.logo-fallback-text');
      expect(fallback).not.toBeNull();
    });

    test('shows text fallback when CONFIG.logo.src is empty', () => {
      CONFIG.logo = { src: '', alt: 'Some alt' };
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');
      expect(img).toBeNull();

      var fallback = container.querySelector('.logo-fallback-text');
      expect(fallback).not.toBeNull();
    });

    test('shows text fallback when CONFIG.logo.src is missing', () => {
      CONFIG.logo = { alt: 'Some alt' };
      window.Logo.init();
      var container = document.getElementById('logo-container');
      var img = container.querySelector('img');
      expect(img).toBeNull();

      var fallback = container.querySelector('.logo-fallback-text');
      expect(fallback).not.toBeNull();
    });
  });

  describe('init() — alt text fallback', () => {
    test('uses couple names as alt text when CONFIG.logo.alt is empty', () => {
      CONFIG.logo = { src: 'img/logo.png', alt: '' };
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.alt).toBe('Karen & Nicolas');
    });

    test('uses couple names as alt text when CONFIG.logo.alt is missing', () => {
      CONFIG.logo = { src: 'img/logo.png' };
      window.Logo.init();
      var img = document.querySelector('#logo-container img');
      expect(img.alt).toBe('Karen & Nicolas');
    });
  });

  describe('init() — missing DOM element', () => {
    test('does nothing if #logo-container is missing from DOM', () => {
      document.body.innerHTML = '';
      expect(() => window.Logo.init()).not.toThrow();
    });
  });

  describe('init() — missing couple config', () => {
    test('fallback shows empty names gracefully if CONFIG.wedding is missing', () => {
      CONFIG.wedding = undefined;
      CONFIG.logo = null;
      window.Logo.init();
      var fallback = document.querySelector('.logo-fallback-text');
      expect(fallback).not.toBeNull();
      expect(fallback.textContent).toBe('');
    });

    test('fallback handles partial couple config (only name1)', () => {
      CONFIG.wedding = { couple: { name1: 'Karen' } };
      CONFIG.logo = null;
      window.Logo.init();
      var fallback = document.querySelector('.logo-fallback-text');
      expect(fallback.textContent).toBe('Karen & ');
    });
  });
});
