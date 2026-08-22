/**
 * Integration Tests
 * Tests multiple modules working together with mocked network layer.
 * Validates: Requirements 1.1, 2.2, 5.1, 12.9, 13.1
 */

// Polyfill TextEncoder/TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up CONFIG global before loading any modules
global.CONFIG = {
  wedding: {
    date: "2025-06-14T16:00:00-05:00",
    couple: { name1: "Karen", name2: "Nicolas" }
  },
  ceremony: {
    venue: "Hacienda El Roble",
    address: "Calle 10 #45-12, Medellín",
    mapsUrl: "https://maps.google.com/?q=Hacienda+El+Roble",
    time: "4:00 PM"
  },
  reception: {
    venue: "Salón Imperial",
    address: "Carrera 50 #30-20",
    startTime: "7:00 PM"
  },
  itinerary: [
    { time: "4:00 PM", description: "Ceremonia" },
    { time: "5:00 PM", description: "Cóctel" },
    { time: "7:00 PM", description: "Recepción y Cena" }
  ],
  dressCode: {
    text: "Formal / Black Tie Optional",
    colors: [
      { hex: "#2C3E50", name: "Navy" },
      { hex: "#8E44AD", name: "Purple" }
    ]
  },
  gift: {
    heading: "Lluvia de Sobres Digital",
    message: "Tu presencia es nuestro mejor regalo.",
    bankDetails: {
      bankName: "Bancolombia",
      accountHolder: "Karen & Nicolas",
      accountNumber: "1234-5678-9012"
    },
    paymentLink: "https://payment.example.com/link"
  },
  messages: [
    { heading: "Nuestra Historia", body: "Nos conocimos hace años..." }
  ],
  photos: [
    { src: "img/photos/photo1.jpg", alt: "Karen y Nicolas" },
    { src: "img/photos/photo2.jpg", alt: "En el parque" }
  ],
  logo: {
    src: "img/logo.png",
    alt: "Karen & Nicolas Wedding"
  },
  api: {
    baseUrl: "https://script.google.com/macros/s/TEST/exec"
  },
  admin: {
    passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
  }
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock crypto.subtle for Auth module
const KNOWN_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
const WRONG_HASH = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(async (algo, data) => {
        const text = new TextDecoder().decode(data);
        const hex = text === 'password' ? KNOWN_HASH : WRONG_HASH;
        const bytes = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
        return bytes.buffer;
      })
    }
  }
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock confirm for admin delete
global.confirm = jest.fn(() => true);

// Helper: set up guest page DOM
function setupGuestPageDOM() {
  document.body.innerHTML = `
    <header><div id="logo-container"></div></header>
    <div class="envelope-wrapper" style="display:none;">
      <div class="envelope-back"></div>
      <div class="envelope-flap"></div>
      <div class="card">
        <div class="card-content" style="display:none;">
          <p id="couple-greeting"></p>
          <h2 id="guest-greeting"></h2>
          <p id="ticket-count"></p>
        </div>
      </div>
    </div>
    <div id="error-page" style="display:none;">
      <p id="error-message"></p>
      <button id="retry-btn" style="display:none;">Intentar de nuevo</button>
    </div>
    <section id="countdown-section">
      <div class="countdown-display">
        <span id="countdown-days">00</span>
        <span id="countdown-hours">00</span>
        <span id="countdown-minutes">00</span>
        <span id="countdown-seconds">00</span>
      </div>
      <p id="countdown-message"></p>
    </section>
    <section id="event-details-section">
      <p id="ceremony-date"></p>
      <p id="ceremony-venue"></p>
      <p id="ceremony-address"></p>
      <a id="ceremony-map-link" href="#"></a>
      <div id="itinerary-section"><ul id="itinerary-list"></ul></div>
      <p id="reception-venue"></p>
      <p id="reception-address"></p>
      <p id="reception-time"></p>
    </section>
    <section id="photos-section"><div id="photos-grid"></div></section>
    <section id="messages-section"><div id="messages-container"></div></section>
    <section id="dresscode-section">
      <p id="dresscode-text"></p>
      <div id="dresscode-colors"></div>
    </section>
    <section id="gift-section">
      <h2 id="gift-heading"></h2>
      <p id="gift-message"></p>
      <div id="gift-bank-details">
        <span id="gift-bank-name"></span>
        <span id="gift-account-holder"></span>
        <span id="gift-account-number"></span>
      </div>
      <a id="gift-payment-link" href="#"></a>
      <p id="gift-instructions"></p>
    </section>
    <section id="rsvp-section">
      <form id="rsvp-form">
        <select id="rsvp-attendance"><option value="" disabled selected>Seleccionar...</option></select>
        <span id="rsvp-attendance-error" style="display:none;"></span>
        <div id="attendee-names-container" style="display:none;"></div>
        <span id="attendee-names-error" style="display:none;"></span>
        <input type="tel" id="rsvp-phone">
        <span id="rsvp-phone-error" style="display:none;"></span>
        <textarea id="rsvp-message"></textarea>
      </form>
      <div id="rsvp-confirmation" style="display:none;"></div>
      <div id="rsvp-error" style="display:none;">
        <p id="rsvp-error-message"></p>
        <button id="rsvp-retry-btn">Intentar de nuevo</button>
      </div>
    </section>
  `;
}

