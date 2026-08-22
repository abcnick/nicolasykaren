/**
 * Unit tests for the Admin Interface Module (js/admin.js)
 *
 * Tests login/logout UI flow, authentication state checks,
 * error display, and input clearing behavior.
 * Also tests guest management CRUD operations.
 */

// Mock Auth module
const mockAuth = {
  isAuthenticated: jest.fn(),
  authenticate: jest.fn(),
  logout: jest.fn()
};

// Mock API module
const mockAPI = {
  getAllGuests: jest.fn(),
  createGuest: jest.fn(),
  updateGuest: jest.fn(),
  deleteGuest: jest.fn()
};

// Mock Validation module
const mockValidation = {
  validateGuestInput: jest.fn()
};

// Mock CONFIG
global.CONFIG = {
  admin: { passwordHash: 'somehash' }
};

// Set up globals before loading admin.js
global.Auth = mockAuth;
global.API = mockAPI;
global.Validation = mockValidation;

// Mock navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: jest.fn()
  },
  writable: true,
  configurable: true
});

// Mock confirm
global.confirm = jest.fn();

// Helper: create DOM structure matching admin.html
function setupDOM() {
  document.body.innerHTML = `
    <div id="admin-login-form">
      <input type="password" id="admin-password" placeholder="Contraseña">
      <button id="admin-login-btn">Ingresar</button>
      <p id="admin-login-error" style="display:none;"></p>
    </div>
    <div id="admin-content" style="display:none;">
      <button id="admin-logout-btn">Cerrar sesión</button>
      <div id="guest-management"></div>
    </div>
  `;
}

// Load admin module
require('../js/admin.js');

