/**
 * Unit tests for Guest Page Logic (js/guest.js)
 * Tests URL parsing, error page display, greeting rendering, and name truncation.
 */

// Set up minimal CONFIG global before loading guest.js
global.CONFIG = {
  wedding: {
    date: "2025-06-14T16:00:00-05:00",
    couple: { name1: "Karen", name2: "Nicolas" }
  },
  api: {
    baseUrl: "https://script.google.com/macros/s/TEST/exec"
  }
};

// Mock API global
global.API = {
  getGuest: jest.fn()
};

// Mock Envelope global
global.Envelope = {
  init: jest.fn()
};

// Helper to set up DOM elements used by guest.js
function setupDOM() {
  document.body.innerHTML = `
    <div class="envelope-wrapper" style="display:none;">
      <div class="card">
        <div class="card-content" style="display:none;">
          <p id="couple-greeting"></p>
          <p id="guest-greeting"></p>
          <p id="ticket-count"></p>
        </div>
      </div>
    </div>
    <div id="error-page" style="display:none;">
      <p id="error-message"></p>
      <button id="retry-btn" style="display:none;"></button>
    </div>
  `;
}

// Helper to set URL search params
function setURL(search) {
  delete window.location;
  window.location = { search: search };
}

// Load guest.js (executes the IIFE and attaches to window)
require('../js/guest.js');

