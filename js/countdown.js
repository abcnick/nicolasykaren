/**
 * Countdown Timer Module
 * Displays a live countdown to the configured wedding date.
 * Updates DOM every second with zero-padded days, hours, minutes, seconds.
 * When the wedding date arrives, displays a static message.
 * 
 * Exposed as window.Countdown = { start, stop, _calculate }
 */
(function () {
  'use strict';

  var intervalId = null;

  /**
   * Calculate countdown values from a target timestamp and current timestamp.
   * @param {number} targetMs - Target date in milliseconds since epoch
   * @param {number} nowMs - Current time in milliseconds since epoch
   * @returns {{ days: string, hours: string, minutes: string, seconds: string, arrived: boolean }}
   */
  function _calculate(targetMs, nowMs) {
    var diff = targetMs - nowMs;

    if (diff <= 0) {
      return { days: '00', hours: '00', minutes: '00', seconds: '00', arrived: true };
    }

    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var minutes = Math.floor((diff % 3600000) / 60000);
    var seconds = Math.floor((diff % 60000) / 1000);

    return {
      days: zeroPad(days),
      hours: zeroPad(hours),
      minutes: zeroPad(minutes),
      seconds: zeroPad(seconds),
      arrived: false
    };
  }

  /**
   * Zero-pad a number to at least 2 digits.
   * @param {number} num
   * @returns {string}
   */
  function zeroPad(num) {
    if (num < 10) {
      return '0' + num;
    }
    return String(num);
  }

  /**
   * Update the DOM elements with countdown values or the arrival message.
   * @param {{ days: string, hours: string, minutes: string, seconds: string, arrived: boolean }} result
   */
  function updateDOM(result) {
    var daysEl = document.getElementById('countdown-days');
    var hoursEl = document.getElementById('countdown-hours');
    var minutesEl = document.getElementById('countdown-minutes');
    var secondsEl = document.getElementById('countdown-seconds');
    var messageEl = document.getElementById('countdown-message');

    if (result.arrived) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      if (messageEl) messageEl.textContent = '¡El gran día ha llegado!';
      return;
    }

    if (daysEl) daysEl.textContent = result.days;
    if (hoursEl) hoursEl.textContent = result.hours;
    if (minutesEl) minutesEl.textContent = result.minutes;
    if (secondsEl) secondsEl.textContent = result.seconds;
    if (messageEl) messageEl.textContent = '';
  }

  /**
   * Start the countdown timer targeting the given ISO 8601 date string.
   * @param {string} targetDate - ISO 8601 date-time string
   */
  function start(targetDate) {
    // Validate targetDate
    if (!targetDate || typeof targetDate !== 'string' || targetDate.trim() === '') {
      console.error('Countdown: wedding date is missing or empty.');
      hideSection();
      return;
    }

    var targetMs = new Date(targetDate).getTime();

    if (isNaN(targetMs)) {
      console.error('Countdown: wedding date is invalid — could not parse "' + targetDate + '".');
      hideSection();
      return;
    }

    // Clear any previous interval
    stop();

    // Perform initial update immediately
    var result = _calculate(targetMs, Date.now());
    updateDOM(result);

    if (result.arrived) {
      // Already arrived, no need to start interval
      return;
    }

    // Start interval to update every second
    intervalId = setInterval(function () {
      var result = _calculate(targetMs, Date.now());
      updateDOM(result);

      if (result.arrived) {
        stop();
      }
    }, 1000);
  }

  /**
   * Stop the countdown timer and clear the interval.
   */
  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  /**
   * Hide the countdown section element.
   */
  function hideSection() {
    var section = document.getElementById('countdown-section');
    if (section) {
      section.style.display = 'none';
    }
  }

  // Expose public API
  window.Countdown = {
    start: start,
    stop: stop,
    _calculate: _calculate
  };
})();
