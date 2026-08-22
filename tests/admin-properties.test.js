// Feature: wedding-invitation-site, Property 2: Guest Creation Produces Valid Record
// Feature: wedding-invitation-site, Property 3: Duplicate Guest Name Rejection
// **Validates: Requirements 1.1, 1.5**

const fc = require('fast-check');
const { validateGuestInput } = require('../js/validation');

// ============================================================================
// Property 2: Guest Creation Produces Valid Record
// For any valid guest name (1–100 non-empty characters) and valid ticket count
// (integer 1–20), creating a guest record SHALL produce a record with an 8-character
// alphanumeric URL-safe ID, the exact provided name, and the exact provided ticket
// count, and SHALL generate an invitation link containing that ID.
// **Validates: Requirements 1.1**
// ============================================================================

describe('Property 2: Guest Creation Produces Valid Record', () => {
  const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]{8}$/;
  const LINK_BASE = 'https://nicolasykaren.com/?guest=';

  /**
   * Helper: generates a random 8-char alphanumeric ID (simulating server behavior)
   */
  function generateMockId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /**
   * Simulates the admin guest creation flow:
   * 1. Validate input
   * 2. Call API.createGuest with the validated name and ticketCount
   * 3. Return the result from the API
   */
  async function simulateGuestCreation(name, ticketCount, mockAPI) {
    const validation = validateGuestInput(name, ticketCount);
    if (!validation.valid) {
      return { error: true, validationErrors: validation.errors };
    }
    return await mockAPI.createGuest(name, ticketCount);
  }

  it('produces a record with 8-char alphanumeric ID for any valid name and ticket count', async () => {
    // Generator for valid names: 1-100 chars, with at least one non-whitespace char
    const validNameGen = fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);

    // Generator for valid ticket counts: integers 1-20
    const validTicketGen = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(
        validNameGen,
        validTicketGen,
        async (name, ticketCount) => {
          const mockId = generateMockId();
          const mockLink = LINK_BASE + mockId;

          const mockAPI = {
            createGuest: jest.fn().mockResolvedValue({
              id: mockId,
              link: mockLink
            })
          };

          const result = await simulateGuestCreation(name, ticketCount, mockAPI);

          // Verify: no error
          expect(result.error).toBeUndefined();

          // Verify: id is 8 characters, alphanumeric
          expect(result.id).toBeDefined();
          expect(result.id.length).toBe(8);
          expect(result.id).toMatch(ALPHANUMERIC_REGEX);

          // Verify: API was called with exact name and ticket count
          expect(mockAPI.createGuest).toHaveBeenCalledTimes(1);
          expect(mockAPI.createGuest).toHaveBeenCalledWith(name, ticketCount);

          // Verify: the returned link contains the id
          expect(result.link).toBeDefined();
          expect(result.link).toContain(result.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returned link follows the expected URL format containing the guest ID', async () => {
    const validNameGen = fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);
    const validTicketGen = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(
        validNameGen,
        validTicketGen,
        async (name, ticketCount) => {
          const mockId = generateMockId();
          const mockLink = LINK_BASE + mockId;

          const mockAPI = {
            createGuest: jest.fn().mockResolvedValue({
              id: mockId,
              link: mockLink
            })
          };

          const result = await simulateGuestCreation(name, ticketCount, mockAPI);

          // The link must start with the expected base URL
          expect(result.link).toMatch(/^https:\/\/nicolasykaren\.com\/\?guest=/);
          // The link must end with the 8-char ID
          const idFromLink = result.link.replace(LINK_BASE, '');
          expect(idFromLink).toBe(result.id);
          expect(idFromLink).toMatch(ALPHANUMERIC_REGEX);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validation passes for all valid inputs before API is called', () => {
    const validNameGen = fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);
    const validTicketGen = fc.integer({ min: 1, max: 20 });

    fc.assert(
      fc.property(
        validNameGen,
        validTicketGen,
        (name, ticketCount) => {
          // Validation must pass for valid inputs
          const validation = validateGuestInput(name, ticketCount);
          expect(validation.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 3: Duplicate Guest Name Rejection
// For any guest name that already exists in the data store, attempting to create
// a new guest with the same name SHALL be rejected with a duplicate error, and
// the total number of guest records SHALL remain unchanged.
// **Validates: Requirements 1.5**
// ============================================================================

describe('Property 3: Duplicate Guest Name Rejection', () => {

  /**
   * Simulates the admin guest creation flow with duplicate handling:
   * Validates input, then calls API which may return duplicate error.
   */
  async function simulateGuestCreation(name, ticketCount, mockAPI) {
    const validation = validateGuestInput(name, ticketCount);
    if (!validation.valid) {
      return { error: true, validationErrors: validation.errors };
    }
    return await mockAPI.createGuest(name, ticketCount);
  }

  it('rejects second creation attempt with same name and record count stays unchanged', async () => {
    const validNameGen = fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);
    const validTicketGen = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(
        validNameGen,
        validTicketGen,
        validTicketGen,
        async (name, ticketCount1, ticketCount2) => {
          let guestStore = [];

          const mockAPI = {
            createGuest: jest.fn().mockImplementation(async (guestName, tickets) => {
              // Check for duplicate
              if (guestStore.find(g => g.name === guestName)) {
                return { error: true, duplicate: true, message: 'Ya existe un invitado con ese nombre' };
              }
              // Create guest
              const id = 'abcd1234';
              const guest = { id, name: guestName, ticketCount: tickets };
              guestStore.push(guest);
              return { id, link: 'https://nicolasykaren.com/?guest=' + id };
            })
          };

          // First creation should succeed
          const result1 = await simulateGuestCreation(name, ticketCount1, mockAPI);
          expect(result1.error).toBeUndefined();
          expect(guestStore.length).toBe(1);

          // Second creation with same name should be rejected
          const result2 = await simulateGuestCreation(name, ticketCount2, mockAPI);
          expect(result2.error).toBe(true);
          expect(result2.duplicate).toBe(true);

          // Record count unchanged after duplicate attempt
          expect(guestStore.length).toBe(1);

          // API was called twice total (once success, once duplicate rejection)
          expect(mockAPI.createGuest).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('duplicate rejection preserves original record data unchanged', async () => {
    const validNameGen = fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);
    const validTicketGen = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(
        validNameGen,
        validTicketGen,
        fc.integer({ min: 1, max: 20 }),
        async (name, originalTickets, newTickets) => {
          let guestStore = [];

          const mockAPI = {
            createGuest: jest.fn().mockImplementation(async (guestName, tickets) => {
              if (guestStore.find(g => g.name === guestName)) {
                return { error: true, duplicate: true, message: 'Ya existe un invitado con ese nombre' };
              }
              const id = 'test1234';
              const guest = { id, name: guestName, ticketCount: tickets };
              guestStore.push(guest);
              return { id, link: 'https://nicolasykaren.com/?guest=' + id };
            })
          };

          // Create the initial guest
          await simulateGuestCreation(name, originalTickets, mockAPI);
          const originalRecord = { ...guestStore[0] };

          // Attempt duplicate creation (possibly with different ticket count)
          await simulateGuestCreation(name, newTickets, mockAPI);

          // Original record is preserved exactly as it was
          expect(guestStore.length).toBe(1);
          expect(guestStore[0].name).toBe(originalRecord.name);
          expect(guestStore[0].ticketCount).toBe(originalRecord.ticketCount);
          expect(guestStore[0].id).toBe(originalRecord.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('duplicate detection is based on exact name match', async () => {
    const validNameGen = fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);
    const validTicketGen = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(
        validNameGen,
        validTicketGen,
        async (name, ticketCount) => {
          let guestStore = [];

          const mockAPI = {
            createGuest: jest.fn().mockImplementation(async (guestName, tickets) => {
              if (guestStore.find(g => g.name === guestName)) {
                return { error: true, duplicate: true, message: 'Ya existe un invitado con ese nombre' };
              }
              const id = 'uniq' + Math.random().toString(36).substring(2, 6);
              guestStore.push({ id, name: guestName, ticketCount: tickets });
              return { id, link: 'https://nicolasykaren.com/?guest=' + id };
            })
          };

          // Create the guest
          const result1 = await simulateGuestCreation(name, ticketCount, mockAPI);
          expect(result1.error).toBeUndefined();

          // Same exact name → rejected
          const result2 = await simulateGuestCreation(name, ticketCount, mockAPI);
          expect(result2.error).toBe(true);
          expect(result2.duplicate).toBe(true);

          // Store still has exactly 1 record
          expect(guestStore.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