describe('Guest Page Logic', () => {
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
  });

  describe('truncateGuestName (window.GuestPage._truncateName)', () => {
    const truncate = window.GuestPage._truncateName;

    test('returns name unchanged if shorter than max length', () => {
      expect(truncate('Juan', 100)).toBe('Juan');
    });

    test('returns name unchanged if exactly max length', () => {
      const name = 'a'.repeat(100);
      expect(truncate(name, 100)).toBe(name);
    });

    test('truncates name that exceeds max length', () => {
      const name = 'a'.repeat(150);
      expect(truncate(name, 100)).toBe('a'.repeat(100));
    });

    test('uses default max length of 100 when not specified', () => {
      const name = 'b'.repeat(105);
      expect(truncate(name)).toBe('b'.repeat(100));
    });

    test('returns empty string for non-string input', () => {
      expect(truncate(null, 100)).toBe('');
      expect(truncate(undefined, 100)).toBe('');
      expect(truncate(123, 100)).toBe('');
    });

    test('handles empty string input', () => {
      expect(truncate('', 100)).toBe('');
    });

    test('handles zero max length', () => {
      expect(truncate('hello', 0)).toBe('');
    });
  });

  describe('init() — URL parsing', () => {
    test('shows error page when guest parameter is missing', () => {
      setURL('');
      window.GuestPage.init();

      const errorPage = document.getElementById('error-page');
      const errorMessage = document.getElementById('error-message');

      expect(errorPage.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('Este enlace no es válido.');
    });

    test('shows error page when guest parameter is empty string', () => {
      setURL('?guest=');
      window.GuestPage.init();

      const errorPage = document.getElementById('error-page');
      expect(errorPage.style.display).toBe('block');
    });

    test('shows error page when guest parameter is whitespace only', () => {
      setURL('?guest=   ');
      window.GuestPage.init();

      const errorPage = document.getElementById('error-page');
      expect(errorPage.style.display).toBe('block');
    });

    test('shows envelope and initializes when guest parameter is present', () => {
      setURL('?guest=abc123');
      window.GuestPage.init();

      const envelopeWrapper = document.querySelector('.envelope-wrapper');
      expect(envelopeWrapper.style.display).toBe('block');
      expect(window.Envelope.init).toHaveBeenCalledWith(expect.any(Function));
    });

    test('hides envelope when showing error page', () => {
      setURL('');
      window.GuestPage.init();

      const envelopeWrapper = document.querySelector('.envelope-wrapper');
      expect(envelopeWrapper.style.display).toBe('none');
    });
  });

  describe('loadGuest — API integration', () => {
    test('renders greeting on successful API response', async () => {
      setURL('?guest=abc123');

      API.getGuest.mockResolvedValue({ name: 'María García', ticketCount: 3 });

      // Simulate: Envelope.init captures callback and we call it
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(API.getGuest).toHaveBeenCalledWith('abc123');
      expect(document.getElementById('guest-greeting').textContent).toBe('María García');
      expect(document.getElementById('ticket-count').textContent).toBe('Tienes 3 lugares reservados');
    });

    test('renders singular ticket count message for 1 ticket', async () => {
      setURL('?guest=xyz789');
      API.getGuest.mockResolvedValue({ name: 'Pedro', ticketCount: 1 });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('ticket-count').textContent).toBe('Tienes 1 lugar reservado');
    });

    test('uses fallback name when guest name is empty', async () => {
      setURL('?guest=abc123');
      API.getGuest.mockResolvedValue({ name: '', ticketCount: 2 });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('guest-greeting').textContent).toBe('Invitado/a');
    });

    test('uses fallback name when guest name is null', async () => {
      setURL('?guest=abc123');
      API.getGuest.mockResolvedValue({ name: null, ticketCount: 2 });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('guest-greeting').textContent).toBe('Invitado/a');
    });

    test('uses fallback name when guest name is whitespace only', async () => {
      setURL('?guest=abc123');
      API.getGuest.mockResolvedValue({ name: '   ', ticketCount: 2 });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('guest-greeting').textContent).toBe('Invitado/a');
    });

    test('truncates long guest name to 100 characters', async () => {
      setURL('?guest=abc123');
      const longName = 'A'.repeat(150);
      API.getGuest.mockResolvedValue({ name: longName, ticketCount: 2 });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('guest-greeting').textContent).toBe('A'.repeat(100));
    });

    test('shows error page on not found response', async () => {
      setURL('?guest=invalid');
      API.getGuest.mockResolvedValue({ error: true, notFound: true });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      const errorPage = document.getElementById('error-page');
      const errorMessage = document.getElementById('error-message');
      expect(errorPage.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('Este enlace no es válido.');
    });

    test('shows error page with retry on network error', async () => {
      setURL('?guest=abc123');
      API.getGuest.mockResolvedValue({ error: true, message: 'Network error' });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      const errorPage = document.getElementById('error-page');
      const retryBtn = document.getElementById('retry-btn');
      expect(errorPage.style.display).toBe('block');
      expect(retryBtn.style.display).toBe('inline-block');
    });

    test('shows error page with retry on fetch rejection', async () => {
      setURL('?guest=abc123');
      API.getGuest.mockRejectedValue(new Error('fetch failed'));
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      const errorPage = document.getElementById('error-page');
      const retryBtn = document.getElementById('retry-btn');
      expect(errorPage.style.display).toBe('block');
      expect(retryBtn.style.display).toBe('inline-block');
    });

    test('retry button calls loadGuest again', async () => {
      setURL('?guest=abc123');
      // First call fails, second succeeds
      API.getGuest
        .mockResolvedValueOnce({ error: true, message: 'Network error' })
        .mockResolvedValueOnce({ name: 'María', ticketCount: 2 });

      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Click retry
      const retryBtn = document.getElementById('retry-btn');
      retryBtn.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(API.getGuest).toHaveBeenCalledTimes(2);
      expect(document.getElementById('guest-greeting').textContent).toBe('María');
    });

    test('renders couple greeting from CONFIG', async () => {
      setURL('?guest=abc123');
      API.getGuest.mockResolvedValue({ name: 'Pedro', ticketCount: 1 });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      const coupleGreeting = document.getElementById('couple-greeting');
      expect(coupleGreeting.textContent).toBe('Karen & Nicolas te invitan a su boda');
    });
  });

  describe('fallback without Envelope module', () => {
    test('loads guest directly when Envelope module is not available', async () => {
      setURL('?guest=abc123');
      API.getGuest.mockResolvedValue({ name: 'Ana', ticketCount: 1 });

      // Temporarily remove Envelope
      const originalEnvelope = window.Envelope;
      window.Envelope = undefined;

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(API.getGuest).toHaveBeenCalledWith('abc123');
      expect(document.getElementById('guest-greeting').textContent).toBe('Ana');

      // Restore
      window.Envelope = originalEnvelope;
    });
  });
});
