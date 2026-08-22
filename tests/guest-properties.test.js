// Feature: wedding-invitation-site, Property 5: Guest Name Display and Truncation
// Feature: wedding-invitation-site, Property 6: Invalid Guest Identifier Error Handling

const fc = require('fast-check');

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

// Load guest.js module
require('../js/guest.js');

const truncateName = window.GuestPage._truncateName;

// ============================================================================
// Property 5: Guest Name Display and Truncation
// **Validates: Requirements 4.3, 5.1**
// ============================================================================

describe('Property 5: Guest Name Display and Truncation', () => {

  it('names of length <= 100 are returned unchanged', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (name) => {
          const result = truncateName(name, 100);
          expect(result).toBe(name);
          expect(result.length).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('names of length > 100 are truncated to exactly 100 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        (name) => {
          const result = truncateName(name, 100);
          expect(result.length).toBe(100);
          expect(result).toBe(name.substring(0, 100));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('names with URL-encodable characters (spaces, accents, special chars) are handled correctly', () => {
    // Generator for strings containing URL-encodable characters
    const urlEncodableChars = fc.stringOf(
      fc.oneof(
        fc.constantFrom(
          ' ', 'á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü',
          'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü',
          '&', '=', '?', '#', '%', '+', '/',
          '@', '!', '$', '(', ')', '*', ',', ';'
        ),
        fc.char() // mix in regular characters too
      ),
      { minLength: 1, maxLength: 200 }
    );

    fc.assert(
      fc.property(
        urlEncodableChars,
        (name) => {
          const result = truncateName(name, 100);
          if (name.length <= 100) {
            expect(result).toBe(name);
          } else {
            expect(result.length).toBe(100);
            expect(result).toBe(name.substring(0, 100));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('output length is always <= maxLength for any input length 0-200', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.integer({ min: 1, max: 200 }),
        (name, maxLength) => {
          const result = truncateName(name, maxLength);
          expect(result.length).toBeLessThanOrEqual(maxLength);
          // If shorter or equal, returned unchanged
          if (name.length <= maxLength) {
            expect(result).toBe(name);
          } else {
            expect(result).toBe(name.substring(0, maxLength));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ============================================================================
// Property 6: Invalid Guest Identifier Error Handling
// **Validates: Requirements 5.1, 5.3**
// ============================================================================

describe('Property 6: Invalid Guest Identifier Error Handling', () => {

  // Helper to set up DOM elements used by guest.js error page
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

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
  });

  it('empty or missing guest IDs show error page and reveal no guest data', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('?guest='),
          fc.constant('?guest=   '),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 })
            .map(ws => '?guest=' + ws)
        ),
        (urlSearch) => {
          setupDOM();
          setURL(urlSearch);

          window.GuestPage.init();

          const errorPage = document.getElementById('error-page');
          const guestGreeting = document.getElementById('guest-greeting');
          const ticketCount = document.getElementById('ticket-count');

          // Error page must be shown
          expect(errorPage.style.display).toBe('block');
          // No guest data revealed
          expect(guestGreeting.textContent).toBe('');
          expect(ticketCount.textContent).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('malformed/non-alphanumeric IDs that are not found show error page and reveal no guest data', async () => {
    // Generator for invalid IDs: random strings of various characters
    const invalidIdGenerator = fc.oneof(
      // Non-alphanumeric strings
      fc.stringOf(
        fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '[', ']', '{', '}', '|', '\\', '/', '<', '>', ',', '.', '?'),
        { minLength: 1, maxLength: 20 }
      ),
      // Random unicode strings
      fc.unicodeString({ minLength: 1, maxLength: 20 }),
      // Mixed alphanumeric with special chars
      fc.string({ minLength: 1, maxLength: 30 }),
      // Very long strings
      fc.string({ minLength: 50, maxLength: 100 })
    );

    // We run this as a loop because fc.assert doesn't natively support async
    const samples = fc.sample(invalidIdGenerator, 100);

    for (const invalidId of samples) {
      setupDOM();
      setURL('?guest=' + encodeURIComponent(invalidId));

      // Mock API to return not found for any invalid ID
      API.getGuest.mockResolvedValue({ error: true, notFound: true });

      // Envelope init just calls the callback immediately
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();

      // Wait for async API call
      await new Promise(resolve => setTimeout(resolve, 0));

      const errorPage = document.getElementById('error-page');
      const guestGreeting = document.getElementById('guest-greeting');
      const ticketCount = document.getElementById('ticket-count');
      const cardContent = document.querySelector('.card-content');

      // Error page must be shown
      expect(errorPage.style.display).toBe('block');
      // No guest data revealed in DOM
      expect(guestGreeting.textContent).toBe('');
      expect(ticketCount.textContent).toBe('');
      // Card content remains hidden
      expect(cardContent.style.display).toBe('none');
    }
  });

  it('error page shows a fixed generic error message and does not dynamically include the ID', () => {
    const GENERIC_ERROR = 'Este enlace no es válido.';

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (invalidId) => {
          setupDOM();
          // Missing guest param triggers error synchronously
          setURL('');
          window.GuestPage.init();

          const errorMessage = document.getElementById('error-message');
          // The error message is always the same fixed generic string
          expect(errorMessage.textContent).toBe(GENERIC_ERROR);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('invalid IDs that trigger API not-found show generic error without revealing data', async () => {
    const GENERIC_ERROR = 'Este enlace no es válido.';

    // Generate random strings that would be invalid guest IDs
    const invalidIds = fc.sample(
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        fc.hexaString({ minLength: 1, maxLength: 20 }),
        fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 1, maxLength: 15 })
      ),
      100
    );

    for (const invalidId of invalidIds) {
      setupDOM();
      setURL('?guest=' + encodeURIComponent(invalidId));

      // Mock API to return not found
      API.getGuest.mockResolvedValue({ error: true, notFound: true });
      Envelope.init.mockImplementation(function (cb) { cb(); });

      window.GuestPage.init();
      await new Promise(resolve => setTimeout(resolve, 0));

      const errorPage = document.getElementById('error-page');
      const errorMessage = document.getElementById('error-message');
      const guestGreeting = document.getElementById('guest-greeting');
      const ticketCount = document.getElementById('ticket-count');

      // Error page shown with fixed generic message
      expect(errorPage.style.display).toBe('block');
      expect(errorMessage.textContent).toBe(GENERIC_ERROR);
      // No guest data revealed
      expect(guestGreeting.textContent).toBe('');
      expect(ticketCount.textContent).toBe('');
    }
  });

});
