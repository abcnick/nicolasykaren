// Feature: wedding-invitation-site, Property 7: Countdown Timer Calculation Correctness
// Feature: wedding-invitation-site, Property 8: Past Date Countdown Display
// Feature: wedding-invitation-site, Property 9: Ceremony Date Formatting
// Feature: wedding-invitation-site, Property 10: Itinerary Chronological Ordering

const fc = require('fast-check');

// Load countdown module
require('../js/countdown.js');

// Load event-details module (needs CONFIG global)
global.CONFIG = {
  wedding: {
    date: "2025-06-14T16:00:00-05:00",
    couple: { name1: "Karen", name2: "Nicolas" }
  },
  ceremony: {
    venue: "Test Venue",
    address: "Test Address",
    mapsUrl: "https://maps.google.com/?q=Test",
    time: "4:00 PM"
  },
  reception: {
    venue: "Reception Venue",
    address: "Reception Address",
    startTime: "7:00 PM"
  },
  itinerary: []
};

require('../js/event-details.js');

// ============================================================================
// Property 7: Countdown Timer Calculation Correctness
// **Validates: Requirements 6.1**
// ============================================================================

describe('Property 7: Countdown Timer Calculation Correctness', () => {

  it('returns arrived: false for any future date (targetMs > nowMs)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000000000000 }),  // nowMs
        fc.integer({ min: 1, max: 2000000000000 }),  // additional offset to ensure target > now
        (nowMs, offset) => {
          const targetMs = nowMs + offset;
          // Ensure targetMs > nowMs
          fc.pre(targetMs > nowMs);
          const result = window.Countdown._calculate(targetMs, nowMs);
          expect(result.arrived).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('days, hours, minutes, seconds are all zero-padded strings (at least 2 digits)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1500000000000 }),
        fc.integer({ min: 1, max: 500000000000 }),
        (nowMs, diff) => {
          const targetMs = nowMs + diff;
          const result = window.Countdown._calculate(targetMs, nowMs);

          // All values must be strings
          expect(typeof result.days).toBe('string');
          expect(typeof result.hours).toBe('string');
          expect(typeof result.minutes).toBe('string');
          expect(typeof result.seconds).toBe('string');

          // All values must be at least 2 characters (zero-padded)
          expect(result.days.length).toBeGreaterThanOrEqual(2);
          expect(result.hours.length).toBeGreaterThanOrEqual(2);
          expect(result.minutes.length).toBeGreaterThanOrEqual(2);
          expect(result.seconds.length).toBeGreaterThanOrEqual(2);

          // All values must be numeric strings
          expect(result.days).toMatch(/^\d+$/);
          expect(result.hours).toMatch(/^\d+$/);
          expect(result.minutes).toMatch(/^\d+$/);
          expect(result.seconds).toMatch(/^\d+$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hours is 0-23, minutes is 0-59, seconds is 0-59 for future dates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1500000000000 }),
        fc.integer({ min: 1, max: 500000000000 }),
        (nowMs, diff) => {
          const targetMs = nowMs + diff;
          const result = window.Countdown._calculate(targetMs, nowMs);

          const hours = parseInt(result.hours, 10);
          const minutes = parseInt(result.minutes, 10);
          const seconds = parseInt(result.seconds, 10);

          expect(hours).toBeGreaterThanOrEqual(0);
          expect(hours).toBeLessThanOrEqual(23);
          expect(minutes).toBeGreaterThanOrEqual(0);
          expect(minutes).toBeLessThanOrEqual(59);
          expect(seconds).toBeGreaterThanOrEqual(0);
          expect(seconds).toBeLessThanOrEqual(59);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('total ms difference matches days*86400000 + hours*3600000 + minutes*60000 + seconds*1000 (within 1 second)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1500000000000 }),
        fc.integer({ min: 1, max: 500000000000 }),
        (nowMs, diff) => {
          const targetMs = nowMs + diff;
          const result = window.Countdown._calculate(targetMs, nowMs);

          const days = parseInt(result.days, 10);
          const hours = parseInt(result.hours, 10);
          const minutes = parseInt(result.minutes, 10);
          const seconds = parseInt(result.seconds, 10);

          const reconstructedMs = days * 86400000 + hours * 3600000 + minutes * 60000 + seconds * 1000;
          const actualDiff = targetMs - nowMs;

          // The reconstructed value should be within 1 second of actual diff
          // (because sub-second remainder is floored away)
          expect(Math.abs(actualDiff - reconstructedMs)).toBeLessThan(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ============================================================================
// Property 8: Past Date Countdown Display
// **Validates: Requirements 6.3**
// ============================================================================

describe('Property 8: Past Date Countdown Display', () => {

  it('returns arrived: true when targetMs <= nowMs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000000000000 }),
        fc.integer({ min: 0, max: 2000000000000 }),
        (nowMs, offset) => {
          // targetMs <= nowMs
          const targetMs = nowMs - offset;
          const result = window.Countdown._calculate(targetMs, nowMs);
          expect(result.arrived).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no negative values appear — days, hours, minutes, seconds are all "00"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000000000000 }),
        fc.integer({ min: 0, max: 2000000000000 }),
        (nowMs, offset) => {
          const targetMs = nowMs - offset;
          const result = window.Countdown._calculate(targetMs, nowMs);

          expect(result.days).toBe('00');
          expect(result.hours).toBe('00');
          expect(result.minutes).toBe('00');
          expect(result.seconds).toBe('00');

          // No negative values in any field
          expect(parseInt(result.days, 10)).toBeGreaterThanOrEqual(0);
          expect(parseInt(result.hours, 10)).toBeGreaterThanOrEqual(0);
          expect(parseInt(result.minutes, 10)).toBeGreaterThanOrEqual(0);
          expect(parseInt(result.seconds, 10)).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns arrived: true when targetMs equals nowMs exactly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2000000000000 }),
        (timestamp) => {
          const result = window.Countdown._calculate(timestamp, timestamp);
          expect(result.arrived).toBe(true);
          expect(result.days).toBe('00');
          expect(result.hours).toBe('00');
          expect(result.minutes).toBe('00');
          expect(result.seconds).toBe('00');
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ============================================================================
// Property 9: Ceremony Date Formatting
// **Validates: Requirements 7.1**
// ============================================================================

describe('Property 9: Ceremony Date Formatting', () => {

  const formatDate = window.EventDetails._formatDate;

  // Generate a valid date with constrained components
  const validDateArb = fc.record({
    year: fc.integer({ min: 2000, max: 2100 }),
    month: fc.integer({ min: 0, max: 11 }),
    day: fc.integer({ min: 1, max: 28 }),
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 })
  });

  it('output matches pattern "Weekday, Month DD, YYYY at H:MM AM/PM"', () => {
    const weekdayPattern = '(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)';
    const monthPattern = '(January|February|March|April|May|June|July|August|September|October|November|December)';
    const fullPattern = new RegExp(
      '^' + weekdayPattern + ', ' + monthPattern + ' \\d{1,2}, \\d{4} at \\d{1,2}:\\d{2} (AM|PM)$'
    );

    fc.assert(
      fc.property(
        validDateArb,
        ({ year, month, day, hour, minute }) => {
          const date = new Date(year, month, day, hour, minute, 0);
          const isoString = date.toISOString();
          const result = formatDate(isoString);

          expect(result).toMatch(fullPattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('weekday in output is correct for the generated date', () => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    fc.assert(
      fc.property(
        validDateArb,
        ({ year, month, day, hour, minute }) => {
          const date = new Date(year, month, day, hour, minute, 0);
          const isoString = date.toISOString();
          const result = formatDate(isoString);

          // The _formatDate function uses local date methods (getDay, getMonth, etc.)
          // When we pass an ISO string (UTC), it will parse to local time
          const parsedDate = new Date(isoString);
          const expectedWeekday = weekdays[parsedDate.getDay()];
          expect(result.startsWith(expectedWeekday + ', ')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('month name in output is correct for the generated date', () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    fc.assert(
      fc.property(
        validDateArb,
        ({ year, month, day, hour, minute }) => {
          const date = new Date(year, month, day, hour, minute, 0);
          const isoString = date.toISOString();
          const result = formatDate(isoString);

          const parsedDate = new Date(isoString);
          const expectedMonth = months[parsedDate.getMonth()];
          expect(result).toContain(expectedMonth);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hour uses 12-hour format (1-12) with correct AM/PM', () => {
    fc.assert(
      fc.property(
        validDateArb,
        ({ year, month, day, hour, minute }) => {
          const date = new Date(year, month, day, hour, minute, 0);
          const isoString = date.toISOString();
          const result = formatDate(isoString);

          const parsedDate = new Date(isoString);
          const h24 = parsedDate.getHours();
          const expectedPeriod = h24 >= 12 ? 'PM' : 'AM';
          let expectedHour = h24 % 12;
          if (expectedHour === 0) expectedHour = 12;

          // Extract time portion from result
          const timeMatch = result.match(/at (\d{1,2}):(\d{2}) (AM|PM)$/);
          expect(timeMatch).not.toBeNull();
          expect(parseInt(timeMatch[1], 10)).toBe(expectedHour);
          expect(timeMatch[3]).toBe(expectedPeriod);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('minutes are zero-padded in output', () => {
    fc.assert(
      fc.property(
        validDateArb,
        ({ year, month, day, hour, minute }) => {
          const date = new Date(year, month, day, hour, minute, 0);
          const isoString = date.toISOString();
          const result = formatDate(isoString);

          const parsedDate = new Date(isoString);
          const expectedMinutes = parsedDate.getMinutes();
          const expectedMinutesStr = expectedMinutes < 10 ? '0' + expectedMinutes : String(expectedMinutes);

          const timeMatch = result.match(/at \d{1,2}:(\d{2}) (AM|PM)$/);
          expect(timeMatch).not.toBeNull();
          expect(timeMatch[1]).toBe(expectedMinutesStr);
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ============================================================================
// Property 10: Itinerary Chronological Ordering
// **Validates: Requirements 7.5**
// ============================================================================

describe('Property 10: Itinerary Chronological Ordering', () => {

  // Generator for a valid time string in "H:MM AM/PM" format
  const timeStringArb = fc.record({
    hour: fc.integer({ min: 1, max: 12 }),
    minute: fc.integer({ min: 0, max: 59 }),
    period: fc.constantFrom('AM', 'PM')
  }).map(({ hour, minute, period }) => {
    const minuteStr = minute < 10 ? '0' + minute : String(minute);
    return hour + ':' + minuteStr + ' ' + period;
  });

  // Generator for an itinerary item
  const itineraryItemArb = fc.record({
    time: timeStringArb,
    description: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
  });

  // Generator for an array of itinerary items (1 to 10 items)
  const itineraryArrayArb = fc.array(itineraryItemArb, { minLength: 1, maxLength: 10 });

  /**
   * Parse a time string to minutes since midnight for comparison.
   */
  function parseTimeToMinutes(timeStr) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hour = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'AM' && hour === 12) hour = 0;
    else if (period === 'PM' && hour !== 12) hour += 12;
    return hour * 60 + min;
  }

  function setupItineraryDOM() {
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

  it('rendered items are in ascending chronological order', () => {
    fc.assert(
      fc.property(
        itineraryArrayArb,
        (items) => {
          setupItineraryDOM();

          // Set CONFIG with random itinerary
          global.CONFIG = {
            wedding: { date: "2025-06-14T16:00:00-05:00" },
            ceremony: { venue: "V", address: "A", mapsUrl: "", time: "4:00 PM" },
            reception: { venue: "R", address: "A", startTime: "7:00 PM" },
            itinerary: items
          };

          window.EventDetails.init();

          const listEl = document.getElementById('itinerary-list');
          const renderedItems = listEl.querySelectorAll('li');

          // Verify items are rendered
          expect(renderedItems.length).toBe(items.length);

          // Extract rendered times and verify ascending order
          const renderedTimes = [];
          renderedItems.forEach(li => {
            const timeSpan = li.querySelector('.time');
            renderedTimes.push(timeSpan.textContent);
          });

          for (let i = 1; i < renderedTimes.length; i++) {
            const prevMinutes = parseTimeToMinutes(renderedTimes[i - 1]);
            const currMinutes = parseTimeToMinutes(renderedTimes[i]);
            expect(currMinutes).toBeGreaterThanOrEqual(prevMinutes);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each rendered item contains both its time slot and activity description', () => {
    fc.assert(
      fc.property(
        itineraryArrayArb,
        (items) => {
          setupItineraryDOM();

          global.CONFIG = {
            wedding: { date: "2025-06-14T16:00:00-05:00" },
            ceremony: { venue: "V", address: "A", mapsUrl: "", time: "4:00 PM" },
            reception: { venue: "R", address: "A", startTime: "7:00 PM" },
            itinerary: items
          };

          window.EventDetails.init();

          const listEl = document.getElementById('itinerary-list');
          const renderedItems = listEl.querySelectorAll('li');

          // All items should have both time and description spans
          renderedItems.forEach(li => {
            const timeSpan = li.querySelector('.time');
            const descSpan = li.querySelector('.description');
            expect(timeSpan).not.toBeNull();
            expect(descSpan).not.toBeNull();
            expect(timeSpan.textContent.length).toBeGreaterThan(0);
            expect(descSpan.textContent.length).toBeGreaterThan(0);
          });

          // All original descriptions should appear in the rendered output
          const renderedDescriptions = Array.from(renderedItems).map(
            li => li.querySelector('.description').textContent
          );
          items.forEach(item => {
            expect(renderedDescriptions).toContain(item.description);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

});
