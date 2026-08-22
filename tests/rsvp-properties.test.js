/**
 * @jest-environment jsdom
 */

// Feature: wedding-invitation-site, Property 12: RSVP Form Generation from Ticket Count
// Feature: wedding-invitation-site, Property 13: Phone Number Validation
// Feature: wedding-invitation-site, Property 14: RSVP Form Validation
// Feature: wedding-invitation-site, Property 15: RSVP Payload Construction
// Feature: wedding-invitation-site, Property 16: RSVP Upsert Behavior

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// Load the RSVP module source
const rsvpCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'rsvp.js'), 'utf8');

/**
 * Set up the RSVP form DOM structure needed for all tests.
 */
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
      <div id="rsvp-confirmation" style="display:none"></div>
      <div id="rsvp-error" style="display:none">
        <span id="rsvp-error-message"></span>
        <button id="rsvp-retry-btn">Reintentar</button>
      </div>
    </section>
  `;
}

/**
 * Load (or reload) the RSVP module into the global scope.
 */
function loadRSVP() {
  delete window.RSVP;
  eval(rsvpCode);
  return window.RSVP;
}

// ============================================================================
// Property 12: RSVP Form Generation from Ticket Count
// **Validates: Requirements 12.1, 12.3**
// ============================================================================

describe('Property 12: RSVP Form Generation from Ticket Count', () => {
  let RSVP;

  beforeEach(() => {
    setupDOM();
    RSVP = loadRSVP();
  });

  it('dropdown has exactly N+1 selectable options (Lo siento + 1..N) for any ticketCount 1-20', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (ticketCount) => {
          setupDOM();
          RSVP = loadRSVP();
          RSVP.init('test-guest', ticketCount);

          const dropdown = document.getElementById('rsvp-attendance');
          const options = dropdown.querySelectorAll('option');

          // Total options = 1 placeholder (disabled) + 1 "Lo siento" + N numeric = N + 2
          // Selectable options (non-disabled) = "Lo siento" + N numeric = N + 1
          const selectableOptions = Array.from(options).filter(opt => !opt.disabled);
          expect(selectableOptions.length).toBe(ticketCount + 1);

          // First selectable option is "Lo siento" (value = '0')
          expect(selectableOptions[0].value).toBe('0');
          expect(selectableOptions[0].textContent).toBe('Lo siento');

          // Remaining are numeric 1 through N
          for (let i = 1; i <= ticketCount; i++) {
            expect(selectableOptions[i].value).toBe(String(i));
            expect(selectableOptions[i].textContent).toBe(String(i));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('selecting K renders exactly K name input fields for any K in 1..N', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (ticketCount, rawK) => {
          // K must be in range 1..ticketCount
          const K = ((rawK - 1) % ticketCount) + 1;

          setupDOM();
          RSVP = loadRSVP();
          RSVP.init('test-guest', ticketCount);

          const dropdown = document.getElementById('rsvp-attendance');
          dropdown.value = String(K);
          dropdown.dispatchEvent(new Event('change'));

          const container = document.getElementById('attendee-names-container');
          const inputs = container.querySelectorAll('.attendee-name-input');
          expect(inputs.length).toBe(K);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('selecting "Lo siento" (0) results in zero name input fields', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (ticketCount) => {
          setupDOM();
          RSVP = loadRSVP();
          RSVP.init('test-guest', ticketCount);

          const dropdown = document.getElementById('rsvp-attendance');
          dropdown.value = '0';
          dropdown.dispatchEvent(new Event('change'));

          const container = document.getElementById('attendee-names-container');
          const inputs = container.querySelectorAll('.attendee-name-input');
          expect(inputs.length).toBe(0);
          expect(container.style.display).toBe('none');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 13: Phone Number Validation
// **Validates: Requirements 12.4**
// ============================================================================

describe('Property 13: Phone Number Validation', () => {
  let RSVP;

  beforeEach(() => {
    setupDOM();
    RSVP = loadRSVP();
  });

  const phoneRegex = /^\+?\d{7,15}$/;

  it('accepts strings that match /^\\+?\\d{7,15}$/ and rejects all others', () => {
    // Generate arbitrary strings including digits, letters, symbols
    const arbitraryStringArb = fc.string({ minLength: 0, maxLength: 30 });

    fc.assert(
      fc.property(
        arbitraryStringArb,
        (str) => {
          const expected = phoneRegex.test(str);
          const actual = RSVP._validatePhone(str);
          expect(actual).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always accepts valid phone numbers (optional + followed by 7-15 digits)', () => {
    // Generator for valid phone numbers
    const validPhoneArb = fc.tuple(
      fc.boolean(), // whether to include leading +
      fc.integer({ min: 7, max: 15 }) // number of digits
    ).chain(([hasPlus, digitCount]) => {
      return fc.stringOf(
        fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
        { minLength: digitCount, maxLength: digitCount }
      ).map(digits => hasPlus ? '+' + digits : digits);
    });

    fc.assert(
      fc.property(
        validPhoneArb,
        (phone) => {
          expect(RSVP._validatePhone(phone)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects strings with fewer than 7 digits', () => {
    const shortDigitArb = fc.stringOf(
      fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
      { minLength: 0, maxLength: 6 }
    ).map(digits => {
      // Optionally add a leading +
      return Math.random() > 0.5 ? '+' + digits : digits;
    });

    fc.assert(
      fc.property(
        shortDigitArb,
        (phone) => {
          expect(RSVP._validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects strings with more than 15 digits', () => {
    const longDigitArb = fc.stringOf(
      fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
      { minLength: 16, maxLength: 25 }
    ).map(digits => {
      return Math.random() > 0.5 ? '+' + digits : digits;
    });

    fc.assert(
      fc.property(
        longDigitArb,
        (phone) => {
          expect(RSVP._validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects strings containing non-digit characters (other than leading +)', () => {
    // Strings that contain at least one non-digit, non-leading-plus character
    const invalidCharArb = fc.stringOf(
      fc.constantFrom('a', 'b', 'c', ' ', '-', '(', ')', '.', '#', '@'),
      { minLength: 1, maxLength: 5 }
    ).chain(invalidPart => {
      return fc.stringOf(
        fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
        { minLength: 3, maxLength: 10 }
      ).map(digits => digits + invalidPart + digits);
    });

    fc.assert(
      fc.property(
        invalidCharArb,
        (phone) => {
          expect(RSVP._validatePhone(phone)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects non-string inputs', () => {
    const nonStringArb = fc.oneof(
      fc.integer(),
      fc.constant(null),
      fc.constant(undefined),
      fc.boolean(),
      fc.array(fc.integer()),
      fc.object()
    );

    fc.assert(
      fc.property(
        nonStringArb,
        (input) => {
          expect(RSVP._validatePhone(input)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 14: RSVP Form Validation
// **Validates: Requirements 12.6, 12.7**
// ============================================================================

describe('Property 14: RSVP Form Validation', () => {
  let RSVP;

  beforeEach(() => {
    setupDOM();
    RSVP = loadRSVP();
  });

  // Generator for a valid phone number
  const validPhoneArb = fc.tuple(
    fc.boolean(),
    fc.integer({ min: 7, max: 15 })
  ).chain(([hasPlus, digitCount]) => {
    return fc.stringOf(
      fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
      { minLength: digitCount, maxLength: digitCount }
    ).map(digits => hasPlus ? '+' + digits : digits);
  });

  // Generator for an invalid phone number
  const invalidPhoneArb = fc.oneof(
    fc.constant(''),
    fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 1, maxLength: 6 }),
    fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 16, maxLength: 20 }),
    fc.stringOf(fc.constantFrom('a', 'b', ' ', '-'), { minLength: 1, maxLength: 10 })
  );

  // Generator for a non-empty name string (1-80 chars)
  const validNameArb = fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0);

  it('validation passes iff: dropdown selected, names non-empty when attendance>0, phone valid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),  // ticketCount
        fc.boolean(),                       // isDropdownSelected
        fc.integer({ min: 0, max: 10 }),    // attendance value (0 = Lo siento)
        fc.boolean(),                       // allNamesFilled
        fc.boolean(),                       // phoneIsValid
        (ticketCount, isDropdownSelected, rawAttendance, allNamesFilled, phoneIsValid) => {
          const attendance = Math.min(rawAttendance, ticketCount);

          setupDOM();
          RSVP = loadRSVP();
          RSVP.init('test-guest', ticketCount);

          const dropdown = document.getElementById('rsvp-attendance');

          if (!isDropdownSelected) {
            // Leave placeholder selected (value = '')
            dropdown.value = '';
          } else {
            dropdown.value = String(attendance);
            dropdown.dispatchEvent(new Event('change'));
          }

          // Fill name fields
          if (isDropdownSelected && attendance > 0) {
            const inputs = document.querySelectorAll('.attendee-name-input');
            for (let i = 0; i < inputs.length; i++) {
              if (allNamesFilled) {
                inputs[i].value = 'Name ' + (i + 1);
              } else {
                // Leave at least one empty
                inputs[i].value = i === 0 ? '' : 'Name ' + i;
              }
            }
          }

          // Set phone
          if (phoneIsValid) {
            document.getElementById('rsvp-phone').value = '+5731234567';
          } else {
            document.getElementById('rsvp-phone').value = 'invalid';
          }

          const result = RSVP.validate();

          // Expected: valid iff dropdown is selected AND (attendance==0 OR all names filled) AND phone valid
          const expectedValid = isDropdownSelected &&
            (attendance === 0 || allNamesFilled) &&
            phoneIsValid;

          expect(result.valid).toBe(expectedValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when validation fails, error output identifies the specific invalid fields', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.constantFrom('none', 'attendance', 'names', 'phone', 'all'),
        (ticketCount, failureType) => {
          setupDOM();
          RSVP = loadRSVP();
          RSVP.init('test-guest', ticketCount);

          const dropdown = document.getElementById('rsvp-attendance');

          if (failureType === 'none') {
            // Valid form
            dropdown.value = '0';
            dropdown.dispatchEvent(new Event('change'));
            document.getElementById('rsvp-phone').value = '+5731234567';
          } else if (failureType === 'attendance') {
            // Dropdown not selected
            dropdown.value = '';
            document.getElementById('rsvp-phone').value = '+5731234567';
          } else if (failureType === 'names') {
            // Names empty — use a value within valid range
            dropdown.value = '1';
            dropdown.dispatchEvent(new Event('change'));
            // Leave names empty
            document.getElementById('rsvp-phone').value = '+5731234567';
          } else if (failureType === 'phone') {
            // Invalid phone
            dropdown.value = '0';
            dropdown.dispatchEvent(new Event('change'));
            document.getElementById('rsvp-phone').value = 'abc';
          } else {
            // All invalid
            dropdown.value = '';
            document.getElementById('rsvp-phone').value = '';
          }

          const result = RSVP.validate();

          if (failureType === 'none') {
            expect(result.valid).toBe(true);
            expect(Object.keys(result.errors).length).toBe(0);
          } else if (failureType === 'attendance') {
            expect(result.valid).toBe(false);
            expect(result.errors.attendance).toBeDefined();
          } else if (failureType === 'names') {
            expect(result.valid).toBe(false);
            expect(result.errors.attendeeNames).toBeDefined();
          } else if (failureType === 'phone') {
            expect(result.valid).toBe(false);
            expect(result.errors.phone).toBeDefined();
          } else {
            expect(result.valid).toBe(false);
            expect(result.errors.attendance).toBeDefined();
            expect(result.errors.phone).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 15: RSVP Payload Construction
// **Validates: Requirements 13.2**
// ============================================================================

describe('Property 15: RSVP Payload Construction', () => {
  let RSVP;

  beforeEach(() => {
    setupDOM();
    RSVP = loadRSVP();
    // Mock the API
    window.API = {
      submitRsvp: jest.fn().mockResolvedValue({ success: true })
    };
  });

  afterEach(() => {
    delete window.API;
  });

  // Generator for valid phone
  const validPhoneArb = fc.tuple(
    fc.boolean(),
    fc.integer({ min: 7, max: 15 })
  ).chain(([hasPlus, digitCount]) => {
    return fc.stringOf(
      fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
      { minLength: digitCount, maxLength: digitCount }
    ).map(digits => hasPlus ? '+' + digits : digits);
  });

  // Generator for attendee name (1-80 chars, non-empty after trim)
  const attendeeNameArb = fc.stringOf(
    fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'a', 'b', 'c', 'd', 'e', 'f', ' '),
    { minLength: 1, maxLength: 80 }
  ).filter(s => s.trim().length > 0);

  // Generator for optional message (0-500 chars)
  const messageArb = fc.string({ minLength: 0, maxLength: 500 });

  it('payload includes guestId, attendance (0-20), attendeeNames, phoneNumber, and message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),      // ticketCount
        fc.integer({ min: 0, max: 20 }),       // rawAttendance
        validPhoneArb,                          // phone
        messageArb,                             // message
        async (ticketCount, rawAttendance, phone, message) => {
          const attendance = Math.min(rawAttendance, ticketCount);
          const guestId = 'guest-' + ticketCount + '-' + attendance;

          setupDOM();
          RSVP = loadRSVP();
          window.API = { submitRsvp: jest.fn().mockResolvedValue({ success: true }) };
          RSVP.init(guestId, ticketCount);

          const dropdown = document.getElementById('rsvp-attendance');
          dropdown.value = String(attendance);
          dropdown.dispatchEvent(new Event('change'));

          // Fill name fields if attendance > 0
          if (attendance > 0) {
            const inputs = document.querySelectorAll('.attendee-name-input');
            for (let i = 0; i < inputs.length; i++) {
              inputs[i].value = 'Attendee ' + (i + 1);
            }
          }

          document.getElementById('rsvp-phone').value = phone;
          document.getElementById('rsvp-message').value = message;

          await RSVP.submit();

          expect(window.API.submitRsvp).toHaveBeenCalledTimes(1);

          const callArgs = window.API.submitRsvp.mock.calls[0];
          const payload = callArgs[1];

          // Verify required fields present
          expect(payload).toHaveProperty('guestId', guestId);
          expect(payload).toHaveProperty('attendance', attendance);
          expect(payload).toHaveProperty('attendeeNames');
          expect(payload).toHaveProperty('phoneNumber');
          expect(payload).toHaveProperty('message');

          // Verify attendance is an integer 0-20
          expect(Number.isInteger(payload.attendance)).toBe(true);
          expect(payload.attendance).toBeGreaterThanOrEqual(0);
          expect(payload.attendance).toBeLessThanOrEqual(20);

          // Verify attendeeNames is an array with correct length
          expect(Array.isArray(payload.attendeeNames)).toBe(true);
          if (attendance === 0) {
            expect(payload.attendeeNames.length).toBe(0);
          } else {
            expect(payload.attendeeNames.length).toBe(attendance);
          }

          // Verify each name is ≤ 80 characters
          payload.attendeeNames.forEach(name => {
            expect(typeof name).toBe('string');
            expect(name.length).toBeLessThanOrEqual(80);
            expect(name.length).toBeGreaterThan(0);
          });

          // Verify phone matches format
          expect(/^\+?\d{7,15}$/.test(payload.phoneNumber)).toBe(true);

          // Verify message ≤ 500 characters
          expect(typeof payload.message).toBe('string');
          expect(payload.message.length).toBeLessThanOrEqual(500);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 16: RSVP Upsert Behavior
// **Validates: Requirements 13.5**
// ============================================================================

describe('Property 16: RSVP Upsert Behavior', () => {
  let RSVP;

  beforeEach(() => {
    setupDOM();
    RSVP = loadRSVP();
  });

  afterEach(() => {
    delete window.API;
  });

  it('API.submitRsvp is always called with the same guestId for repeated submissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),  // guestId
        fc.integer({ min: 1, max: 5 }),   // number of submissions
        fc.integer({ min: 1, max: 10 }),  // ticketCount
        async (guestId, submissionCount, ticketCount) => {
          const allCallGuestIds = [];

          for (let sub = 0; sub < submissionCount; sub++) {
            setupDOM();
            RSVP = loadRSVP();
            window.API = { submitRsvp: jest.fn().mockResolvedValue({ success: true }) };
            RSVP.init(guestId, ticketCount);

            const dropdown = document.getElementById('rsvp-attendance');
            dropdown.value = '0'; // Lo siento for simplicity
            dropdown.dispatchEvent(new Event('change'));
            document.getElementById('rsvp-phone').value = '+5731234567';
            document.getElementById('rsvp-message').value = 'Submission ' + sub;

            await RSVP.submit();

            if (window.API.submitRsvp.mock.calls.length > 0) {
              const callArgs = window.API.submitRsvp.mock.calls[0];
              allCallGuestIds.push(callArgs[0]); // First arg is guestId
              allCallGuestIds.push(callArgs[1].guestId); // Also in payload
            }
          }

          // All calls should use the same guestId
          allCallGuestIds.forEach(id => {
            expect(id).toBe(guestId);
          });

          // The backend handles actual upsert — we verify the client always
          // sends the same guestId, ensuring at most 1 record per guest
        }
      ),
      { numRuns: 100 }
    );
  });
});
