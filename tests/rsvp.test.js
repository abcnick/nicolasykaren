/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the RSVP module
const rsvpCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'rsvp.js'), 'utf8');

function setupDOM() {
  document.body.innerHTML = `
    <section id="rsvp-section">
      <form id="rsvp-form">
        <select id="rsvp-attendance"></select>
        <span id="rsvp-attendance-error" style="display:none"></span>
        <div id="attendee-names-container"></div>
        <span id="attendee-names-error" style="display:none"></span>
        <input id="rsvp-phone" type="text" />
        <span id="rsvp-phone-error" style="display:none"></span>
        <textarea id="rsvp-message"></textarea>
        <button id="rsvp-submit-btn" type="submit">Confirmar</button>
      </form>
    </section>
  `;
}

function loadRSVP() {
  // Reset the global
  delete window.RSVP;
  eval(rsvpCode);
  return window.RSVP;
}

describe('RSVP Form Module', () => {
  let RSVP;

  beforeEach(() => {
    setupDOM();
    RSVP = loadRSVP();
  });

  describe('init(guestId, ticketCount)', () => {
    test('builds dropdown with placeholder, Lo siento, and numeric options 1 to ticketCount', () => {
      RSVP.init('guest123', 5);
      const dropdown = document.getElementById('rsvp-attendance');
      const options = dropdown.querySelectorAll('option');

      // placeholder + "Lo siento" + 5 numeric = 7 options
      expect(options.length).toBe(7);

      // Placeholder
      expect(options[0].value).toBe('');
      expect(options[0].textContent).toBe('Seleccionar...');
      expect(options[0].disabled).toBe(true);
      expect(options[0].selected).toBe(true);

      // Lo siento
      expect(options[1].value).toBe('0');
      expect(options[1].textContent).toBe('Lo siento');

      // Numeric 1-5
      for (let i = 1; i <= 5; i++) {
        expect(options[i + 1].value).toBe(String(i));
        expect(options[i + 1].textContent).toBe(String(i));
      }
    });

    test('builds dropdown with ticketCount=1 (minimum)', () => {
      RSVP.init('guest1', 1);
      const dropdown = document.getElementById('rsvp-attendance');
      const options = dropdown.querySelectorAll('option');

      // placeholder + "Lo siento" + 1 numeric = 3 options
      expect(options.length).toBe(3);
      expect(options[2].value).toBe('1');
      expect(options[2].textContent).toBe('1');
    });

    test('builds dropdown with ticketCount=20 (maximum)', () => {
      RSVP.init('guest1', 20);
      const dropdown = document.getElementById('rsvp-attendance');
      const options = dropdown.querySelectorAll('option');

      // placeholder + "Lo siento" + 20 numeric = 22 options
      expect(options.length).toBe(22);
      expect(options[21].value).toBe('20');
      expect(options[21].textContent).toBe('20');
    });

    test('sets maxlength=500 on message textarea', () => {
      RSVP.init('guest1', 3);
      const messageField = document.getElementById('rsvp-message');
      expect(messageField.getAttribute('maxlength')).toBe('500');
    });

    test('clears previous dropdown options on re-init', () => {
      RSVP.init('guest1', 3);
      RSVP.init('guest2', 5);
      const dropdown = document.getElementById('rsvp-attendance');
      const options = dropdown.querySelectorAll('option');
      // Should only have options from second init: placeholder + Lo siento + 5 = 7
      expect(options.length).toBe(7);
    });
  });

  describe('dropdown change behavior', () => {
    beforeEach(() => {
      RSVP.init('guest123', 5);
    });

    test('selecting "Lo siento" (0) hides attendee names container', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      const container = document.getElementById('attendee-names-container');

      dropdown.value = '0';
      dropdown.dispatchEvent(new Event('change'));

      expect(container.style.display).toBe('none');
      expect(container.innerHTML).toBe('');
    });

    test('selecting numeric value renders exactly K name input fields', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      const container = document.getElementById('attendee-names-container');

      dropdown.value = '3';
      dropdown.dispatchEvent(new Event('change'));

      const inputs = container.querySelectorAll('.attendee-name-input');
      expect(inputs.length).toBe(3);
    });

    test('each name input has correct type, class, maxlength, and placeholder', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      const container = document.getElementById('attendee-names-container');

      dropdown.value = '2';
      dropdown.dispatchEvent(new Event('change'));

      const inputs = container.querySelectorAll('.attendee-name-input');
      inputs.forEach((input) => {
        expect(input.type).toBe('text');
        expect(input.className).toBe('attendee-name-input');
        expect(input.maxLength).toBe(80);
        expect(input.placeholder).toBe('Nombre del acompañante');
      });
    });

    test('changing from numeric to "Lo siento" clears name fields', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      const container = document.getElementById('attendee-names-container');

      // First select 3
      dropdown.value = '3';
      dropdown.dispatchEvent(new Event('change'));
      expect(container.querySelectorAll('.attendee-name-input').length).toBe(3);

      // Then select Lo siento
      dropdown.value = '0';
      dropdown.dispatchEvent(new Event('change'));
      expect(container.querySelectorAll('.attendee-name-input').length).toBe(0);
      expect(container.style.display).toBe('none');
    });

    test('changing from one numeric to another re-renders correct number of fields', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      const container = document.getElementById('attendee-names-container');

      dropdown.value = '2';
      dropdown.dispatchEvent(new Event('change'));
      expect(container.querySelectorAll('.attendee-name-input').length).toBe(2);

      dropdown.value = '5';
      dropdown.dispatchEvent(new Event('change'));
      expect(container.querySelectorAll('.attendee-name-input').length).toBe(5);
    });

    test('selecting numeric value shows the attendee names container', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      const container = document.getElementById('attendee-names-container');

      // First hide it
      dropdown.value = '0';
      dropdown.dispatchEvent(new Event('change'));
      expect(container.style.display).toBe('none');

      // Now select numeric
      dropdown.value = '2';
      dropdown.dispatchEvent(new Event('change'));
      expect(container.style.display).toBe('');
    });
  });

  describe('_validatePhone(phone)', () => {
    test('accepts valid phone with 7 digits', () => {
      expect(RSVP._validatePhone('1234567')).toBe(true);
    });

    test('accepts valid phone with 15 digits', () => {
      expect(RSVP._validatePhone('123456789012345')).toBe(true);
    });

    test('accepts valid phone with leading + and 7 digits', () => {
      expect(RSVP._validatePhone('+1234567')).toBe(true);
    });

    test('accepts valid phone with leading + and 15 digits', () => {
      expect(RSVP._validatePhone('+123456789012345')).toBe(true);
    });

    test('accepts phone with 10 digits (typical)', () => {
      expect(RSVP._validatePhone('3001234567')).toBe(true);
    });

    test('accepts phone with + and 10 digits', () => {
      expect(RSVP._validatePhone('+573001234567')).toBe(true);
    });

    test('rejects phone with fewer than 7 digits', () => {
      expect(RSVP._validatePhone('123456')).toBe(false);
    });

    test('rejects phone with more than 15 digits', () => {
      expect(RSVP._validatePhone('1234567890123456')).toBe(false);
    });

    test('rejects phone with letters', () => {
      expect(RSVP._validatePhone('123abc4567')).toBe(false);
    });

    test('rejects phone with spaces', () => {
      expect(RSVP._validatePhone('123 456 7890')).toBe(false);
    });

    test('rejects phone with dashes', () => {
      expect(RSVP._validatePhone('123-456-7890')).toBe(false);
    });

    test('rejects phone with + in the middle', () => {
      expect(RSVP._validatePhone('123+4567890')).toBe(false);
    });

    test('rejects empty string', () => {
      expect(RSVP._validatePhone('')).toBe(false);
    });

    test('rejects non-string input', () => {
      expect(RSVP._validatePhone(1234567)).toBe(false);
      expect(RSVP._validatePhone(null)).toBe(false);
      expect(RSVP._validatePhone(undefined)).toBe(false);
    });

    test('rejects phone with parentheses', () => {
      expect(RSVP._validatePhone('(123)4567890')).toBe(false);
    });

    test('rejects just a plus sign', () => {
      expect(RSVP._validatePhone('+')).toBe(false);
    });
  });

  describe('validate()', () => {
    beforeEach(() => {
      RSVP.init('guest123', 5);
    });

    test('returns invalid when no option is selected (placeholder)', () => {
      const result = RSVP.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.attendance).toBeDefined();
    });

    test('returns invalid when phone is empty', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';

      const result = RSVP.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.phone).toBeDefined();
    });

    test('returns invalid when phone has invalid format', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      document.getElementById('rsvp-phone').value = 'abc';

      const result = RSVP.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.phone).toBeDefined();
    });

    test('returns valid when "Lo siento" selected with valid phone', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      document.getElementById('rsvp-phone').value = '+573001234567';

      const result = RSVP.validate();
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    test('returns invalid when numeric attendance selected but name fields empty', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '3';
      dropdown.dispatchEvent(new Event('change'));
      document.getElementById('rsvp-phone').value = '+573001234567';

      const result = RSVP.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.attendeeNames).toBeDefined();
    });

    test('returns invalid when some name fields empty', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '3';
      dropdown.dispatchEvent(new Event('change'));

      const inputs = document.querySelectorAll('.attendee-name-input');
      inputs[0].value = 'Alice';
      inputs[1].value = '';  // Empty
      inputs[2].value = 'Charlie';

      document.getElementById('rsvp-phone').value = '3001234567';

      const result = RSVP.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.attendeeNames).toBeDefined();
    });

    test('returns valid when numeric attendance selected with all names filled and valid phone', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '2';
      dropdown.dispatchEvent(new Event('change'));

      const inputs = document.querySelectorAll('.attendee-name-input');
      inputs[0].value = 'Alice';
      inputs[1].value = 'Bob';

      document.getElementById('rsvp-phone').value = '+573001234567';

      const result = RSVP.validate();
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    test('does not require message field (optional)', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      document.getElementById('rsvp-phone').value = '1234567890';
      document.getElementById('rsvp-message').value = '';

      const result = RSVP.validate();
      expect(result.valid).toBe(true);
    });

    test('valid with message field filled', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      document.getElementById('rsvp-phone').value = '1234567890';
      document.getElementById('rsvp-message').value = 'Looking forward to it!';

      const result = RSVP.validate();
      expect(result.valid).toBe(true);
    });

    test('returns multiple errors when multiple fields invalid', () => {
      // Leave everything empty (placeholder selected)
      const result = RSVP.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.attendance).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    });

    test('shows inline error messages on validation failure', () => {
      RSVP.validate();

      const attendanceError = document.getElementById('rsvp-attendance-error');
      const phoneError = document.getElementById('rsvp-phone-error');

      expect(attendanceError.textContent).not.toBe('');
      expect(attendanceError.style.display).not.toBe('none');
      expect(phoneError.textContent).not.toBe('');
      expect(phoneError.style.display).not.toBe('none');
    });

    test('clears error messages when validation passes', () => {
      // First trigger errors
      RSVP.validate();

      // Now fix and validate again
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      document.getElementById('rsvp-phone').value = '1234567890';

      RSVP.validate();

      const attendanceError = document.getElementById('rsvp-attendance-error');
      const phoneError = document.getElementById('rsvp-phone-error');

      expect(attendanceError.textContent).toBe('');
      expect(attendanceError.style.display).toBe('none');
      expect(phoneError.textContent).toBe('');
      expect(phoneError.style.display).toBe('none');
    });

    test('preserves entered data on validation failure', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '2';
      dropdown.dispatchEvent(new Event('change'));

      const inputs = document.querySelectorAll('.attendee-name-input');
      inputs[0].value = 'Alice';
      inputs[1].value = ''; // Leave empty to trigger error

      document.getElementById('rsvp-phone').value = '+573001234567';
      document.getElementById('rsvp-message').value = 'A message';

      RSVP.validate();

      // Data should be preserved
      expect(dropdown.value).toBe('2');
      expect(inputs[0].value).toBe('Alice');
      expect(document.getElementById('rsvp-phone').value).toBe('+573001234567');
      expect(document.getElementById('rsvp-message').value).toBe('A message');
    });

    test('whitespace-only name is considered empty', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '1';
      dropdown.dispatchEvent(new Event('change'));

      const inputs = document.querySelectorAll('.attendee-name-input');
      inputs[0].value = '   ';

      document.getElementById('rsvp-phone').value = '1234567890';

      const result = RSVP.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.attendeeNames).toBeDefined();
    });

    test('does not validate attendee names when "Lo siento" is selected', () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      document.getElementById('rsvp-phone').value = '1234567890';

      const result = RSVP.validate();
      expect(result.valid).toBe(true);
      expect(result.errors.attendeeNames).toBeUndefined();
    });
  });

  describe('exposed API', () => {
    test('window.RSVP exposes init, validate, submit, and _validatePhone', () => {
      expect(typeof window.RSVP.init).toBe('function');
      expect(typeof window.RSVP.validate).toBe('function');
      expect(typeof window.RSVP.submit).toBe('function');
      expect(typeof window.RSVP._validatePhone).toBe('function');
    });
  });
});

