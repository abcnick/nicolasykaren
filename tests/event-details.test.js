/**
 * Unit tests for Event Details Module (js/event-details.js)
 * Tests ceremony date formatting, venue rendering, itinerary display, and reception details.
 */

// Set up CONFIG global before loading event-details.js
global.CONFIG = {
  wedding: {
    date: "2025-06-14T16:00:00-05:00",
    couple: { name1: "Karen", name2: "Nicolas" }
  },
  ceremony: {
    venue: "Iglesia San José",
    address: "Calle 10 #25-30, Medellín, Colombia",
    mapsUrl: "https://maps.google.com/?q=Iglesia+San+Jose",
    time: "4:00 PM"
  },
  reception: {
    venue: "Hacienda La Esperanza",
    address: "Km 5 Vía Las Palmas, Medellín",
    startTime: "7:00 PM"
  },
  itinerary: [
    { time: "4:00 PM", description: "Ceremonia" },
    { time: "5:00 PM", description: "Cóctel" },
    { time: "7:00 PM", description: "Recepción y Cena" }
  ]
};

// Helper to set up DOM elements used by event-details.js
function setupDOM() {
  document.body.innerHTML = `
    <p id="ceremony-date"></p>
    <p id="ceremony-venue"></p>
    <p id="ceremony-address"></p>
    <a id="ceremony-map-link" href="#">Ver en Google Maps</a>
    <div id="itinerary-section">
      <ul id="itinerary-list"></ul>
    </div>
    <p id="reception-venue"></p>
    <p id="reception-address"></p>
    <p id="reception-time"></p>
  `;
}

// Load event-details.js
require('../js/event-details.js');