// Helper: set up admin page DOM
function setupAdminPageDOM() {
  document.body.innerHTML = `
    <div id="admin-login-form">
      <input type="password" id="admin-password" placeholder="Contraseña">
      <button id="admin-login-btn">Ingresar</button>
      <p id="admin-login-error" style="display:none;"></p>
    </div>
    <div id="admin-content" style="display:none;">
      <button id="admin-logout-btn">Cerrar sesión</button>
      <div id="guest-management"></div>
    </div>
  `;
}

// Helper: set window.location.search
function setURL(search) {
  delete window.location;
  window.location = { search: search };
}

// Helper: flush promises
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Load all modules (they attach to window globals)
require('../js/api.js');
require('../js/auth.js');
require('../js/validation.js');
require('../js/envelope.js');
require('../js/countdown.js');
require('../js/guest.js');
require('../js/event-details.js');
require('../js/photos.js');
require('../js/messages.js');
require('../js/dresscode.js');
require('../js/gift.js');
require('../js/logo.js');
require('../js/rsvp.js');
require('../js/admin.js');

// ─────────────────────────────────────────────
// 1. FULL GUEST FLOW
// ─────────────────────────────────────────────
describe('Integration: Full Guest Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupGuestPageDOM();
    localStorageMock.clear();
  });

  afterEach(() => {
    if (window.Countdown) window.Countdown.stop();
  });

  test('valid URL → API fetch → renders greeting, countdown, event details, photos', async () => {
    setURL('?guest=guest123');

    // Mock fetch to return guest data (API module uses fetch internally)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'María García', ticketCount: 3 })
    });

    // Override Envelope.init to immediately invoke callback (simulates envelope open)
    window.Envelope.init = jest.fn(cb => { if (cb) cb(); });

    // Initialize guest page
    window.GuestPage.init();
    await flushPromises();

    // Verify greeting rendered
    expect(document.getElementById('guest-greeting').textContent).toBe('María García');
    expect(document.getElementById('ticket-count').textContent).toBe('Tienes 3 lugares reservados');
    expect(document.getElementById('couple-greeting').textContent).toBe('Karen & Nicolas te invitan a su boda');

    // Initialize content sections (as index.html does)
    window.Countdown.start(CONFIG.wedding.date);
    window.EventDetails.init();
    window.Photos.init();
    window.Messages.init();
    window.DressCode.init();
    window.Gift.init();
    window.Logo.init();

    // Verify countdown started (days should be non-empty number)
    const daysEl = document.getElementById('countdown-days');
    expect(daysEl.textContent).toMatch(/\d+/);

    // Verify event details populated
    expect(document.getElementById('ceremony-venue').textContent).toBe('Hacienda El Roble');
    expect(document.getElementById('ceremony-address').textContent).toBe('Calle 10 #45-12, Medellín');
    expect(document.getElementById('reception-venue').textContent).toBe('Salón Imperial');
    expect(document.getElementById('reception-time').textContent).toBe('7:00 PM');

    // Verify itinerary rendered
    const itineraryItems = document.querySelectorAll('#itinerary-list li');
    expect(itineraryItems.length).toBe(3);

    // Verify photos rendered
    const photos = document.querySelectorAll('#photos-grid img');
    expect(photos.length).toBe(2);
    expect(photos[0].alt).toBe('Karen y Nicolas');

    // Verify messages rendered
    const messageBlocks = document.querySelectorAll('#messages-container .message-block');
    expect(messageBlocks.length).toBe(1);

    // Verify dress code rendered
    expect(document.getElementById('dresscode-text').textContent).toBe('Formal / Black Tie Optional');
    const swatches = document.querySelectorAll('#dresscode-colors .color-swatch');
    expect(swatches.length).toBe(2);

    // Verify gift section
    expect(document.getElementById('gift-heading').textContent).toBe('Lluvia de Sobres Digital');
    expect(document.getElementById('gift-bank-name').textContent).toBe('Bancolombia');
  });

  test('guest with 1 ticket shows singular message', async () => {
    setURL('?guest=solo1');

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Juan', ticketCount: 1 })
    });

    window.Envelope.init = jest.fn(cb => { if (cb) cb(); });
    window.GuestPage.init();
    await flushPromises();

    expect(document.getElementById('ticket-count').textContent).toBe('Tienes 1 lugar reservado');
  });
});