describe('Admin Interface Module', () => {
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    // Default mock to prevent unhandled promise errors when init() triggers loadGuests()
    mockAPI.getAllGuests.mockResolvedValue([]);
  });

  describe('init() - initial state', () => {
    test('shows admin content and hides login form when already authenticated', () => {
      mockAuth.isAuthenticated.mockReturnValue(true);

      Admin.init();

      const loginForm = document.getElementById('admin-login-form');
      const adminContent = document.getElementById('admin-content');
      expect(loginForm.style.display).toBe('none');
      expect(adminContent.style.display).toBe('');
    });

    test('shows login form and hides admin content when not authenticated', () => {
      mockAuth.isAuthenticated.mockReturnValue(false);

      Admin.init();

      const loginForm = document.getElementById('admin-login-form');
      const adminContent = document.getElementById('admin-content');
      expect(loginForm.style.display).toBe('');
      expect(adminContent.style.display).toBe('none');
    });

    test('calls Auth.isAuthenticated() on init', () => {
      mockAuth.isAuthenticated.mockReturnValue(false);

      Admin.init();

      expect(mockAuth.isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('init() - login flow', () => {
    beforeEach(() => {
      mockAuth.isAuthenticated.mockReturnValue(false);
      mockAPI.getAllGuests.mockResolvedValue([]);
    });

    test('on successful login, hides login form and shows admin content', async () => {
      mockAuth.authenticate.mockResolvedValue(true);
      Admin.init();

      const passwordInput = document.getElementById('admin-password');
      const loginBtn = document.getElementById('admin-login-btn');
      passwordInput.value = 'correctpassword';

      loginBtn.click();
      // Wait for async authenticate to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      const loginForm = document.getElementById('admin-login-form');
      const adminContent = document.getElementById('admin-content');
      expect(loginForm.style.display).toBe('none');
      expect(adminContent.style.display).toBe('');
    });

    test('on successful login, hides any previous error message', async () => {
      mockAuth.authenticate.mockResolvedValue(true);
      Admin.init();

      const loginError = document.getElementById('admin-login-error');
      // Simulate a previous error being visible
      loginError.style.display = '';
      loginError.textContent = 'Contraseña incorrecta';

      const passwordInput = document.getElementById('admin-password');
      const loginBtn = document.getElementById('admin-login-btn');
      passwordInput.value = 'correctpassword';

      loginBtn.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(loginError.style.display).toBe('none');
      expect(loginError.textContent).toBe('');
    });

    test('on failed login, shows error "Contraseña incorrecta"', async () => {
      mockAuth.authenticate.mockResolvedValue(false);
      Admin.init();

      const passwordInput = document.getElementById('admin-password');
      const loginBtn = document.getElementById('admin-login-btn');
      passwordInput.value = 'wrongpassword';

      loginBtn.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      const loginError = document.getElementById('admin-login-error');
      expect(loginError.textContent).toBe('Contraseña incorrecta');
      expect(loginError.style.display).toBe('');
    });

    test('on failed login, clears password input', async () => {
      mockAuth.authenticate.mockResolvedValue(false);
      Admin.init();

      const passwordInput = document.getElementById('admin-password');
      const loginBtn = document.getElementById('admin-login-btn');
      passwordInput.value = 'wrongpassword';

      loginBtn.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(passwordInput.value).toBe('');
    });

    test('on failed login, login form remains visible', async () => {
      mockAuth.authenticate.mockResolvedValue(false);
      Admin.init();

      const passwordInput = document.getElementById('admin-password');
      const loginBtn = document.getElementById('admin-login-btn');
      passwordInput.value = 'wrongpassword';

      loginBtn.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      const loginForm = document.getElementById('admin-login-form');
      const adminContent = document.getElementById('admin-content');
      expect(loginForm.style.display).toBe('');
      expect(adminContent.style.display).toBe('none');
    });

    test('calls Auth.authenticate with the password from the input', async () => {
      mockAuth.authenticate.mockResolvedValue(false);
      Admin.init();

      const passwordInput = document.getElementById('admin-password');
      const loginBtn = document.getElementById('admin-login-btn');
      passwordInput.value = 'mySecretPass';

      loginBtn.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAuth.authenticate).toHaveBeenCalledWith('mySecretPass');
    });
  });

  describe('init() - logout flow', () => {
    beforeEach(() => {
      mockAuth.isAuthenticated.mockReturnValue(true);
    });

    test('on logout, calls Auth.logout()', () => {
      Admin.init();

      const logoutBtn = document.getElementById('admin-logout-btn');
      logoutBtn.click();

      expect(mockAuth.logout).toHaveBeenCalled();
    });

    test('on logout, hides admin content and shows login form', () => {
      Admin.init();

      const logoutBtn = document.getElementById('admin-logout-btn');
      logoutBtn.click();

      const loginForm = document.getElementById('admin-login-form');
      const adminContent = document.getElementById('admin-content');
      expect(adminContent.style.display).toBe('none');
      expect(loginForm.style.display).toBe('');
    });

    test('on logout, clears error message and password input', () => {
      Admin.init();

      // Simulate some previous state
      const passwordInput = document.getElementById('admin-password');
      const loginError = document.getElementById('admin-login-error');
      passwordInput.value = 'leftover';
      loginError.textContent = 'some error';
      loginError.style.display = '';

      const logoutBtn = document.getElementById('admin-logout-btn');
      logoutBtn.click();

      expect(passwordInput.value).toBe('');
      expect(loginError.style.display).toBe('none');
      expect(loginError.textContent).toBe('');
    });
  });

  describe('window.Admin exposure', () => {
    test('Admin is exposed globally on window', () => {
      expect(window.Admin).toBeDefined();
    });

    test('Admin.init is a function', () => {
      expect(typeof window.Admin.init).toBe('function');
    });
  });
});


describe('Guest Management - loadGuests()', () => {
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    mockAuth.isAuthenticated.mockReturnValue(true);
    Admin.init();
  });

  test('renders guest table with data from API.getAllGuests()', async () => {
    mockAPI.getAllGuests.mockResolvedValue([
      { id: 'abc12345', name: 'Juan Pérez', ticketCount: 3, rsvpStatus: 'Confirmado', link: 'https://nicolasykaren.com/?guest=abc12345' },
      { id: 'def67890', name: 'María López', ticketCount: 2, rsvpStatus: 'Pendiente', link: 'https://nicolasykaren.com/?guest=def67890' }
    ]);

    await Admin.loadGuests();

    const table = document.getElementById('guest-table');
    expect(table).not.toBeNull();
    expect(table.querySelectorAll('tbody tr').length).toBe(2);
    expect(table.textContent).toContain('Juan Pérez');
    expect(table.textContent).toContain('María López');
  });

  test('displays "No hay invitados registrados" when no guests exist', async () => {
    mockAPI.getAllGuests.mockResolvedValue([]);

    await Admin.loadGuests();

    const container = document.getElementById('guest-table-container');
    expect(container.textContent).toContain('No hay invitados registrados');
  });

  test('displays error message when API.getAllGuests() fails', async () => {
    mockAPI.getAllGuests.mockResolvedValue({ error: true, message: 'No pudimos conectar. Por favor intenta de nuevo.' });

    await Admin.loadGuests();

    const container = document.getElementById('guest-table-container');
    expect(container.textContent).toContain('Error al cargar invitados');
  });

  test('table columns include Name, Tickets, RSVP, Link, Actions', async () => {
    mockAPI.getAllGuests.mockResolvedValue([
      { id: 'abc12345', name: 'Test', ticketCount: 1, rsvpStatus: 'Pendiente' }
    ]);

    await Admin.loadGuests();

    const headers = document.querySelectorAll('#guest-table thead th');
    const headerTexts = Array.from(headers).map(h => h.textContent);
    expect(headerTexts).toEqual(['Nombre', 'Boletos', 'RSVP', 'Enlace', 'Acciones']);
  });

  test('each row has Edit, Delete, and Copy link buttons', async () => {
    mockAPI.getAllGuests.mockResolvedValue([
      { id: 'abc12345', name: 'Test', ticketCount: 1, rsvpStatus: 'Pendiente' }
    ]);

    await Admin.loadGuests();

    const row = document.querySelector('tr[data-guest-id="abc12345"]');
    expect(row.querySelector('.btn-edit')).not.toBeNull();
    expect(row.querySelector('.btn-delete')).not.toBeNull();
    expect(row.querySelector('.btn-copy')).not.toBeNull();
  });

  test('generates link from LINK_BASE + id when link not provided by API', async () => {
    mockAPI.getAllGuests.mockResolvedValue([
      { id: 'xyz99999', name: 'Test Guest', ticketCount: 1, rsvpStatus: 'Pendiente' }
    ]);

    await Admin.loadGuests();

    const row = document.querySelector('tr[data-guest-id="xyz99999"]');
    const linkText = row.querySelector('.guest-link-text').textContent;
    expect(linkText).toBe('https://nicolasykaren.com/?guest=xyz99999');
  });
});

