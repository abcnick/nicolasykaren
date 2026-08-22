// RSVP form validation & submission

(function () {
  'use strict';

  var _guestId = null;
  var _ticketCount = null;

  /**
   * Validate a phone number string.
   * Accepts optional leading + followed by 7 to 15 digits, nothing else.
   * @param {string} phone
   * @returns {boolean}
   */
  function _validatePhone(phone) {
    if (typeof phone !== 'string') return false;
    return /^\+?\d{7,15}$/.test(phone);
  }

  /**
   * Initialize the RSVP form.
   * Builds dropdown options, attaches event listeners.
   * @param {string} guestId - The guest's unique identifier
   * @param {number} ticketCount - Integer 1-20, max attendees allowed
   */
  function init(guestId, ticketCount) {
    _guestId = guestId;
    _ticketCount = ticketCount;

    var dropdown = document.getElementById('rsvp-attendance');
    if (!dropdown) return;

    // Clear existing options
    dropdown.innerHTML = '';

    // Placeholder option
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccionar...';
    placeholder.disabled = true;
    placeholder.selected = true;
    dropdown.appendChild(placeholder);

    // "Lo siento" option (value = 0)
    var declineOption = document.createElement('option');
    declineOption.value = '0';
    declineOption.textContent = 'Lo siento';
    dropdown.appendChild(declineOption);

    // Numeric options 1 to ticketCount
    for (var i = 1; i <= ticketCount; i++) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      dropdown.appendChild(opt);
    }

    // Attach change listener
    dropdown.addEventListener('change', _onAttendanceChange);

    // Set up message textarea maxlength
    var messageField = document.getElementById('rsvp-message');
    if (messageField) {
      messageField.setAttribute('maxlength', '500');
    }
  }

  /**
   * Handle dropdown change event.
   * Shows/hides attendee name fields based on selection.
   */
  function _onAttendanceChange() {
    var dropdown = document.getElementById('rsvp-attendance');
    var container = document.getElementById('attendee-names-container');
    if (!dropdown || !container) return;

    var value = dropdown.value;

    if (value === '0') {
      // "Lo siento" — hide attendee name fields
      container.style.display = 'none';
      container.innerHTML = '';
    } else {
      // Numeric value — render K name input fields
      var count = parseInt(value, 10);
      container.style.display = '';
      container.innerHTML = '';

      for (var i = 0; i < count; i++) {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'attendee-name-input';
        input.maxLength = 80;
        input.placeholder = 'Nombre del acompañante';
        container.appendChild(input);
      }
    }

    // Clear any existing name errors when selection changes
    _clearError('attendee-names-error');
  }

  /**
   * Validate the RSVP form.
   * @returns {{ valid: boolean, errors: { attendance?: string, attendeeNames?: string, phone?: string } }}
   */
  function validate() {
    var errors = {};
    var dropdown = document.getElementById('rsvp-attendance');
    var phoneInput = document.getElementById('rsvp-phone');

    // Validate attendance selection
    if (!dropdown || dropdown.value === '') {
      errors.attendance = 'Por favor selecciona una opción';
    }

    // Validate attendee names when attendance > 0
    if (dropdown && dropdown.value !== '' && dropdown.value !== '0') {
      var nameInputs = document.querySelectorAll('#attendee-names-container .attendee-name-input');
      var hasEmptyName = false;
      for (var i = 0; i < nameInputs.length; i++) {
        if (nameInputs[i].value.trim() === '') {
          hasEmptyName = true;
          break;
        }
      }
      if (hasEmptyName) {
        errors.attendeeNames = 'Todos los nombres son obligatorios';
      }
    }

    // Validate phone number
    var phoneValue = phoneInput ? phoneInput.value.trim() : '';
    if (phoneValue === '') {
      errors.phone = 'El teléfono es obligatorio';
    } else if (!_validatePhone(phoneValue)) {
      errors.phone = 'Formato de teléfono no válido';
    }

    // Show/clear inline errors
    if (errors.attendance) {
      _showError('rsvp-attendance-error', errors.attendance);
    } else {
      _clearError('rsvp-attendance-error');
    }

    if (errors.attendeeNames) {
      _showError('attendee-names-error', errors.attendeeNames);
    } else {
      _clearError('attendee-names-error');
    }

    if (errors.phone) {
      _showError('rsvp-phone-error', errors.phone);
    } else {
      _clearError('rsvp-phone-error');
    }

    var valid = Object.keys(errors).length === 0;

    if (valid) {
      return { valid: true, errors: {} };
    }

    return { valid: false, errors: errors };
  }

  /**
   * Submit the RSVP form.
   * Validates, constructs payload, calls API, shows confirmation or error.
   * @returns {Promise<void>}
   */
  async function submit() {
    // Step 1: Validate form — stop if invalid
    var result = validate();
    if (!result.valid) {
      return;
    }

    // Step 2: Construct payload from DOM
    var dropdown = document.getElementById('rsvp-attendance');
    var phoneInput = document.getElementById('rsvp-phone');
    var messageInput = document.getElementById('rsvp-message');

    var attendance = parseInt(dropdown.value, 10);
    var attendeeNames = [];

    if (attendance > 0) {
      var nameInputs = document.querySelectorAll('#attendee-names-container .attendee-name-input');
      for (var i = 0; i < nameInputs.length; i++) {
        attendeeNames.push(nameInputs[i].value.trim());
      }
    }

    var phoneNumber = phoneInput ? phoneInput.value.trim() : '';
    var message = messageInput ? messageInput.value : '';

    var payload = {
      guestId: _guestId,
      attendance: attendance,
      attendeeNames: attendeeNames,
      phoneNumber: phoneNumber,
      message: message
    };

    // Step 3: Call API
    try {
      var response = await window.API.submitRsvp(_guestId, payload);

      if (response && response.error) {
        _showSubmitError(response.message || 'No pudimos conectar. Por favor intenta de nuevo.');
        return;
      }

      // Step 4: On success — hide form, show confirmation
      var form = document.getElementById('rsvp-form');
      var confirmation = document.getElementById('rsvp-confirmation');

      if (form) {
        form.style.display = 'none';
      }
      if (confirmation) {
        confirmation.textContent = '¡Gracias por confirmar!';
        confirmation.style.display = '';
      }
    } catch (err) {
      // Step 5: On error — show error, preserve data, allow retry
      _showSubmitError('No pudimos conectar. Por favor intenta de nuevo.');
    }
  }

  /**
   * Show submission error message and retry button.
   * @param {string} message - Error message to display
   */
  function _showSubmitError(message) {
    var errorContainer = document.getElementById('rsvp-error');
    var errorMessage = document.getElementById('rsvp-error-message');
    var retryBtn = document.getElementById('rsvp-retry-btn');

    if (errorContainer) {
      errorContainer.style.display = '';
    }
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    if (retryBtn) {
      // Remove previous listener to avoid stacking
      retryBtn.onclick = function () {
        // Hide error and retry submission
        if (errorContainer) {
          errorContainer.style.display = 'none';
        }
        submit();
      };
    }
  }

  /**
   * Show an inline error message.
   * @param {string} elementId - The ID of the error element
   * @param {string} message - The error message to display
   */
  function _showError(elementId, message) {
    var el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = '';
    }
  }

  /**
   * Clear an inline error message.
   * @param {string} elementId - The ID of the error element
   */
  function _clearError(elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  // Expose public API
  window.RSVP = {
    init: init,
    validate: validate,
    submit: submit,
    _validatePhone: _validatePhone
  };
})();