describe('Event Details Module', () => {
  beforeEach(() => {
    setupDOM();
    // Reset CONFIG to default state
    global.CONFIG = {
      wedding: {
        date: "2025-06-14T16:00:00-05:00",
        couple: { name1: "Karen", name2: "Nicolas" }
      },
      ceremony: {
        venue: "Iglesia San José",
        address: "Calle 10 #25-30, Medellín, Colombia",
        mapsUrl: "https://maps.google.com/?q=Iglesia+San+Jose",
        time: "4:00 PM"
      },
      reception: {
        venue: "Hacienda La Esperanza",
        address: "Km 5 Vía Las Palmas, Medellín",
        startTime: "7:00 PM"
      },
      itinerary: [
        { time: "4:00 PM", description: "Ceremonia" },
        { time: "5:00 PM", description: "Cóctel" },
        { time: "7:00 PM", description: "Recepción y Cena" }
      ]
    };
  });

  describe('_formatDate', () => {
    const formatDate = window.EventDetails._formatDate;

    test('formats ISO date to "Saturday, June 14, 2025 at 4:00 PM"', () => {
      const result = formatDate("2025-06-14T16:00:00-05:00");
      expect(result).toBe("Saturday, June 14, 2025 at 4:00 PM");
    });

    test('formats morning time correctly with AM', () => {
      const result = formatDate("2025-03-15T09:30:00-05:00");
      expect(result).toBe("Saturday, March 15, 2025 at 9:30 AM");
    });

    test('formats noon correctly as 12:00 PM', () => {
      const result = formatDate("2025-01-01T12:00:00-05:00");
      expect(result).toBe("Wednesday, January 1, 2025 at 12:00 PM");
    });

    test('formats midnight correctly as 12:00 AM', () => {
      const result = formatDate("2025-01-01T00:00:00-05:00");
      expect(result).toBe("Wednesday, January 1, 2025 at 12:00 AM");
    });

    test('returns empty string for null input', () => {
      expect(formatDate(null)).toBe('');
    });

    test('returns empty string for undefined input', () => {
      expect(formatDate(undefined)).toBe('');
    });

    test('returns empty string for empty string input', () => {
      expect(formatDate('')).toBe('');
    });

    test('returns empty string for invalid date string', () => {
      expect(formatDate('not-a-date')).toBe('');
    });
  });

  describe('init() — ceremony date rendering', () => {
    test('renders formatted ceremony date into #ceremony-date', () => {
      window.EventDetails.init();
      const dateEl = document.getElementById('ceremony-date');
      expect(dateEl.textContent).toBe("Saturday, June 14, 2025 at 4:00 PM");
    });

    test('renders empty string when wedding date is missing', () => {
      global.CONFIG.wedding.date = null;
      window.EventDetails.init();
      const dateEl = document.getElementById('ceremony-date');
      expect(dateEl.textContent).toBe('');
    });
  });

  describe('init() — ceremony venue rendering', () => {
    test('renders ceremony venue name', () => {
      window.EventDetails.init();
      const venueEl = document.getElementById('ceremony-venue');
      expect(venueEl.textContent).toBe("Iglesia San José");
    });

    test('renders ceremony address', () => {
      window.EventDetails.init();
      const addressEl = document.getElementById('ceremony-address');
      expect(addressEl.textContent).toBe("Calle 10 #25-30, Medellín, Colombia");
    });

    test('sets Google Maps link with correct href and target="_blank"', () => {
      window.EventDetails.init();
      const mapLink = document.getElementById('ceremony-map-link');
      expect(mapLink.href).toBe("https://maps.google.com/?q=Iglesia+San+Jose");
      expect(mapLink.target).toBe("_blank");
      expect(mapLink.rel).toBe("noopener noreferrer");
    });

    test('hides map link when mapsUrl is not configured', () => {
      global.CONFIG.ceremony.mapsUrl = '';
      window.EventDetails.init();
      const mapLink = document.getElementById('ceremony-map-link');
      expect(mapLink.style.display).toBe('none');
    });
  });

  describe('init() — itinerary rendering', () => {
    test('renders itinerary items in chronological order', () => {
      window.EventDetails.init();
      const listEl = document.getElementById('itinerary-list');
      const items = listEl.querySelectorAll('li');
      expect(items.length).toBe(3);

      expect(items[0].querySelector('.time').textContent).toBe('4:00 PM');
      expect(items[0].querySelector('.description').textContent).toBe('Ceremonia');

      expect(items[1].querySelector('.time').textContent).toBe('5:00 PM');
      expect(items[1].querySelector('.description').textContent).toBe('Cóctel');

      expect(items[2].querySelector('.time').textContent).toBe('7:00 PM');
      expect(items[2].querySelector('.description').textContent).toBe('Recepción y Cena');
    });

    test('sorts unsorted itinerary items into chronological order', () => {
      global.CONFIG.itinerary = [
        { time: "7:00 PM", description: "Recepción" },
        { time: "4:00 PM", description: "Ceremonia" },
        { time: "5:30 PM", description: "Cóctel" }
      ];
      window.EventDetails.init();
      const listEl = document.getElementById('itinerary-list');
      const items = listEl.querySelectorAll('li');

      expect(items[0].querySelector('.time').textContent).toBe('4:00 PM');
      expect(items[1].querySelector('.time').textContent).toBe('5:30 PM');
      expect(items[2].querySelector('.time').textContent).toBe('7:00 PM');
    });

    test('hides itinerary section when itinerary is empty array', () => {
      global.CONFIG.itinerary = [];
      window.EventDetails.init();
      const sectionEl = document.getElementById('itinerary-section');
      expect(sectionEl.style.display).toBe('none');
    });

    test('hides itinerary section when itinerary is undefined', () => {
      global.CONFIG.itinerary = undefined;
      window.EventDetails.init();
      const sectionEl = document.getElementById('itinerary-section');
      expect(sectionEl.style.display).toBe('none');
    });

    test('shows itinerary section when items are configured', () => {
      window.EventDetails.init();
      const sectionEl = document.getElementById('itinerary-section');
      expect(sectionEl.style.display).not.toBe('none');
    });

    test('each itinerary item has time and description spans', () => {
      window.EventDetails.init();
      const listEl = document.getElementById('itinerary-list');
      const firstItem = listEl.querySelector('li');
      expect(firstItem.querySelector('.time')).not.toBeNull();
      expect(firstItem.querySelector('.description')).not.toBeNull();
    });
  });

  describe('init() — reception details rendering', () => {
    test('renders reception venue name', () => {
      window.EventDetails.init();
      const venueEl = document.getElementById('reception-venue');
      expect(venueEl.textContent).toBe("Hacienda La Esperanza");
    });

    test('renders reception address', () => {
      window.EventDetails.init();
      const addressEl = document.getElementById('reception-address');
      expect(addressEl.textContent).toBe("Km 5 Vía Las Palmas, Medellín");
    });

    test('renders reception start time', () => {
      window.EventDetails.init();
      const timeEl = document.getElementById('reception-time');
      expect(timeEl.textContent).toBe("7:00 PM");
    });
  });

  describe('init() — graceful degradation', () => {
    test('handles missing ceremony config gracefully', () => {
      delete global.CONFIG.ceremony;
      expect(() => window.EventDetails.init()).not.toThrow();
    });

    test('handles missing reception config gracefully', () => {
      delete global.CONFIG.reception;
      expect(() => window.EventDetails.init()).not.toThrow();
    });

    test('handles missing wedding config gracefully', () => {
      delete global.CONFIG.wedding;
      expect(() => window.EventDetails.init()).not.toThrow();
    });

    test('handles completely undefined CONFIG gracefully', () => {
      global.CONFIG = undefined;
      expect(() => window.EventDetails.init()).not.toThrow();
    });
  });
});