describe('Guest Management - createGuest()', () => {
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAPI.getAllGuests.mockResolvedValue([]);
    Admin.init();
  });

  test('validates input before calling API', async () => {
    mockValidation.validateGuestInput.mockReturnValue({
      valid: false,
      errors: { name: 'El nombre es obligatorio' }
    });

    const nameInput = document.getElementById('new-guest-name');
    const form = document.getElementById('create-guest-form');
    nameInput.value = '';

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockAPI.createGuest).not.toHaveBeenCalled();
    const errorEl = document.getElementById('create-guest-error');
    expect(errorEl.style.display).toBe('');
    expect(errorEl.textContent).toContain('El nombre es obligatorio');
  });

  test('calls API.createGuest with valid input', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.createGuest.mockResolvedValue({ id: 'newid123', link: 'https://nicolasykaren.com/?guest=newid123' });

    const nameInput = document.getElementById('new-guest-name');
    const ticketsInput = document.getElementById('new-guest-tickets');
    const form = document.getElementById('create-guest-form');
    nameInput.value = 'Nuevo Invitado';
    ticketsInput.value = '3';

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockAPI.createGuest).toHaveBeenCalledWith('Nuevo Invitado', 3);
  });

  test('shows generated link on successful creation', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.createGuest.mockResolvedValue({ id: 'newid123', link: 'https://nicolasykaren.com/?guest=newid123' });

    const nameInput = document.getElementById('new-guest-name');
    const ticketsInput = document.getElementById('new-guest-tickets');
    const form = document.getElementById('create-guest-form');
    nameInput.value = 'Nuevo Invitado';
    ticketsInput.value = '2';

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const successEl = document.getElementById('create-guest-success');
    expect(successEl.style.display).toBe('');
    expect(successEl.textContent).toContain('https://nicolasykaren.com/?guest=newid123');
  });

  test('clears form after successful creation', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.createGuest.mockResolvedValue({ id: 'newid123', link: 'https://nicolasykaren.com/?guest=newid123' });

    const nameInput = document.getElementById('new-guest-name');
    const ticketsInput = document.getElementById('new-guest-tickets');
    const form = document.getElementById('create-guest-form');
    nameInput.value = 'Test';
    ticketsInput.value = '5';

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(nameInput.value).toBe('');
    expect(ticketsInput.value).toBe('1');
  });

  test('shows duplicate error message when API returns duplicate flag', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.createGuest.mockResolvedValue({ error: true, duplicate: true, message: 'Duplicate' });

    const nameInput = document.getElementById('new-guest-name');
    const ticketsInput = document.getElementById('new-guest-tickets');
    const form = document.getElementById('create-guest-form');
    nameInput.value = 'Duplicate Guest';
    ticketsInput.value = '1';

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const errorEl = document.getElementById('create-guest-error');
    expect(errorEl.style.display).toBe('');
    expect(errorEl.textContent).toBe('Ya existe un invitado con ese nombre');
  });

  test('shows generic error on API failure', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.createGuest.mockResolvedValue({ error: true, message: 'No pudimos conectar.' });

    const nameInput = document.getElementById('new-guest-name');
    const ticketsInput = document.getElementById('new-guest-tickets');
    const form = document.getElementById('create-guest-form');
    nameInput.value = 'Test';
    ticketsInput.value = '1';

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    const errorEl = document.getElementById('create-guest-error');
    expect(errorEl.style.display).toBe('');
    expect(errorEl.textContent).toBe('No pudimos conectar.');
  });

  test('preserves form data on API error', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.createGuest.mockResolvedValue({ error: true, message: 'Server error' });

    const nameInput = document.getElementById('new-guest-name');
    const ticketsInput = document.getElementById('new-guest-tickets');
    const form = document.getElementById('create-guest-form');
    nameInput.value = 'Keep This';
    ticketsInput.value = '5';

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(nameInput.value).toBe('Keep This');
    expect(ticketsInput.value).toBe('5');
  });
});

