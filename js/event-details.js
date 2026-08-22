/**
 * Event Details Module
 * Renders ceremony date, venue information, itinerary timeline, and reception details.
 * Reads from the global CONFIG object.
 *
 * Exposed as: window.EventDetails = { init, _formatDate }
 */

(function () {
  'use strict';

  /**
   * Format an ISO 8601 date string to "Saturday, June 14, 2025 at 4:00 PM" format.
   * Uses English weekday and month names.
   * @param {string} isoString - ISO 8601 date-time string
   * @returns {string} Formatted date string, or empty string if invalid
   */
  function formatDate(isoString) {
    if (!isoString) {
      return '';
    }

    var date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return '';
    }

    var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    var weekday = weekdays[date.getDay()];
    var month = months[date.getMonth()];
    var day = date.getDate();
    var year = date.getFullYear();

    var hours = date.getHours();
    var minutes = date.getMinutes();
    var period = hours >= 12 ? 'PM' : 'AM';
    var displayHour = hours % 12;
    if (displayHour === 0) {
      displayHour = 12;
    }
    var displayMinutes = minutes < 10 ? '0' + minutes : String(minutes);

    return weekday + ', ' + month + ' ' + day + ', ' + year + ' at ' + displayHour + ':' + displayMinutes + ' ' + period;
  }

  /**
   * Parse a time string (e.g. "4:00 PM", "11:30 AM") to minutes since midnight for sorting.
   * @param {string} timeStr - Time string in H:MM AM/PM format
   * @returns {number} Minutes since midnight, or 0 if unparsable
   */
  function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
      return 0;
    }

    var match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      return 0;
    }

    var hour = parseInt(match[1], 10);
    var min = parseInt(match[2], 10);
    var period = match[3].toUpperCase();

    if (period === 'AM' && hour === 12) {
      hour = 0;
    } else if (period === 'PM' && hour !== 12) {
      hour += 12;
    }

    return hour * 60 + min;
  }

  /**
   * Render the ceremony date into the DOM.
   */
  function renderCeremonyDate() {
    var dateEl = document.getElementById('ceremony-date');
    if (!dateEl) return;

    if (typeof CONFIG === 'undefined' || !CONFIG.wedding || !CONFIG.wedding.date) {
      dateEl.textContent = '';
      return;
    }

    var formatted = formatDate(CONFIG.wedding.date);
    dateEl.textContent = formatted;
  }

  /**
   * Render ceremony venue name, address, and Google Maps link.
   */
  function renderCeremonyVenue() {
    if (typeof CONFIG === 'undefined' || !CONFIG.ceremony) return;

    var venueEl = document.getElementById('ceremony-venue');
    var addressEl = document.getElementById('ceremony-address');
    var mapLinkEl = document.getElementById('ceremony-map-link');

    if (venueEl) {
      venueEl.textContent = CONFIG.ceremony.venue || '';
    }

    if (addressEl) {
      addressEl.textContent = CONFIG.ceremony.address || '';
    }

    if (mapLinkEl) {
      if (CONFIG.ceremony.mapsUrl) {
        mapLinkEl.href = CONFIG.ceremony.mapsUrl;
        mapLinkEl.target = '_blank';
        mapLinkEl.rel = 'noopener noreferrer';
      } else {
        mapLinkEl.style.display = 'none';
      }
    }
  }

  /**
   * Get SVG icon string for an itinerary item.
   * @param {string} iconName - Icon identifier (church, cocktail, dinner)
   * @returns {string} SVG markup string
   */
  function getItineraryIcon(iconName) {
    var icons = {
      church: 'img/icons/ceremonia.png',
      cocktail: 'img/icons/coctel.png',
      dinner: 'img/icons/recepcion.png'
    };
    var src = icons[iconName];
    if (!src) return '';
    return '<img src="' + src + '" alt="' + (iconName || '') + '" class="itinerary-icon-img">';
  }

  /**
   * Render the itinerary timeline in chronological order.
   * Hides the itinerary section if no items are configured.
   */
  function renderItinerary() {
    var sectionEl = document.getElementById('itinerary-section');
    var listEl = document.getElementById('itinerary-list');

    // Hide if no itinerary configured
    if (typeof CONFIG === 'undefined' || !CONFIG.itinerary || !Array.isArray(CONFIG.itinerary) || CONFIG.itinerary.length === 0) {
      if (sectionEl) {
        sectionEl.style.display = 'none';
      }
      return;
    }

    // Show section
    if (sectionEl) {
      sectionEl.style.display = '';
    }

    if (!listEl) return;

    // Sort itinerary items by time (chronological order)
    var sorted = CONFIG.itinerary.slice().sort(function (a, b) {
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });

    // Clear existing content
    listEl.innerHTML = '';

    // Render each item
    sorted.forEach(function (item) {
      var li = document.createElement('li');

      var iconSpan = document.createElement('span');
      iconSpan.className = 'itinerary-icon';
      iconSpan.innerHTML = getItineraryIcon(item.icon || '');

      var infoDiv = document.createElement('div');
      infoDiv.className = 'itinerary-info';

      var timeSpan = document.createElement('span');
      timeSpan.className = 'time';
      timeSpan.textContent = item.time || '';

      var descSpan = document.createElement('span');
      descSpan.className = 'description';
      descSpan.textContent = item.description || '';

      infoDiv.appendChild(timeSpan);
      infoDiv.appendChild(descSpan);

      li.appendChild(iconSpan);
      li.appendChild(infoDiv);

      listEl.appendChild(li);
    });
  }

  /**
   * Render reception details (venue, address, start time).
   */
  function renderReception() {
    if (typeof CONFIG === 'undefined' || !CONFIG.reception) return;

    var venueEl = document.getElementById('reception-venue');
    var addressEl = document.getElementById('reception-address');
    var timeEl = document.getElementById('reception-time');

    if (venueEl) {
      venueEl.textContent = CONFIG.reception.venue || '';
    }

    if (addressEl) {
      addressEl.textContent = CONFIG.reception.address || '';
    }

    if (timeEl) {
      timeEl.textContent = CONFIG.reception.startTime || '';
    }
  }

  /**
   * Initialize event details rendering.
   * Call on DOMContentLoaded or when the guest page loads.
   * Reads from CONFIG and populates DOM elements.
   * Gracefully handles missing config sections.
   */
  function init() {
    renderCeremonyDate();
    renderCeremonyVenue();
    renderItinerary();
    renderReception();
  }

  // Expose as global
  window.EventDetails = {
    init: init,
    _formatDate: formatDate
  };
})();