// ─────────────────────────────────────────────
// 2. RSVP FLOW
// ─────────────────────────────────────────────
describe('Integration: RSVP Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupGuestPageDOM();
  });

  test('init → fill form → validate → submit → confirmation shown', async () => {
    // Initialize RSVP with guest ID and ticket count
    window.RSVP.init('guest123', 3);

    // Verify dropdown has correct options (placeholder + "Lo siento" + 1,2,3)
    const dropdown = document.getElementById('rsvp-attendance');
    expect(dropdown.options.length).toBe(5);

    // Select "2" attendees
    dropdown.value = '2';
    dropdown.dispatchEvent(new Event('change'));

    // Verify attendee name fields appeared
    const nameInputs = document.querySelectorAll('#attendee-names-container .attendee-name-input');
    expect(nameInputs.length).toBe(2);

    // Fill in names
    nameInputs[0].value = 'María García';
    nameInputs[1].value = 'Pedro García';

    // Fill phone
    document.getElementById('rsvp-phone').value = '+573001234567';

    // Fill optional message
    document.getElementById('rsvp-message').value = '¡Felicitaciones!';

    // Mock API.submitRsvp success (the API module calls fetch internally)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Submit
    await window.RSVP.submit();

    // Verify form hidden, confirmation shown
    expect(document.getElementById('rsvp-form').style.display).toBe('none');
    const confirmation = document.getElementById('rsvp-confirmation');
    expect(confirmation.style.display).toBe('');
    expect(confirmation.textContent).toBe('¡Gracias por confirmar!');
  });

  test('validation fails when required fields are empty', () => {
    window.RSVP.init('guest123', 2);

    const result = window.RSVP.validate();

    expect(result.valid).toBe(false);
    expect(result.errors.attendance).toBeDefined();
    expect(result.errors.phone).toBeDefined();
  });

  test('shows error on API failure and preserves form data', async () => {
    window.RSVP.init('guest123', 2);

    // Fill valid data
    const dropdown = document.getElementById('rsvp-attendance');
    dropdown.value = '0';
    dropdown.dispatchEvent(new Event('change'));
    document.getElementById('rsvp-phone').value = '+573009876543';

    // Mock API failure
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: true, message: 'Server error' })
    });

    await window.RSVP.submit();

    // Form should still be visible (not hidden)
    expect(document.getElementById('rsvp-form').style.display).not.toBe('none');
    // Error should be displayed
    const errorContainer = document.getElementById('rsvp-error');
    expect(errorContainer.style.display).toBe('');
  });
});

