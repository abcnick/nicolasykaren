/**
 * Unit tests for the Gift module (js/gift.js)
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4
 */

describe('Gift Section (Lluvia de Sobres Digital)', () => {
  let section, headingEl, messageEl, bankDetailsEl, bankNameEl, accountHolderEl, accountNumberEl, paymentLinkEl, instructionsEl;

  beforeEach(() => {
    // Set up DOM matching expected structure
    document.body.innerHTML = `
      <section id="gift-section">
        <h2 id="gift-heading"></h2>
        <p id="gift-message"></p>
        <div id="gift-bank-details">
          <span id="gift-bank-name"></span>
          <span id="gift-account-holder"></span>
          <span id="gift-account-number"></span>
        </div>
        <a id="gift-payment-link" href="#">Enlace de pago</a>
        <p id="gift-instructions"></p>
      </section>
    `;

    section = document.getElementById('gift-section');
    headingEl = document.getElementById('gift-heading');
    messageEl = document.getElementById('gift-message');
    bankDetailsEl = document.getElementById('gift-bank-details');
    bankNameEl = document.getElementById('gift-bank-name');
    accountHolderEl = document.getElementById('gift-account-holder');
    accountNumberEl = document.getElementById('gift-account-number');
    paymentLinkEl = document.getElementById('gift-payment-link');
    instructionsEl = document.getElementById('gift-instructions');

    // Clean up globals
    delete global.CONFIG;
    delete global.Gift;
    delete window.Gift;
  });

  function loadModule() {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.resolve(__dirname, '../js/gift.js'), 'utf8');
    eval(code);
  }

  describe('init() - hiding section when no gift configured', () => {
    test('hides section when CONFIG.gift is undefined', () => {
      global.CONFIG = { gift: undefined };
      loadModule();
      Gift.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG.gift is null', () => {
      global.CONFIG = { gift: null };
      loadModule();
      Gift.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG is undefined', () => {
      // CONFIG not defined at all
      loadModule();
      Gift.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG has no gift property', () => {
      global.CONFIG = {};
      loadModule();
      Gift.init();
      expect(section.style.display).toBe('none');
    });
  });

  describe('init() - rendering heading and message (Req 11.1)', () => {
    test('displays heading text from config', () => {
      global.CONFIG = {
        gift: {
          heading: 'Lluvia de Sobres Digital',
          message: 'Tu presencia es nuestro mejor regalo.'
        }
      };
      loadModule();
      Gift.init();
      expect(headingEl.textContent).toBe('Lluvia de Sobres Digital');
    });

    test('displays message text from config', () => {
      global.CONFIG = {
        gift: {
          heading: 'Gift',
          message: 'Your presence is our greatest gift.'
        }
      };
      loadModule();
      Gift.init();
      expect(messageEl.textContent).toBe('Your presence is our greatest gift.');
    });

    test('does not hide section when gift is configured', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Hello' }
      };
      loadModule();
      Gift.init();
      expect(section.style.display).not.toBe('none');
    });
  });

  describe('init() - bank details (Req 11.2)', () => {
    test('shows bank details when all fields are provided', () => {
      global.CONFIG = {
        gift: {
          heading: 'Gift',
          message: 'Message',
          bankDetails: {
            bankName: 'Banco Nacional',
            accountHolder: 'Karen & Nicolas',
            accountNumber: '1234-5678-9012'
          }
        }
      };
      loadModule();
      Gift.init();

      expect(bankDetailsEl.style.display).not.toBe('none');
      expect(bankNameEl.textContent).toBe('Banco Nacional');
      expect(accountHolderEl.textContent).toBe('Karen & Nicolas');
      expect(accountNumberEl.textContent).toBe('1234-5678-9012');
    });

    test('hides bank details when bankDetails is missing', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message' }
      };
      loadModule();
      Gift.init();
      expect(bankDetailsEl.style.display).toBe('none');
    });

    test('hides bank details when bankDetails is null', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message', bankDetails: null }
      };
      loadModule();
      Gift.init();
      expect(bankDetailsEl.style.display).toBe('none');
    });

    test('hides bank details when bankName is empty', () => {
      global.CONFIG = {
        gift: {
          heading: 'Gift',
          message: 'Message',
          bankDetails: {
            bankName: '',
            accountHolder: 'Karen & Nicolas',
            accountNumber: '1234-5678-9012'
          }
        }
      };
      loadModule();
      Gift.init();
      expect(bankDetailsEl.style.display).toBe('none');
    });

    test('hides bank details when accountHolder is empty', () => {
      global.CONFIG = {
        gift: {
          heading: 'Gift',
          message: 'Message',
          bankDetails: {
            bankName: 'Banco',
            accountHolder: '',
            accountNumber: '1234-5678-9012'
          }
        }
      };
      loadModule();
      Gift.init();
      expect(bankDetailsEl.style.display).toBe('none');
    });

    test('hides bank details when accountNumber is empty', () => {
      global.CONFIG = {
        gift: {
          heading: 'Gift',
          message: 'Message',
          bankDetails: {
            bankName: 'Banco',
            accountHolder: 'Karen & Nicolas',
            accountNumber: ''
          }
        }
      };
      loadModule();
      Gift.init();
      expect(bankDetailsEl.style.display).toBe('none');
    });
  });

  describe('init() - payment link (Req 11.3)', () => {
    test('shows payment link with correct href, target, and rel', () => {
      global.CONFIG = {
        gift: {
          heading: 'Gift',
          message: 'Message',
          paymentLink: 'https://payment-provider.com/link'
        }
      };
      loadModule();
      Gift.init();

      expect(paymentLinkEl.style.display).not.toBe('none');
      expect(paymentLinkEl.href).toBe('https://payment-provider.com/link');
      expect(paymentLinkEl.target).toBe('_blank');
      expect(paymentLinkEl.rel).toBe('noopener noreferrer');
    });

    test('hides payment link when paymentLink is not configured', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message' }
      };
      loadModule();
      Gift.init();
      expect(paymentLinkEl.style.display).toBe('none');
    });

    test('hides payment link when paymentLink is empty string', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message', paymentLink: '' }
      };
      loadModule();
      Gift.init();
      expect(paymentLinkEl.style.display).toBe('none');
    });

    test('hides payment link when paymentLink is null', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message', paymentLink: null }
      };
      loadModule();
      Gift.init();
      expect(paymentLinkEl.style.display).toBe('none');
    });
  });

  describe('init() - instruction text (Req 11.4)', () => {
    test('always displays instruction text when gift is configured', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message' }
      };
      loadModule();
      Gift.init();
      expect(instructionsEl.textContent).toBe(
        'Puedes enviar tu regalo a través de transferencia bancaria o por el enlace de pago.'
      );
    });

    test('shows instruction text even without bank details or payment link', () => {
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message' }
      };
      loadModule();
      Gift.init();
      expect(instructionsEl.textContent).toContain('transferencia bancaria');
      expect(instructionsEl.textContent).toContain('enlace de pago');
    });
  });

  describe('init() - full configuration', () => {
    test('renders all elements with complete config', () => {
      global.CONFIG = {
        gift: {
          heading: 'Lluvia de Sobres Digital',
          message: 'Tu presencia es nuestro mejor regalo.',
          bankDetails: {
            bankName: 'Banco Nacional',
            accountHolder: 'Karen & Nicolas',
            accountNumber: 'XXXX-XXXX-XXXX'
          },
          paymentLink: 'https://payment-provider.com/link'
        }
      };
      loadModule();
      Gift.init();

      expect(section.style.display).not.toBe('none');
      expect(headingEl.textContent).toBe('Lluvia de Sobres Digital');
      expect(messageEl.textContent).toBe('Tu presencia es nuestro mejor regalo.');
      expect(bankDetailsEl.style.display).not.toBe('none');
      expect(bankNameEl.textContent).toBe('Banco Nacional');
      expect(accountHolderEl.textContent).toBe('Karen & Nicolas');
      expect(accountNumberEl.textContent).toBe('XXXX-XXXX-XXXX');
      expect(paymentLinkEl.href).toBe('https://payment-provider.com/link');
      expect(paymentLinkEl.target).toBe('_blank');
      expect(paymentLinkEl.rel).toBe('noopener noreferrer');
      expect(instructionsEl.textContent).toBe(
        'Puedes enviar tu regalo a través de transferencia bancaria o por el enlace de pago.'
      );
    });
  });

  describe('init() - missing DOM elements', () => {
    test('does nothing if #gift-section is missing', () => {
      document.body.innerHTML = '';
      global.CONFIG = {
        gift: { heading: 'Gift', message: 'Message' }
      };
      loadModule();
      expect(() => Gift.init()).not.toThrow();
    });

    test('handles missing child elements gracefully', () => {
      document.body.innerHTML = '<section id="gift-section"></section>';
      global.CONFIG = {
        gift: {
          heading: 'Gift',
          message: 'Message',
          bankDetails: {
            bankName: 'Banco',
            accountHolder: 'Holder',
            accountNumber: '123'
          },
          paymentLink: 'https://example.com'
        }
      };
      loadModule();
      expect(() => Gift.init()).not.toThrow();
    });
  });
});
