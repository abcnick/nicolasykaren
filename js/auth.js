/**
 * Client-side authentication module for the admin interface.
 *
 * Provides password-based authentication using SHA-256 hashing,
 * session persistence via localStorage, and 24-hour session expiry.
 *
 * Security Note: This is a basic deterrent suitable for a wedding site.
 * The password hash is visible in source code — not production-grade security.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'wedding_admin_session';
  var SESSION_DURATION_MS = 86400000; // 24 hours in milliseconds

  /**
   * Hashes a string using SHA-256 and returns the hex digest.
   * @param {string} input - The string to hash
   * @returns {Promise<string>} Hex-encoded SHA-256 hash
   */
  async function hashSHA256(input) {
    var encoder = new TextEncoder();
    var data = encoder.encode(input);
    var buffer = await crypto.subtle.digest('SHA-256', data);
    var hashArray = Array.from(new Uint8Array(buffer));
    var hashHex = hashArray.map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
    return hashHex;
  }

  /**
   * Checks if a session object is valid given the current time.
   * Exported for testability — allows testing 24-hour expiry logic
   * without mocking Date.now().
   *
   * @param {object|null} session - The session object from localStorage
   * @param {number} currentTime - The current timestamp in milliseconds
   * @returns {boolean} True if session is valid
   */
  function isSessionValid(session, currentTime) {
    if (!session) {
      return false;
    }
    if (session.authenticated !== true) {
      return false;
    }
    if (typeof session.timestamp !== 'number') {
      return false;
    }
    if (typeof session.token !== 'string' || session.token.length === 0) {
      return false;
    }
    var elapsed = currentTime - session.timestamp;
    return elapsed >= 0 && elapsed < SESSION_DURATION_MS;
  }

  /**
   * Retrieves the session from localStorage.
   * @returns {object|null} Parsed session object or null if invalid/missing
   */
  function getSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Authenticates the user by comparing the SHA-256 hash of the input
   * password against the stored hash in CONFIG.admin.passwordHash.
   *
   * On success, stores a session in localStorage with timestamp and token.
   *
   * @param {string} password - The password to verify
   * @returns {Promise<boolean>} True if authentication succeeds
   */
  async function authenticate(password) {
    if (typeof password !== 'string' || password.length === 0) {
      return false;
    }

    var hash = await hashSHA256(password);

    if (hash !== CONFIG.admin.passwordHash) {
      return false;
    }

    var session = {
      authenticated: true,
      timestamp: Date.now(),
      token: hash
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  }

  /**
   * Checks if the user is currently authenticated with a valid session.
   * A session is valid if it exists, has authenticated=true, has a token,
   * and has not exceeded the 24-hour duration.
   *
   * @returns {boolean} True if user has a valid, non-expired session
   */
  function isAuthenticated() {
    var session = getSession();
    return isSessionValid(session, Date.now());
  }

  /**
   * Logs out the user by removing the session from localStorage.
   */
  function logout() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Expose public API globally
  window.Auth = {
    authenticate: authenticate,
    isAuthenticated: isAuthenticated,
    logout: logout,
    // Exposed for testing purposes
    _isSessionValid: isSessionValid,
    _hashSHA256: hashSHA256
  };
})();
