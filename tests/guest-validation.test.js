// Feature: wedding-invitation-site, Property 1: Guest Input Validation
// **Validates: Requirements 1.2, 3.4**

const fc = require('fast-check');
const { validateGuestInput } = require('../js/validation');

describe('Property 1: Guest Input Validation', () => {

  // Property: Empty strings are rejected with a name error
  it('rejects empty name strings', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        fc.integer({ min: 1, max: 20 }),
        (name, ticketCount) => {
          const result = validateGuestInput(name, ticketCount);
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.name).toBeDefined();
          expect(typeof result.errors.name).toBe('string');
          expect(result.errors.name.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Whitespace-only strings are rejected with a name error
  it('rejects whitespace-only name strings', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0 && s.length <= 100),
        fc.integer({ min: 1, max: 20 }),
        (name, ticketCount) => {
          const result = validateGuestInput(name, ticketCount);
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.name).toBeDefined();
          expect(typeof result.errors.name).toBe('string');
          expect(result.errors.name.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Strings exceeding 100 characters are rejected with a name error
  it('rejects name strings exceeding 100 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 500 }).filter(s => s.length > 100),
        fc.integer({ min: 1, max: 20 }),
        (name, ticketCount) => {
          const result = validateGuestInput(name, ticketCount);
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.name).toBeDefined();
          expect(typeof result.errors.name).toBe('string');
          expect(result.errors.name.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Non-integer ticket counts (floats, NaN, Infinity) are rejected with a ticketCount error
  it('rejects non-integer ticket counts', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.oneof(
          fc.double().filter(n => !Number.isInteger(n)),
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity)
        ),
        (name, ticketCount) => {
          const result = validateGuestInput(name, ticketCount);
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.ticketCount).toBeDefined();
          expect(typeof result.errors.ticketCount).toBe('string');
          expect(result.errors.ticketCount.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Ticket counts outside range 1-20 are rejected with a ticketCount error
  it('rejects ticket counts outside range 1-20', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.oneof(
          fc.integer({ min: -1000, max: 0 }),
          fc.integer({ min: 21, max: 1000 })
        ),
        (name, ticketCount) => {
          const result = validateGuestInput(name, ticketCount);
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors.ticketCount).toBeDefined();
          expect(typeof result.errors.ticketCount).toBe('string');
          expect(result.errors.ticketCount.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: Valid inputs (1-100 char non-whitespace name + integer 1-20) are accepted
  it('accepts valid inputs (1-100 char name with non-whitespace content and integer 1-20)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1, max: 20 }),
        (name, ticketCount) => {
          const result = validateGuestInput(name, ticketCount);
          expect(result.valid).toBe(true);
          expect(result.errors).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

});
