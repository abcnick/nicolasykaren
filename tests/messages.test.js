/**
 * Unit tests for the Messages module (js/messages.js)
 * Validates: Requirements 9.1, 9.2, 9.3
 */

describe('Messages Section', () => {
  let section, container;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <section id="messages-section">
        <div id="messages-container"></div>
      </section>
    `;
    section = document.getElementById('messages-section');
    container = document.getElementById('messages-container');

    // Clean up any previous CONFIG and Messages globals
    delete global.CONFIG;
    delete global.Messages;
    delete window.Messages;
  });

  function loadModule() {
    // Re-evaluate the module in the current global context
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.resolve(__dirname, '../js/messages.js'), 'utf8');
    eval(code);
  }

  describe('init() - hiding section when no messages', () => {
    test('hides section when CONFIG.messages is undefined', () => {
      global.CONFIG = { messages: undefined };
      loadModule();
      Messages.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG.messages is null', () => {
      global.CONFIG = { messages: null };
      loadModule();
      Messages.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG.messages is an empty array', () => {
      global.CONFIG = { messages: [] };
      loadModule();
      Messages.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG is undefined', () => {
      // CONFIG not defined at all
      loadModule();
      Messages.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG.messages is not an array', () => {
      global.CONFIG = { messages: 'not an array' };
      loadModule();
      Messages.init();
      expect(section.style.display).toBe('none');
    });
  });

  describe('init() - rendering message blocks', () => {
    test('renders message blocks in order with heading and body', () => {
      global.CONFIG = {
        messages: [
          { heading: 'Title 1', body: 'Body 1' },
          { heading: 'Title 2', body: 'Body 2' }
        ]
      };
      loadModule();
      Messages.init();

      const blocks = container.querySelectorAll('.message-block');
      expect(blocks.length).toBe(2);

      // First block
      expect(blocks[0].querySelector('.message-heading').textContent).toBe('Title 1');
      expect(blocks[0].querySelector('.message-body').textContent).toBe('Body 1');

      // Second block
      expect(blocks[1].querySelector('.message-heading').textContent).toBe('Title 2');
      expect(blocks[1].querySelector('.message-body').textContent).toBe('Body 2');
    });

    test('preserves order from config array', () => {
      global.CONFIG = {
        messages: [
          { heading: 'First', body: 'A' },
          { heading: 'Second', body: 'B' },
          { heading: 'Third', body: 'C' }
        ]
      };
      loadModule();
      Messages.init();

      const headings = container.querySelectorAll('.message-heading');
      expect(headings[0].textContent).toBe('First');
      expect(headings[1].textContent).toBe('Second');
      expect(headings[2].textContent).toBe('Third');
    });

    test('does not hide section when messages are present', () => {
      global.CONFIG = {
        messages: [{ heading: 'Hello', body: 'World' }]
      };
      loadModule();
      Messages.init();
      expect(section.style.display).not.toBe('none');
    });
  });

  describe('init() - edge cases for individual messages', () => {
    test('skips h3 when heading is missing', () => {
      global.CONFIG = {
        messages: [{ body: 'Only body content' }]
      };
      loadModule();
      Messages.init();

      const blocks = container.querySelectorAll('.message-block');
      expect(blocks.length).toBe(1);
      expect(blocks[0].querySelector('.message-heading')).toBeNull();
      expect(blocks[0].querySelector('.message-body').textContent).toBe('Only body content');
    });

    test('skips p when body is missing', () => {
      global.CONFIG = {
        messages: [{ heading: 'Only heading' }]
      };
      loadModule();
      Messages.init();

      const blocks = container.querySelectorAll('.message-block');
      expect(blocks.length).toBe(1);
      expect(blocks[0].querySelector('.message-heading').textContent).toBe('Only heading');
      expect(blocks[0].querySelector('.message-body')).toBeNull();
    });

    test('skips entire block when both heading and body are missing', () => {
      global.CONFIG = {
        messages: [
          { heading: 'Valid', body: 'Content' },
          {},
          { heading: 'Also Valid', body: 'More content' }
        ]
      };
      loadModule();
      Messages.init();

      const blocks = container.querySelectorAll('.message-block');
      expect(blocks.length).toBe(2);
      expect(blocks[0].querySelector('.message-heading').textContent).toBe('Valid');
      expect(blocks[1].querySelector('.message-heading').textContent).toBe('Also Valid');
    });

    test('skips null entries in messages array', () => {
      global.CONFIG = {
        messages: [
          null,
          { heading: 'Valid', body: 'Content' }
        ]
      };
      loadModule();
      Messages.init();

      const blocks = container.querySelectorAll('.message-block');
      expect(blocks.length).toBe(1);
    });

    test('skips block with empty string heading and empty string body', () => {
      global.CONFIG = {
        messages: [{ heading: '', body: '' }]
      };
      loadModule();
      Messages.init();

      const blocks = container.querySelectorAll('.message-block');
      expect(blocks.length).toBe(0);
    });
  });

  describe('init() - missing DOM elements', () => {
    test('does nothing if #messages-section is missing', () => {
      document.body.innerHTML = '';
      global.CONFIG = {
        messages: [{ heading: 'Test', body: 'Test' }]
      };
      loadModule();
      // Should not throw
      expect(() => Messages.init()).not.toThrow();
    });

    test('does nothing if #messages-container is missing', () => {
      document.body.innerHTML = '<section id="messages-section"></section>';
      global.CONFIG = {
        messages: [{ heading: 'Test', body: 'Test' }]
      };
      loadModule();
      expect(() => Messages.init()).not.toThrow();
    });
  });
});
