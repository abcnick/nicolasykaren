/**
 * Unit tests for the Authentication Module (js/auth.js)
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock crypto.subtle.digest
const mockDigest = jest.fn(async (algorithm, data) => {
  // Simple mock: create a deterministic "hash" from the input bytes
  const bytes = new Uint8Array(data);
  const result = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) {
    result[i % 32] = (result[i % 32] + bytes[i]) % 256;
  }
  return result.buffer;
});

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest
    }
  }
});

// Mock TextEncoder
global.TextEncoder = class {
  encode(str) {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i);
    }
    return arr;
  }
};

// Mock CONFIG
global.CONFIG = {
  admin: {
    passwordHash: '' // Will be set per test
  }
};

// Load auth module
require('../js/auth.js');

const STORAGE_KEY = 'wedding_admin_session';

describe('Authentication Module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('isSessionValid (internal helper)', () => {
    const isSessionValid = window.Auth._isSessionValid;

    test('returns false for null session', () => {
      expect(isSessionValid(null, Date.now())).toBe(false);
    });

    test('returns false for undefined session', () => {
      expect(isSessionValid(undefined, Date.now())).toBe(false);
    });

    test('returns false when authenticated is not true', () => {
      const session = { authenticated: false, timestamp: Date.now(), token: 'abc123' };
      expect(isSessionValid(session, Date.now())).toBe(false);
    });

    test('returns false when timestamp is missing', () => {
      const session = { authenticated: true, token: 'abc123' };
      expect(isSessionValid(session, Date.now())).toBe(false);
    });

    test('returns false when timestamp is not a number', () => {
      const session = { authenticated: true, timestamp: 'not-a-number', token: 'abc123' };
      expect(isSessionValid(session, Date.now())).toBe(false);
    });

    test('returns false when token is missing', () => {
      const session = { authenticated: true, timestamp: Date.now() };
      expect(isSessionValid(session, Date.now())).toBe(false);
    });

    test('returns false when token is empty string', () => {
      const session = { authenticated: true, timestamp: Date.now(), token: '' };
      expect(isSessionValid(session, Date.now())).toBe(false);
    });

    test('returns true for valid session within 24 hours', () => {
      const now = 1700000000000;
      const session = { authenticated: true, timestamp: now - 1000, token: 'validhash' };
      expect(isSessionValid(session, now)).toBe(true);
    });

    test('returns true for session at exactly 0ms elapsed', () => {
      const now = 1700000000000;
      const session = { authenticated: true, timestamp: now, token: 'validhash' };
      expect(isSessionValid(session, now)).toBe(true);
    });

    test('returns false for session at exactly 24 hours', () => {
      const now = 1700000000000;
      const session = { authenticated: true, timestamp: now - 86400000, token: 'validhash' };
      expect(isSessionValid(session, now)).toBe(false);
    });

    test('returns false for session beyond 24 hours', () => {
      const now = 1700000000000;
      const session = { authenticated: true, timestamp: now - 86400001, token: 'validhash' };
      expect(isSessionValid(session, now)).toBe(false);
    });

    test('returns false for session with future timestamp (negative elapsed)', () => {
      const now = 1700000000000;
      const session = { authenticated: true, timestamp: now + 5000, token: 'validhash' };
      expect(isSessionValid(session, now)).toBe(false);
    });

    test('returns true for session at 23h 59m 59s (just under 24h)', () => {
      const now = 1700000000000;
      const almostExpired = 86400000 - 1000; // 1 second less than 24h
      const session = { authenticated: true, timestamp: now - almostExpired, token: 'validhash' };
      expect(isSessionValid(session, now)).toBe(true);
    });
  });

  describe('authenticate(password)', () => {
    test('returns false for empty password', async () => {
      const result = await window.Auth.authenticate('');
      expect(result).toBe(false);
    });

    test('returns false for non-string password', async () => {
      const result = await window.Auth.authenticate(null);
      expect(result).toBe(false);
    });

    test('returns false when hash does not match CONFIG hash', async () => {
      CONFIG.admin.passwordHash = 'different-hash-value';
      const result = await window.Auth.authenticate('wrongpassword');
      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    test('returns true and stores session when hash matches', async () => {
      // First get the hash that our mock produces for 'testpass'
      const hash = await window.Auth._hashSHA256('testpass');
      CONFIG.admin.passwordHash = hash;

      const result = await window.Auth.authenticate('testpass');
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      );

      // Verify stored session structure
      const storedValue = localStorageMock.setItem.mock.calls[0][1];
      const session = JSON.parse(storedValue);
      expect(session.authenticated).toBe(true);
      expect(typeof session.timestamp).toBe('number');
      expect(session.token).toBe(hash);
    });
  });

  describe('isAuthenticated()', () => {
    test('returns false when no session in localStorage', () => {
      expect(window.Auth.isAuthenticated()).toBe(false);
    });

    test('returns false when session is invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('not-valid-json');
      expect(window.Auth.isAuthenticated()).toBe(false);
    });

    test('returns true for valid non-expired session', () => {
      const session = {
        authenticated: true,
        timestamp: Date.now() - 1000,
        token: 'somehash'
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(session));
      expect(window.Auth.isAuthenticated()).toBe(true);
    });

    test('returns false for expired session (>24h)', () => {
      const session = {
        authenticated: true,
        timestamp: Date.now() - 86400001,
        token: 'somehash'
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(session));
      expect(window.Auth.isAuthenticated()).toBe(false);
    });
  });

  describe('logout()', () => {
    test('removes session from localStorage', () => {
      window.Auth.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('hashSHA256()', () => {
    test('calls crypto.subtle.digest with SHA-256', async () => {
      await window.Auth._hashSHA256('hello');
      expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
    });

    test('returns a hex string', async () => {
      const result = await window.Auth._hashSHA256('test');
      expect(result).toMatch(/^[0-9a-f]+$/);
      expect(result.length).toBe(64); // SHA-256 = 32 bytes = 64 hex chars
    });

    test('same input produces same output', async () => {
      const hash1 = await window.Auth._hashSHA256('password123');
      const hash2 = await window.Auth._hashSHA256('password123');
      expect(hash1).toBe(hash2);
    });

    test('different inputs produce different outputs', async () => {
      const hash1 = await window.Auth._hashSHA256('password1');
      const hash2 = await window.Auth._hashSHA256('password2');
      expect(hash1).not.toBe(hash2);
    });
  });
});

// Feature: wedding-invitation-site, Property 4: Session Expiry at 24 Hours
const fc = require('fast-check');

describe('Property 4: Session Expiry at 24 Hours', () => {
  /**
   * **Validates: Requirements 2.4**
   *
   * For ANY timestamp, session is valid iff (currentTime - timestamp) >= 0
   * AND (currentTime - timestamp) < 86,400,000 ms (24 hours).
   */
  const isSessionValid = window.Auth._isSessionValid;
  const SESSION_DURATION_MS = 86400000; // 24 hours

  it('session is valid iff elapsed time is >= 0 and < 86,400,000ms', () => {
    fc.assert(
      fc.property(
        fc.nat(1e15),  // timestamp (session creation time)
        fc.nat(1e15),  // currentTime
        (timestamp, currentTime) => {
          const session = { authenticated: true, timestamp: timestamp, token: 'validhash' };
          const elapsed = currentTime - timestamp;
          const expectedValid = elapsed >= 0 && elapsed < SESSION_DURATION_MS;
          const actualValid = isSessionValid(session, currentTime);

          expect(actualValid).toBe(expectedValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('session is always invalid when elapsed >= 24 hours', () => {
    fc.assert(
      fc.property(
        fc.nat(1e15),  // timestamp
        fc.nat(1e12),  // extra time beyond 24h boundary
        (timestamp, extra) => {
          const currentTime = timestamp + SESSION_DURATION_MS + extra;
          const session = { authenticated: true, timestamp: timestamp, token: 'validhash' };

          expect(isSessionValid(session, currentTime)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('session is always valid when elapsed is >= 0 and < 24 hours', () => {
    fc.assert(
      fc.property(
        fc.nat(1e15),                        // timestamp
        fc.nat(SESSION_DURATION_MS - 1),     // elapsed in [0, 86399999]
        (timestamp, elapsed) => {
          const currentTime = timestamp + elapsed;
          const session = { authenticated: true, timestamp: timestamp, token: 'validhash' };

          expect(isSessionValid(session, currentTime)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('session is always invalid when current time is before timestamp (future timestamp)', () => {
    fc.assert(
      fc.property(
        fc.nat(1e15),            // timestamp
        fc.integer({ min: 1, max: 1e12 }),  // how far in the future the session is
        (timestamp, offset) => {
          const currentTime = timestamp - offset;
          // Guard: only test when currentTime >= 0
          fc.pre(currentTime >= 0);
          const session = { authenticated: true, timestamp: timestamp, token: 'validhash' };

          expect(isSessionValid(session, currentTime)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
