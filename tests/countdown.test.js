/**
 * Unit tests for Countdown Timer Module (js/countdown.js)
 * Tests: _calculate logic, start/stop behavior, DOM updates, error handling
 */

// Set up jsdom environment
beforeEach(() => {
  document.body.innerHTML = `
    <section id="countdown-section">
      <span id="countdown-days"></span>
      <span id="countdown-hours"></span>
      <span id="countdown-minutes"></span>
      <span id="countdown-seconds"></span>
      <span id="countdown-message"></span>
    </section>
  `;
  // Load the module fresh
  jest.resetModules();
  delete window.Countdown;
  require('../js/countdown.js');
});

afterEach(() => {
  if (window.Countdown) {
    window.Countdown.stop();
  }
  jest.useRealTimers();
});

describe('Countdown._calculate', () => {
  test('returns correct values for a known time difference', () => {
    // 2 days, 5 hours, 30 minutes, 45 seconds in ms
    const diff = (2 * 86400000) + (5 * 3600000) + (30 * 60000) + (45 * 1000);
    const now = 1000000000000;
    const target = now + diff;

    const result = window.Countdown._calculate(target, now);
    expect(result.days).toBe('02');
    expect(result.hours).toBe('05');
    expect(result.minutes).toBe('30');
    expect(result.seconds).toBe('45');
    expect(result.arrived).toBe(false);
  });

  test('returns zero-padded single digit values', () => {
    // 1 day, 3 hours, 7 minutes, 9 seconds
    const diff = (1 * 86400000) + (3 * 3600000) + (7 * 60000) + (9 * 1000);
    const now = 1000000000000;
    const target = now + diff;

    const result = window.Countdown._calculate(target, now);
    expect(result.days).toBe('01');
    expect(result.hours).toBe('03');
    expect(result.minutes).toBe('07');
    expect(result.seconds).toBe('09');
    expect(result.arrived).toBe(false);
  });

  test('handles more than 99 days without truncation', () => {
    const diff = 150 * 86400000; // 150 days
    const now = 1000000000000;
    const target = now + diff;

    const result = window.Countdown._calculate(target, now);
    expect(result.days).toBe('150');
    expect(result.hours).toBe('00');
    expect(result.minutes).toBe('00');
    expect(result.seconds).toBe('00');
    expect(result.arrived).toBe(false);
  });

  test('returns arrived=true when diff is 0', () => {
    const now = 1000000000000;
    const result = window.Countdown._calculate(now, now);
    expect(result.arrived).toBe(true);
    expect(result.days).toBe('00');
    expect(result.hours).toBe('00');
    expect(result.minutes).toBe('00');
    expect(result.seconds).toBe('00');
  });

  test('returns arrived=true when target is in the past', () => {
    const now = 1000000000000;
    const target = now - 5000; // 5 seconds ago
    const result = window.Countdown._calculate(target, now);
    expect(result.arrived).toBe(true);
    expect(result.days).toBe('00');
    expect(result.hours).toBe('00');
    expect(result.minutes).toBe('00');
    expect(result.seconds).toBe('00');
  });

  test('exactly 1 second remaining', () => {
    const now = 1000000000000;
    const target = now + 1000;
    const result = window.Countdown._calculate(target, now);
    expect(result.days).toBe('00');
    expect(result.hours).toBe('00');
    expect(result.minutes).toBe('00');
    expect(result.seconds).toBe('01');
    expect(result.arrived).toBe(false);
  });

  test('23 hours, 59 minutes, 59 seconds (just under 1 day)', () => {
    const diff = (23 * 3600000) + (59 * 60000) + (59 * 1000);
    const now = 1000000000000;
    const target = now + diff;
    const result = window.Countdown._calculate(target, now);
    expect(result.days).toBe('00');
    expect(result.hours).toBe('23');
    expect(result.minutes).toBe('59');
    expect(result.seconds).toBe('59');
    expect(result.arrived).toBe(false);
  });
});

describe('Countdown.start', () => {
  test('updates DOM elements immediately on start', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-12T16:00:00-05:00'));

    window.Countdown.start('2025-06-14T16:00:00-05:00');

    expect(document.getElementById('countdown-days').textContent).toBe('02');
    expect(document.getElementById('countdown-hours').textContent).toBe('00');
    expect(document.getElementById('countdown-minutes').textContent).toBe('00');
    expect(document.getElementById('countdown-seconds').textContent).toBe('00');
  });

  test('updates DOM after 1 second', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-14T15:59:58-05:00'));

    window.Countdown.start('2025-06-14T16:00:00-05:00');

    expect(document.getElementById('countdown-seconds').textContent).toBe('02');

    jest.advanceTimersByTime(1000);
    expect(document.getElementById('countdown-seconds').textContent).toBe('01');
  });

  test('displays arrival message when target passes', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-14T15:59:59-05:00'));

    window.Countdown.start('2025-06-14T16:00:00-05:00');

    expect(document.getElementById('countdown-seconds').textContent).toBe('01');

    jest.advanceTimersByTime(1000);
    expect(document.getElementById('countdown-message').textContent).toBe('¡El gran día ha llegado!');
  });

  test('displays arrival message immediately if date already passed', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-15T16:00:00-05:00'));

    window.Countdown.start('2025-06-14T16:00:00-05:00');

    expect(document.getElementById('countdown-message').textContent).toBe('¡El gran día ha llegado!');
  });

  test('hides section and logs error for null targetDate', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.Countdown.start(null);

    expect(document.getElementById('countdown-section').style.display).toBe('none');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('hides section and logs error for undefined targetDate', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.Countdown.start(undefined);

    expect(document.getElementById('countdown-section').style.display).toBe('none');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('hides section and logs error for empty string targetDate', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.Countdown.start('');

    expect(document.getElementById('countdown-section').style.display).toBe('none');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('hides section and logs error for invalid date string', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.Countdown.start('not-a-date');

    expect(document.getElementById('countdown-section').style.display).toBe('none');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('hides section and logs error for whitespace-only string', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.Countdown.start('   ');

    expect(document.getElementById('countdown-section').style.display).toBe('none');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Countdown.stop', () => {
  test('clears the interval', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-12T16:00:00-05:00'));

    window.Countdown.start('2025-06-14T16:00:00-05:00');

    const daysBefore = document.getElementById('countdown-days').textContent;
    window.Countdown.stop();

    // Advance time — DOM should not update after stop
    jest.advanceTimersByTime(86400000); // 1 day
    expect(document.getElementById('countdown-days').textContent).toBe(daysBefore);
  });

  test('can be called safely when no interval is running', () => {
    expect(() => window.Countdown.stop()).not.toThrow();
  });
});