describe('Guest Management - inline edit', () => {
  beforeEach(async () => {
    setupDOM();
    jest.clearAllMocks();
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAPI.getAllGuests.mockResolvedValue([
      { id: 'edit123', name: 'Original Name', ticketCount: 2, rsvpStatus: 'Pendiente' }
    ]);
    Admin.init();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  test('clicking Edit replaces name and ticket cells with inputs', () => {
    const editBtn = document.querySelector('.btn-edit[data-id="edit123"]');
    editBtn.click();

    const row = document.querySelector('tr[data-guest-id="edit123"]');
    const nameInput = row.querySelector('.edit-name-input');
    const ticketsInput = row.querySelector('.edit-tickets-input');
    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe('Original Name');
    expect(ticketsInput).not.toBeNull();
    expect(ticketsInput.value).toBe('2');
  });

  test('clicking Edit shows Save and Cancel buttons', () => {
    const editBtn = document.querySelector('.btn-edit[data-id="edit123"]');
    editBtn.click();

    const row = document.querySelector('tr[data-guest-id="edit123"]');
    expect(row.querySelector('.btn-save-edit')).not.toBeNull();
    expect(row.querySelector('.btn-cancel-edit')).not.toBeNull();
  });

  test('Save calls API.updateGuest with validated data', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.updateGuest.mockResolvedValue({ success: true });
    mockAPI.getAllGuests.mockResolvedValue([
      { id: 'edit123', name: 'Updated Name', ticketCount: 5, rsvpStatus: 'Pendiente' }
    ]);

    const editBtn = document.querySelector('.btn-edit[data-id="edit123"]');
    editBtn.click();

    const row = document.querySelector('tr[data-guest-id="edit123"]');
    row.querySelector('.edit-name-input').value = 'Updated Name';
    row.querySelector('.edit-tickets-input').value = '5';

    const saveBtn = row.querySelector('.btn-save-edit');
    saveBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockAPI.updateGuest).toHaveBeenCalledWith('edit123', { name: 'Updated Name', ticketCount: 5 });
  });

  test('Save shows validation error when input is invalid', async () => {
    mockValidation.validateGuestInput.mockReturnValue({
      valid: false,
      errors: { ticketCount: 'La cantidad de boletos debe estar entre 1 y 20' }
    });

    const editBtn = document.querySelector('.btn-edit[data-id="edit123"]');
    editBtn.click();

    const row = document.querySelector('tr[data-guest-id="edit123"]');
    row.querySelector('.edit-tickets-input').value = '25';

    const saveBtn = row.querySelector('.btn-save-edit');
    saveBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const errorEl = row.querySelector('.edit-error');
    expect(errorEl.style.display).toBe('');
    expect(errorEl.textContent).toContain('La cantidad de boletos debe estar entre 1 y 20');
    expect(mockAPI.updateGuest).not.toHaveBeenCalled();
  });

  test('Save shows API error when update fails', async () => {
    mockValidation.validateGuestInput.mockReturnValue({ valid: true });
    mockAPI.updateGuest.mockResolvedValue({ error: true, message: 'Error al actualizar' });

    const editBtn = document.querySelector('.btn-edit[data-id="edit123"]');
    editBtn.click();

    const row = document.querySelector('tr[data-guest-id="edit123"]');
    const saveBtn = row.querySelector('.btn-save-edit');
    saveBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const errorEl = row.querySelector('.edit-error');
    expect(errorEl.style.display).toBe('');
    expect(errorEl.textContent).toContain('Error al actualizar');
  });
});

