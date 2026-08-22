/**
 * API Client Module
 * Encapsulates all communication with the Google Apps Script backend.
 * Uses fetch() with 10-second AbortController timeout on all calls.
 * All methods return Promises resolving to parsed JSON or structured error objects.
 */

(function () {
  const TIMEOUT_MS = 10000;
  const ERROR_NETWORK = "No pudimos conectar. Por favor intenta de nuevo.";
  const ERROR_TIMEOUT = "La solicitud tardó demasiado. Por favor intenta de nuevo.";
  const ERROR_SERVER = "Ocurrió un error en el servidor. Por favor intenta de nuevo.";

  /**
   * Internal helper: perform a GET request with query parameters.
   * @param {Object} params - Key/value pairs to append as query params
   * @returns {Promise<Object>} Parsed JSON response or error object
   */
  async function doGet(params) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const url = new URL(CONFIG.api.baseUrl);
      Object.keys(params).forEach(function (key) {
        url.searchParams.append(key, params[key]);
      });

      const response = await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { error: true, message: ERROR_SERVER };
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        return { error: true, message: ERROR_TIMEOUT };
      }
      return { error: true, message: ERROR_NETWORK };
    }
  }

  /**
   * Internal helper: perform a POST request with a JSON body.
   * @param {Object} body - Data to send as JSON body
   * @returns {Promise<Object>} Parsed JSON response or error object
   */
  async function doPost(body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(CONFIG.api.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body),
        redirect: "follow",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { error: true, message: ERROR_SERVER };
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        return { error: true, message: ERROR_TIMEOUT };
      }
      return { error: true, message: ERROR_NETWORK };
    }
  }

  /**
   * Fetch a single guest record by ID.
   * @param {string} id - Guest identifier
   * @returns {Promise<Object>} Guest record or error object
   */
  async function getGuest(id) {
    return doGet({ action: "getGuest", id: id });
  }

  /**
   * Fetch all guest records.
   * @returns {Promise<Object[]|Object>} Array of guest records or error object
   */
  async function getAllGuests() {
    return doGet({ action: "getAllGuests" });
  }

  /**
   * Create a new guest record.
   * @param {string} name - Guest name (1-100 characters)
   * @param {number} ticketCount - Number of tickets (1-20)
   * @returns {Promise<Object>} Created record {id, link} or error object
   */
  async function createGuest(name, ticketCount) {
    return doPost({
      action: "createGuest",
      name: name,
      ticketCount: ticketCount
    });
  }

  /**
   * Update an existing guest record.
   * @param {string} id - Guest identifier
   * @param {Object} data - Partial guest data to update (name, ticketCount)
   * @returns {Promise<Object>} Success response or error object
   */
  async function updateGuest(id, data) {
    return doPost(Object.assign({ action: "updateGuest", id: id }, data));
  }

  /**
   * Delete a guest record.
   * @param {string} id - Guest identifier
   * @returns {Promise<Object>} Success response or error object
   */
  async function deleteGuest(id) {
    return doPost({ action: "deleteGuest", id: id });
  }

  /**
   * Submit an RSVP response for a guest.
   * @param {string} guestId - Guest identifier
   * @param {Object} rsvpData - RSVP payload {attendance, attendeeNames, phoneNumber, message}
   * @returns {Promise<Object>} Success response or error object
   */
  async function submitRsvp(guestId, rsvpData) {
    return doPost(Object.assign({ action: "submitRsvp", guestId: guestId }, rsvpData));
  }

  // Expose as global API object
  window.API = {
    getGuest: getGuest,
    getAllGuests: getAllGuests,
    createGuest: createGuest,
    updateGuest: updateGuest,
    deleteGuest: deleteGuest,
    submitRsvp: submitRsvp
  };
})();