// ─────────────────────────────────────────────
// 3. ADMIN FLOW
// ─────────────────────────────────────────────
describe('Integration: Admin Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAdminPageDOM();
    localStorageMock.clear();
  });

  test('login → shows management → create guest → appears in table', async () => {
    // Init admin (not authenticated)
    window.Auth.logout();
    window.Admin.init();

    // Verify login form visible, content hidden
    expect(document.getElementById('admin-login-form').style.display).toBe('');
    expect(document.getElementById('admin-content').style.display).toBe('none');

    // Fill password and click login
    document.getElementById('admin-password').value = 'password';

    // Mock getAllGuests for after login (Admin.init calls loadGuests after successful auth)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { id: 'g1', name: 'Existing Guest', ticketCount: 2, rsvpStatus: 'Pendiente' }
      ])
    });

    // Click login
    document.getElementById('admin-login-btn').click();
    await flushPromises();
    await flushPromises();

    // Verify login form hidden, admin content shown
    expect(document.getElementById('admin-login-form').style.display).toBe('none');
    expect(document.getElementById('admin-content').style.display).toBe('');

    // Wait for guest table to load
    await flushPromises();
    const tableRows = document.querySelectorAll('#guest-table tbody tr');
    expect(tableRows.length).toBe(1);
    expect(tableRows[0].querySelector('.guest-name-cell').textContent).toBe('Existing Guest');

    // Create a new guest
    document.getElementById('new-guest-name').value = 'New Guest';
    document.getElementById('new-guest-tickets').value = '4';

    // Mock createGuest API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'g2', link: 'https://nicolasykaren.com/?guest=g2' })
    });

    // Mock getAllGuests reload after create
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { id: 'g1', name: 'Existing Guest', ticketCount: 2, rsvpStatus: 'Pendiente' },
        { id: 'g2', name: 'New Guest', ticketCount: 4, rsvpStatus: 'Pendiente' }
      ])
    });

    // Submit create form
    const createForm = document.getElementById('create-guest-form');
    createForm.dispatchEvent(new Event('submit', { cancelable: true }));
    await flushPromises();
    await flushPromises();

    // Verify table now shows 2 guests
    const updatedRows = document.querySelectorAll('#guest-table tbody tr');
    expect(updatedRows.length).toBe(2);

    // Verify success message shown
    const successEl = document.getElementById('create-guest-success');
    expect(successEl.style.display).toBe('');
    expect(successEl.textContent).toContain('Invitado creado');
  });

  test('delete guest → removed from table', async () => {
    // Set up authenticated state
    localStorageMock.setItem('wedding_admin_session', JSON.stringify({
      authenticated: true,
      timestamp: Date.now(),
      token: KNOWN_HASH
    }));

    // Mock initial load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { id: 'g1', name: 'Guest One', ticketCount: 2, rsvpStatus: 'Pendiente' },
        { id: 'g2', name: 'Guest Two', ticketCount: 1, rsvpStatus: 'Confirmado' }
      ])
    });

    window.Admin.init();
    await flushPromises();
    await flushPromises();

    // Verify 2 rows initially
    expect(document.querySelectorAll('#guest-table tbody tr').length).toBe(2);

    // Mock delete API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Mock reload after delete (only 1 guest remaining)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { id: 'g1', name: 'Guest One', ticketCount: 2, rsvpStatus: 'Pendiente' }
      ])
    });

    // Click delete on second guest
    const deleteBtn = document.querySelector('button.btn-delete[data-id="g2"]');
    deleteBtn.click();
    await flushPromises();
    await flushPromises();

    // Verify only 1 guest remains
    const rows = document.querySelectorAll('#guest-table tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.guest-name-cell').textContent).toBe('Guest One');
  });

  test('logout → hides management, shows login form', async () => {
    // Set up authenticated state
    localStorageMock.setItem('wedding_admin_session', JSON.stringify({
      authenticated: true,
      timestamp: Date.now(),
      token: KNOWN_HASH
    }));

    // Mock initial load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    });

    window.Admin.init();
    await flushPromises();

    // Verify admin content visible
    expect(document.getElementById('admin-content').style.display).toBe('');

    // Click logout
    document.getElementById('admin-logout-btn').click();

    // Verify login form shown, content hidden
    expect(document.getElementById('admin-login-form').style.display).toBe('');
    expect(document.getElementById('admin-content').style.display).toBe('none');
  });
});