describe('RSVP Submit Module', () => {
  let RSVP;

  function setupSubmitDOM() {
    document.body.innerHTML = `
      <section id="rsvp-section">
        <form id="rsvp-form">
          <select id="rsvp-attendance"></select>
          <span id="rsvp-attendance-error" style="display:none"></span>
          <div id="attendee-names-container"></div>
          <span id="attendee-names-error" style="display:none"></span>
          <input id="rsvp-phone" type="text" />
          <span id="rsvp-phone-error" style="display:none"></span>
          <textarea id="rsvp-message"></textarea>
          <button id="rsvp-submit-btn" type="submit">Confirmar</button>
        </form>
        <div id="rsvp-confirmation" style="display:none"></div>
        <div id="rsvp-error" style="display:none">
          <span id="rsvp-error-message"></span>
          <button id="rsvp-retry-btn">Reintentar</button>
        </div>
      </section>
    `;
  }

  function loadRSVPModule() {
    delete window.RSVP;
    eval(rsvpCode);
    return window.RSVP;
  }

  function fillValidForm(attendance, names, phone, message) {
    const dropdown = document.getElementById('rsvp-attendance');
    dropdown.value = String(attendance);
    dropdown.dispatchEvent(new Event('change'));

    if (attendance > 0) {
      const inputs = document.querySelectorAll('.attendee-name-input');
      names.forEach((name, i) => {
        if (inputs[i]) inputs[i].value = name;
      });
    }

    document.getElementById('rsvp-phone').value = phone;
    if (message !== undefined) {
      document.getElementById('rsvp-message').value = message;
    }
  }

  beforeEach(() => {
    setupSubmitDOM();
    RSVP = loadRSVPModule();
    RSVP.init('guest123', 5);
    // Mock the API
    window.API = {
      submitRsvp: jest.fn()
    };
  });

  afterEach(() => {
    delete window.API;
  });

  describe('submit() — payload construction', () => {
    test('constructs correct payload when declining (attendance=0)', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });

      fillValidForm(0, [], '+573001234567', 'Best wishes!');
      await RSVP.submit();

      expect(window.API.submitRsvp).toHaveBeenCalledWith('guest123', {
        guestId: 'guest123',
        attendance: 0,
        attendeeNames: [],
        phoneNumber: '+573001234567',
        message: 'Best wishes!'
      });
    });

    test('constructs correct payload when attending with names', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });

      fillValidForm(2, ['Alice', 'Bob'], '3001234567', 'See you there!');
      await RSVP.submit();

      expect(window.API.submitRsvp).toHaveBeenCalledWith('guest123', {
        guestId: 'guest123',
        attendance: 2,
        attendeeNames: ['Alice', 'Bob'],
        phoneNumber: '3001234567',
        message: 'See you there!'
      });
    });

    test('message defaults to empty string when not filled', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });

      fillValidForm(0, [], '1234567890', '');
      await RSVP.submit();

      expect(window.API.submitRsvp).toHaveBeenCalledWith('guest123', expect.objectContaining({
        message: ''
      }));
    });

    test('trims attendee names in payload', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });

      fillValidForm(1, ['  Alice  '], '1234567890', '');
      await RSVP.submit();

      expect(window.API.submitRsvp).toHaveBeenCalledWith('guest123', expect.objectContaining({
        attendeeNames: ['Alice']
      }));
    });

    test('trims phone number in payload', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });

      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      dropdown.dispatchEvent(new Event('change'));
      document.getElementById('rsvp-phone').value = '  1234567890  ';
      document.getElementById('rsvp-message').value = '';

      await RSVP.submit();

      expect(window.API.submitRsvp).toHaveBeenCalledWith('guest123', expect.objectContaining({
        phoneNumber: '1234567890'
      }));
    });

    test('includes guestId from init in payload', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });

      // Re-init with different guestId
      RSVP.init('different-guest', 3);
      fillValidForm(0, [], '1234567890', '');
      await RSVP.submit();

      expect(window.API.submitRsvp).toHaveBeenCalledWith('different-guest', expect.objectContaining({
        guestId: 'different-guest'
      }));
    });
  });

  describe('submit() — validation gate', () => {
    test('does not call API when form is invalid', async () => {
      // Leave form empty — validation will fail
      await RSVP.submit();

      expect(window.API.submitRsvp).not.toHaveBeenCalled();
    });

    test('does not call API when phone is invalid', async () => {
      const dropdown = document.getElementById('rsvp-attendance');
      dropdown.value = '0';
      document.getElementById('rsvp-phone').value = 'invalid';

      await RSVP.submit();

      expect(window.API.submitRsvp).not.toHaveBeenCalled();
    });
  });

  describe('submit() — success behavior', () => {
    test('hides form on success', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const form = document.getElementById('rsvp-form');
      expect(form.style.display).toBe('none');
    });

    test('shows confirmation message "¡Gracias por confirmar!" on success', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const confirmation = document.getElementById('rsvp-confirmation');
      expect(confirmation.style.display).toBe('');
      expect(confirmation.textContent).toBe('¡Gracias por confirmar!');
    });
  });

  describe('submit() — error handling', () => {
    test('shows error container on API error response', async () => {
      window.API.submitRsvp.mockResolvedValue({ error: true, message: 'Server error' });
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const errorContainer = document.getElementById('rsvp-error');
      expect(errorContainer.style.display).toBe('');
    });

    test('displays error message from API response', async () => {
      window.API.submitRsvp.mockResolvedValue({ error: true, message: 'Server error' });
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const errorMessage = document.getElementById('rsvp-error-message');
      expect(errorMessage.textContent).toBe('Server error');
    });

    test('shows default error message on network exception', async () => {
      window.API.submitRsvp.mockRejectedValue(new Error('Network failure'));
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const errorMessage = document.getElementById('rsvp-error-message');
      expect(errorMessage.textContent).toBe('No pudimos conectar. Por favor intenta de nuevo.');
    });

    test('shows default error when API returns error without message', async () => {
      window.API.submitRsvp.mockResolvedValue({ error: true });
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const errorMessage = document.getElementById('rsvp-error-message');
      expect(errorMessage.textContent).toBe('No pudimos conectar. Por favor intenta de nuevo.');
    });

    test('preserves form data on error', async () => {
      window.API.submitRsvp.mockRejectedValue(new Error('Network failure'));
      fillValidForm(2, ['Alice', 'Bob'], '+573001234567', 'Hello!');

      await RSVP.submit();

      // Data should still be in the DOM
      const dropdown = document.getElementById('rsvp-attendance');
      expect(dropdown.value).toBe('2');

      const inputs = document.querySelectorAll('.attendee-name-input');
      expect(inputs[0].value).toBe('Alice');
      expect(inputs[1].value).toBe('Bob');

      expect(document.getElementById('rsvp-phone').value).toBe('+573001234567');
      expect(document.getElementById('rsvp-message').value).toBe('Hello!');
    });

    test('form remains visible on error', async () => {
      window.API.submitRsvp.mockRejectedValue(new Error('Network failure'));
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const form = document.getElementById('rsvp-form');
      expect(form.style.display).not.toBe('none');
    });

    test('retry button triggers submit again', async () => {
      // First call fails, second succeeds
      window.API.submitRsvp
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockResolvedValueOnce({ success: true });

      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      // Error should be shown
      const errorContainer = document.getElementById('rsvp-error');
      expect(errorContainer.style.display).toBe('');

      // Click retry
      const retryBtn = document.getElementById('rsvp-retry-btn');
      retryBtn.click();

      // Wait for the async retry to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Second call should succeed — form hidden, confirmation shown
      expect(window.API.submitRsvp).toHaveBeenCalledTimes(2);
      expect(document.getElementById('rsvp-form').style.display).toBe('none');
      expect(document.getElementById('rsvp-confirmation').textContent).toBe('¡Gracias por confirmar!');
    });

    test('retry button hides error container before retrying', async () => {
      window.API.submitRsvp.mockRejectedValue(new Error('Network failure'));
      fillValidForm(0, [], '1234567890', '');

      await RSVP.submit();

      const errorContainer = document.getElementById('rsvp-error');
      expect(errorContainer.style.display).toBe('');

      // Mock success for retry
      window.API.submitRsvp.mockResolvedValue({ success: true });

      const retryBtn = document.getElementById('rsvp-retry-btn');
      retryBtn.click();

      // The error container should be hidden immediately when retry is clicked
      expect(errorContainer.style.display).toBe('none');
    });
  });

  describe('submit() — upsert behavior', () => {
    test('calls API with same guestId for repeated submissions (upsert)', async () => {
      window.API.submitRsvp.mockResolvedValue({ success: true });

      // First submission
      fillValidForm(1, ['Alice'], '1234567890', 'First');
      await RSVP.submit();

      // Re-setup form (simulate going back to form)
      setupSubmitDOM();
      RSVP = loadRSVPModule();
      RSVP.init('guest123', 5);
      window.API.submitRsvp = jest.fn().mockResolvedValue({ success: true });

      fillValidForm(2, ['Alice', 'Bob'], '1234567890', 'Updated');
      await RSVP.submit();

      // Should call with same guestId — backend handles upsert
      expect(window.API.submitRsvp).toHaveBeenCalledWith('guest123', expect.objectContaining({
        guestId: 'guest123',
        attendance: 2,
        attendeeNames: ['Alice', 'Bob']
      }));
    });
  });
});
