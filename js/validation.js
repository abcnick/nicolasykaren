// Guest input validation module
// Used by Admin Interface for validating guest creation and editing

/**
 * Validates guest input (name and ticket count) for creating or editing a guest record.
 * @param {*} name - The guest name to validate
 * @param {*} ticketCount - The ticket count to validate
 * @returns {{ valid: boolean, errors?: { name?: string, ticketCount?: string } }}
 */
function validateGuestInput(name, ticketCount) {
  const errors = {};

  // Validate name: must be a string, 1-100 chars, not whitespace-only
  if (typeof name !== 'string' || name.length === 0) {
    errors.name = 'El nombre es obligatorio';
  } else if (name.trim().length === 0) {
    errors.name = 'El nombre no puede contener solo espacios';
  } else if (name.length > 100) {
    errors.name = 'El nombre no puede exceder 100 caracteres';
  }

  // Validate ticketCount: must be an integer between 1 and 20 (inclusive)
  if (typeof ticketCount !== 'number' || !Number.isInteger(ticketCount) || !isFinite(ticketCount)) {
    errors.ticketCount = 'La cantidad de boletos debe ser un número entero';
  } else if (ticketCount < 1 || ticketCount > 20) {
    errors.ticketCount = 'La cantidad de boletos debe estar entre 1 y 20';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// Expose globally for browser usage
if (typeof window !== 'undefined') {
  window.Validation = { validateGuestInput };
}

// Export for testing (Node.js/Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateGuestInput };
}
