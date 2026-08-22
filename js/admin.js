/**
 * Admin Interface Module
 *
 * Handles login/logout UI flow and guest management CRUD operations.
 * On load, checks Auth.isAuthenticated() to determine initial state.
 * Provides login form with error messaging and logout button.
 * After login, renders guest management: create form, guest table,
 * inline editing, deletion with confirmation, and copy-link functionality.
 *
 * Dependencies: window.Auth (auth.js), window.API (api.js),
 *              window.Validation.validateGuestInput (validation.js), window.CONFIG (config.js)
 * Exposes: window.Admin = { init, loadGuests, createGuest, editGuest, deleteGuest, copyLink }
 */

(function () {
  'use strict';

  var LINK_BASE = 'https://nicolasykaren.com/?guest=';

  /**
   * Renders the guest management UI (create form + table) into #guest-management.
   */
  function renderGuestManagementShell() {
    var container = document.getElementById('guest-management');
    if (!container) return;

    container.innerHTML =
      '<form id="create-guest-form">' +
        '<input id="new-guest-name" placeholder="Nombre" maxlength="100">' +
        '<input id="new-guest-tickets" type="number" min="1" max="20" value="1">' +
        '<button type="submit">Crear invitado</button>' +
        '<p id="create-guest-error" style="display:none;"></p>' +
        '<p id="create-guest-success" style="display:none;"></p>' +
      '</form>' +
      '<div id="guest-table-container"></div>';

    var form = document.getElementById('create-guest-form');
    form.addEventListener('submit', handleCreateGuest);
  }

  /**
   * Handles the create guest form submission.
   * Validates input, calls API, displays link or error.
   * @param {Event} e - The form submit event
   */
  async function handleCreateGuest(e) {
    e.preventDefault();

    var nameInput = document.getElementById('new-guest-name');
    var ticketsInput = document.getElementById('new-guest-tickets');
    var errorEl = document.getElementById('create-guest-error');
    var successEl = document.getElementById('create-guest-success');

    var name = nameInput.value;
    var ticketCount = parseInt(ticketsInput.value, 10);

    // Clear previous messages
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    successEl.style.display = 'none';
    successEl.textContent = '';

    // Validate input
    var validation = Validation.validateGuestInput(name, ticketCount);
    if (!validation.valid) {
      var errorMessages = [];
      if (validation.errors.name) errorMessages.push(validation.errors.name);
      if (validation.errors.ticketCount) errorMessages.push(validation.errors.ticketCount);
      errorEl.textContent = errorMessages.join('. ');
      errorEl.style.display = '';
      return;
    }

    // Call API
    var result = await API.createGuest(name, ticketCount);

    if (result.error) {
      if (result.duplicate) {
        errorEl.textContent = 'Ya existe un invitado con ese nombre';
      } else {
        errorEl.textContent = result.message || 'Error al crear invitado';
      }
      errorEl.style.display = '';
      return;
    }

    // Success: show generated link
    var link = result.link || (LINK_BASE + result.id);
    successEl.textContent = 'Invitado creado. Enlace: ' + link;
    successEl.style.display = '';

    // Clear form
    nameInput.value = '';
    ticketsInput.value = '1';

    // Reload table
    await loadGuests();
  }

  /**
   * Loads all guests from the API and renders the table.
   */
  async function loadGuests() {
    var container = document.getElementById('guest-table-container');
    if (!container) return;

    var result = await API.getAllGuests();

    if (result.error) {
      container.innerHTML = '<p class="guest-load-error">Error al cargar invitados: ' +
        (result.message || 'Error desconocido') + '</p>';
      return;
    }

    var guests = Array.isArray(result) ? result : (result.guests || []);

    if (guests.length === 0) {
      container.innerHTML = '<p>No hay invitados registrados.</p>';
      return;
    }

    var html = '<table id="guest-table">' +
      '<thead><tr>' +
        '<th>Nombre</th>' +
        '<th>Boletos</th>' +
        '<th>RSVP</th>' +
        '<th>Enlace</th>' +
        '<th>Acciones</th>' +
      '</tr></thead><tbody>';

    for (var i = 0; i < guests.length; i++) {
      var guest = guests[i];
      var link = guest.link || (LINK_BASE + guest.id);
      var rsvpStatus = guest.rsvpStatus || 'Pendiente';

      html += '<tr data-guest-id="' + guest.id + '">' +
        '<td class="guest-name-cell">' + escapeHtml(guest.name) + '</td>' +
        '<td class="guest-tickets-cell">' + guest.ticketCount + '</td>' +
        '<td>' + escapeHtml(rsvpStatus) + '</td>' +
        '<td class="guest-link-cell">' +
          '<span class="guest-link-text">' + escapeHtml(link) + '</span>' +
        '</td>' +
        '<td class="guest-actions-cell">' +
          '<button class="btn-edit" data-id="' + guest.id + '">Editar</button>' +
          '<button class="btn-delete" data-id="' + guest.id + '">Eliminar</button>' +
          '<button class="btn-copy" data-link="' + escapeHtml(link) + '">Copiar enlace</button>' +
        '</td>' +
      '</tr>';
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    // Attach event listeners
    attachTableListeners();
  }

  /**
   * Attaches click event listeners to table action buttons.
   */
  function attachTableListeners() {
    var table = document.getElementById('guest-table');
    if (!table) return;

    table.addEventListener('click', function (e) {
      var target = e.target;

      if (target.classList.contains('btn-edit')) {
        startEdit(target.getAttribute('data-id'));
      } else if (target.classList.contains('btn-delete')) {
        deleteGuest(target.getAttribute('data-id'));
      } else if (target.classList.contains('btn-copy')) {
        copyLink(target.getAttribute('data-link'));
      } else if (target.classList.contains('btn-save-edit')) {
        saveEdit(target.getAttribute('data-id'));
      } else if (target.classList.contains('btn-cancel-edit')) {
        loadGuests();
      }
    });
  }

  /**
   * Replaces a guest table row with inline edit inputs.
   * @param {string} id - The guest ID to edit
   */
  function startEdit(id) {
    var row = document.querySelector('tr[data-guest-id="' + id + '"]');
    if (!row) return;

    var nameCell = row.querySelector('.guest-name-cell');
    var ticketsCell = row.querySelector('.guest-tickets-cell');
    var actionsCell = row.querySelector('.guest-actions-cell');

    var currentName = nameCell.textContent;
    var currentTickets = ticketsCell.textContent;

    nameCell.innerHTML = '<input class="edit-name-input" value="' + escapeHtml(currentName) + '" maxlength="100">';
    ticketsCell.innerHTML = '<input class="edit-tickets-input" type="number" min="1" max="20" value="' + currentTickets + '">';
    actionsCell.innerHTML =
      '<button class="btn-save-edit" data-id="' + id + '">Guardar</button>' +
      '<button class="btn-cancel-edit" data-id="' + id + '">Cancelar</button>' +
      '<p class="edit-error" style="display:none;"></p>';
  }

  /**
   * Saves inline edit changes for a guest.
   * Validates input and calls API.updateGuest().
   * @param {string} id - The guest ID being edited
   */
  async function saveEdit(id) {
    var row = document.querySelector('tr[data-guest-id="' + id + '"]');
    if (!row) return;

    var nameInput = row.querySelector('.edit-name-input');
    var ticketsInput = row.querySelector('.edit-tickets-input');
    var errorEl = row.querySelector('.edit-error');

    var name = nameInput.value;
    var ticketCount = parseInt(ticketsInput.value, 10);

    // Clear previous error
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }

    // Validate
    var validation = Validation.validateGuestInput(name, ticketCount);
    if (!validation.valid) {
      var errorMessages = [];
      if (validation.errors.name) errorMessages.push(validation.errors.name);
      if (validation.errors.ticketCount) errorMessages.push(validation.errors.ticketCount);
      if (errorEl) {
        errorEl.textContent = errorMessages.join('. ');
        errorEl.style.display = '';
      }
      return;
    }

    // Call API
    var result = await API.updateGuest(id, { name: name, ticketCount: ticketCount });

    if (result.error) {
      if (errorEl) {
        errorEl.textContent = result.message || 'Error al actualizar invitado';
        errorEl.style.display = '';
      }
      return;
    }

    // Reload table to show updated data
    await loadGuests();
  }

  /**
   * Deletes a guest after confirmation dialog.
   * @param {string} id - The guest ID to delete
   */
  async function deleteGuest(id) {
    var confirmed = confirm('¿Estás seguro de que deseas eliminar este invitado?');
    if (!confirmed) return;

    var result = await API.deleteGuest(id);

    if (result.error) {
      var container = document.getElementById('guest-table-container');
      // Show error at top of table container
      var existingError = container.querySelector('.guest-delete-error');
      if (existingError) existingError.remove();

      var errorP = document.createElement('p');
      errorP.className = 'guest-delete-error';
      errorP.textContent = result.message || 'Error al eliminar invitado';
      container.insertBefore(errorP, container.firstChild);
      return;
    }

    // Reload table
    await loadGuests();
  }

  /**
   * Copies an invitation link to clipboard.
   * Falls back to selecting text in a temporary input on failure.
   * @param {string} link - The URL to copy
   */
  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
    } catch (err) {
      // Fallback: create a temporary input, select text
      var tempInput = document.createElement('input');
      tempInput.value = link;
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
      } catch (copyErr) {
        // If even execCommand fails, the text is at least selected
      }
      document.body.removeChild(tempInput);
    }
  }

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param {string} str - The string to escape
   * @returns {string} Escaped string safe for HTML insertion
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Initializes the admin interface.
   * - Checks current authentication state and shows appropriate view
   * - Attaches event listeners for login and logout buttons
   * - If authenticated, renders guest management and loads guests
   */
  function init() {
    var loginForm = document.getElementById('admin-login-form');
    var adminContent = document.getElementById('admin-content');
    var passwordInput = document.getElementById('admin-password');
    var loginBtn = document.getElementById('admin-login-btn');
    var loginError = document.getElementById('admin-login-error');
    var logoutBtn = document.getElementById('admin-logout-btn');

    // Check if already authenticated on page load
    if (Auth.isAuthenticated()) {
      loginForm.style.display = 'none';
      adminContent.style.display = '';
      renderGuestManagementShell();
      loadGuests();
    } else {
      loginForm.style.display = '';
      adminContent.style.display = 'none';
    }

    // Login button click handler
    loginBtn.addEventListener('click', async function () {
      var password = passwordInput.value;
      var success = await Auth.authenticate(password);

      if (success) {
        loginForm.style.display = 'none';
        adminContent.style.display = '';
        loginError.style.display = 'none';
        loginError.textContent = '';
        renderGuestManagementShell();
        loadGuests();
      } else {
        loginError.textContent = 'Contraseña incorrecta';
        loginError.style.display = '';
        passwordInput.value = '';
      }
    });

    // Logout button click handler
    logoutBtn.addEventListener('click', function () {
      Auth.logout();
      adminContent.style.display = 'none';
      loginForm.style.display = '';
      loginError.style.display = 'none';
      loginError.textContent = '';
      passwordInput.value = '';
    });
  }

  // Expose public API globally
  window.Admin = {
    init: init,
    loadGuests: loadGuests,
    createGuest: handleCreateGuest,
    editGuest: saveEdit,
    deleteGuest: deleteGuest,
    copyLink: copyLink
  };
})();