// ─────────────────────────────────────────────
// 4. ERROR FLOWS
// ─────────────────────────────────────────────
describe('Integration: Error Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupGuestPageDOM();
    localStorageMock.clear();
  });

  test('missing guest param → error page shown immediately', () => {
    setURL('');
    window.GuestPage.init();

    const errorPage = document.getElementById('error-page');
    const errorMessage = document.getElementById('error-message');

    expect(errorPage.style.display).toBe('block');
    expect(errorMessage.textContent).toBe('Este enlace no es válido.');

    // Envelope should be hidden
    const envelope = document.querySelector('.envelope-wrapper');
    expect(envelope.style.display).toBe('none');
  });

  test('API network failure → error page with retry button', async () => {
    setURL('?guest=abc123');

    // The API module uses fetch with AbortController. When fetch rejects,
    // the API module catches it and returns { error: true, message: "..." }.
    // So we mock fetch to reject with a TypeError (network error).
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')));

    window.Envelope.init = jest.fn(cb => { if (cb) cb(); });
    window.GuestPage.init();
    await flushPromises();
    await flushPromises();

    const errorPage = document.getElementById('error-page');
    const retryBtn = document.getElementById('retry-btn');

    expect(errorPage.style.display).toBe('block');
    expect(retryBtn.style.display).toBe('inline-block');

    // Mock successful retry
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Recovered Guest', ticketCount: 1 })
    });

    retryBtn.click();
    await flushPromises();
    await flushPromises();

    // After retry, greeting should render
    expect(document.getElementById('guest-greeting').textContent).toBe('Recovered Guest');
  });

  test('API returns server error → error page with retry', async () => {
    setURL('?guest=abc123');

    // Mock fetch returning non-ok response
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    window.Envelope.init = jest.fn(cb => { if (cb) cb(); });
    window.GuestPage.init();
    await flushPromises();
    await flushPromises();

    const errorPage = document.getElementById('error-page');
    expect(errorPage.style.display).toBe('block');

    const retryBtn = document.getElementById('retry-btn');
    expect(retryBtn.style.display).toBe('inline-block');
  });

  test('expired session → login form shown on admin page', () => {
    setupAdminPageDOM();

    // Set expired session (25 hours ago)
    localStorageMock.setItem('wedding_admin_session', JSON.stringify({
      authenticated: true,
      timestamp: Date.now() - (25 * 60 * 60 * 1000),
      token: KNOWN_HASH
    }));

    window.Admin.init();

    // Login form should be visible because session expired
    expect(document.getElementById('admin-login-form').style.display).toBe('');
    expect(document.getElementById('admin-content').style.display).toBe('none');
  });

  test('invalid guest ID → API returns not found → error page without retry', async () => {
    setURL('?guest=nonexistent');

    // The API module returns whatever JSON the server sends.
    // Guest.js checks for result.notFound to show invalid link error.
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: true, notFound: true })
    });

    window.Envelope.init = jest.fn(cb => { if (cb) cb(); });
    window.GuestPage.init();
    await flushPromises();
    await flushPromises();

    const errorPage = document.getElementById('error-page');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');

    expect(errorPage.style.display).toBe('block');
    expect(errorMessage.textContent).toBe('Este enlace no es válido.');
    expect(retryBtn.style.display).toBe('none');
  });
});