describe('Guest Management - deleteGuest()', () => {
  beforeEach(async () => {
    setupDOM();
    jest.clearAllMocks();
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAPI.getAllGuests.mockResolvedValue([
      { id: 'del123', name: 'To Delete', ticketCount: 1, rsvpStatus: 'Pendiente' }
    ]);
    Admin.init();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  test('shows confirmation dialog before deleting', () => {
    global.confirm.mockReturnValue(false);

    const deleteBtn = document.querySelector('.btn-delete[data-id="del123"]');
    deleteBtn.click();

    expect(global.confirm).toHaveBeenCalledWith('¿Estás seguro de que deseas eliminar este invitado?');
    expect(mockAPI.deleteGuest).not.toHaveBeenCalled();
  });

  test('calls API.deleteGuest when confirmed', async () => {
    global.confirm.mockReturnValue(true);
    mockAPI.deleteGuest.mockResolvedValue({ success: true });

    const deleteBtn = document.querySelector('.btn-delete[data-id="del123"]');
    deleteBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockAPI.deleteGuest).toHaveBeenCalledWith('del123');
  });

  test('reloads table after successful delete', async () => {
    global.confirm.mockReturnValue(true);
    mockAPI.deleteGuest.mockResolvedValue({ success: true });
    mockAPI.getAllGuests.mockResolvedValue([]);

    const deleteBtn = document.querySelector('.btn-delete[data-id="del123"]');
    deleteBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const container = document.getElementById('guest-table-container');
    expect(container.textContent).toContain('No hay invitados registrados');
  });

  test('shows error when delete fails', async () => {
    global.confirm.mockReturnValue(true);
    mockAPI.deleteGuest.mockResolvedValue({ error: true, message: 'Error al eliminar invitado' });

    const deleteBtn = document.querySelector('.btn-delete[data-id="del123"]');
    deleteBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const container = document.getElementById('guest-table-container');
    expect(container.textContent).toContain('Error al eliminar invitado');
  });
});

describe('Guest Management - copyLink()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses navigator.clipboard.writeText when available', async () => {
    navigator.clipboard.writeText.mockResolvedValue(undefined);

    await Admin.copyLink('https://nicolasykaren.com/?guest=abc123');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://nicolasykaren.com/?guest=abc123');
  });

  test('falls back to execCommand when clipboard API fails', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('Not allowed'));
    document.execCommand = jest.fn().mockReturnValue(true);

    await Admin.copyLink('https://nicolasykaren.com/?guest=abc123');

    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});

describe('Guest Management - login triggers guest loading', () => {
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
  });

  test('after successful login, guest management shell is rendered', async () => {
    mockAuth.isAuthenticated.mockReturnValue(false);
    mockAuth.authenticate.mockResolvedValue(true);
    mockAPI.getAllGuests.mockResolvedValue([]);
    Admin.init();

    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('admin-login-btn');
    passwordInput.value = 'correctpassword';

    loginBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const form = document.getElementById('create-guest-form');
    expect(form).not.toBeNull();
  });

  test('when already authenticated on init, loads guests immediately', async () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAPI.getAllGuests.mockResolvedValue([]);
    Admin.init();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockAPI.getAllGuests).toHaveBeenCalled();
  });
});
