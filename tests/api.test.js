/**
 * Unit tests for the API Client Module (js/api.js)
 */

// Set up CONFIG global before loading the module
const BASE_URL = "https://script.google.com/macros/s/TEST_ID/exec";

beforeAll(() => {
  global.CONFIG = {
    api: { baseUrl: BASE_URL }
  };
});

// Load the API module (it attaches to window.API via IIFE)
require("../js/api.js");

describe("API Client Module", () => {
  let api;

  beforeEach(() => {
    api = window.API;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getGuest(id)", () => {
    test("sends GET request with action=getGuest and id param", async () => {
      const mockData = { name: "Juan", ticketCount: 3, rsvpStatus: false };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await api.getGuest("abc12345");

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = new URL(global.fetch.mock.calls[0][0]);
      expect(calledUrl.searchParams.get("action")).toBe("getGuest");
      expect(calledUrl.searchParams.get("id")).toBe("abc12345");
      expect(global.fetch.mock.calls[0][1].method).toBe("GET");
      expect(result).toEqual(mockData);
    });

    test("returns error object on network failure", async () => {
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await api.getGuest("abc12345");

      expect(result.error).toBe(true);
      expect(result.message).toBe("No pudimos conectar. Por favor intenta de nuevo.");
    });

    test("returns error object on non-ok response", async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 500 });

      const result = await api.getGuest("abc12345");

      expect(result.error).toBe(true);
      expect(result.message).toBe("Ocurrió un error en el servidor. Por favor intenta de nuevo.");
    });

    test("returns timeout error when request exceeds 10 seconds", async () => {
      jest.useFakeTimers();

      global.fetch.mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      });

      const promise = api.getGuest("abc12345");
      jest.advanceTimersByTime(10000);

      const result = await promise;
      expect(result.error).toBe(true);
      expect(result.message).toBe("La solicitud tardó demasiado. Por favor intenta de nuevo.");

      jest.useRealTimers();
    });
  });

  describe("getAllGuests()", () => {
    test("sends GET request with action=getAllGuests", async () => {
      const mockData = [
        { id: "abc123", name: "Juan", ticketCount: 2 },
        { id: "def456", name: "María", ticketCount: 4 }
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await api.getAllGuests();

      const calledUrl = new URL(global.fetch.mock.calls[0][0]);
      expect(calledUrl.searchParams.get("action")).toBe("getAllGuests");
      expect(global.fetch.mock.calls[0][1].method).toBe("GET");
      expect(result).toEqual(mockData);
    });
  });

  describe("createGuest(name, ticketCount)", () => {
    test("sends POST request with action, name, and ticketCount", async () => {
      const mockResponse = { id: "xyz789ab", link: "https://nicolasykaren.com/?guest=xyz789ab" };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.createGuest("Carlos", 5);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch.mock.calls[0][0]).toBe(BASE_URL);
      const options = global.fetch.mock.calls[0][1];
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      const body = JSON.parse(options.body);
      expect(body.action).toBe("createGuest");
      expect(body.name).toBe("Carlos");
      expect(body.ticketCount).toBe(5);
      expect(result).toEqual(mockResponse);
    });

    test("returns error object on network failure", async () => {
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await api.createGuest("Carlos", 5);

      expect(result.error).toBe(true);
      expect(result.message).toBe("No pudimos conectar. Por favor intenta de nuevo.");
    });
  });

  describe("updateGuest(id, data)", () => {
    test("sends POST with action, id, and partial data merged", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await api.updateGuest("abc123", { name: "Juan Pablo", ticketCount: 4 });

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.action).toBe("updateGuest");
      expect(body.id).toBe("abc123");
      expect(body.name).toBe("Juan Pablo");
      expect(body.ticketCount).toBe(4);
      expect(result).toEqual({ success: true });
    });

    test("sends only provided fields in partial update", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await api.updateGuest("abc123", { ticketCount: 2 });

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.action).toBe("updateGuest");
      expect(body.id).toBe("abc123");
      expect(body.ticketCount).toBe(2);
      expect(body.name).toBeUndefined();
    });
  });

  describe("deleteGuest(id)", () => {
    test("sends POST with action and id", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await api.deleteGuest("abc123");

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.action).toBe("deleteGuest");
      expect(body.id).toBe("abc123");
      expect(result).toEqual({ success: true });
    });
  });

  describe("submitRsvp(guestId, rsvpData)", () => {
    test("sends POST with action, guestId, and RSVP payload merged", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const rsvpData = {
        attendance: 3,
        attendeeNames: ["Juan", "María", "Carlos"],
        phoneNumber: "+573001234567",
        message: "¡Nos vemos allá!"
      };

      const result = await api.submitRsvp("abc123", rsvpData);

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.action).toBe("submitRsvp");
      expect(body.guestId).toBe("abc123");
      expect(body.attendance).toBe(3);
      expect(body.attendeeNames).toEqual(["Juan", "María", "Carlos"]);
      expect(body.phoneNumber).toBe("+573001234567");
      expect(body.message).toBe("¡Nos vemos allá!");
      expect(result).toEqual({ success: true });
    });

    test("returns error object on server error", async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 500 });

      const result = await api.submitRsvp("abc123", { attendance: 1 });

      expect(result.error).toBe(true);
      expect(result.message).toBe("Ocurrió un error en el servidor. Por favor intenta de nuevo.");
    });
  });

  describe("AbortController timeout", () => {
    test("all methods use 10-second timeout", async () => {
      jest.useFakeTimers();

      global.fetch.mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      });

      const methods = [
        api.getGuest("id1"),
        api.getAllGuests(),
        api.createGuest("Test", 1),
        api.updateGuest("id1", { name: "X" }),
        api.deleteGuest("id1"),
        api.submitRsvp("id1", { attendance: 1 })
      ];

      jest.advanceTimersByTime(10000);

      const results = await Promise.all(methods);
      results.forEach((result) => {
        expect(result.error).toBe(true);
        expect(result.message).toBe("La solicitud tardó demasiado. Por favor intenta de nuevo.");
      });

      jest.useRealTimers();
    });
  });
});
