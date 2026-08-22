// Feature: wedding-invitation-site, Property 11: Messages Section Order Preservation

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Property 11: Messages Section Order Preservation
 * For any array of message blocks, the rendered output SHALL display them in the
 * same order as defined in the input array, with each block containing its heading
 * and body text.
 *
 * **Validates: Requirements 9.1**
 */
describe('Property 11: Messages Section Order Preservation', () => {

  beforeEach(() => {
    // Set up DOM with required elements
    document.body.innerHTML = `
      <section id="messages-section">
        <div id="messages-container"></div>
      </section>
    `;

    // Clean up globals
    delete global.CONFIG;
    delete global.Messages;
    delete window.Messages;
  });

  function loadModule() {
    const code = fs.readFileSync(path.resolve(__dirname, '../js/messages.js'), 'utf8');
    eval(code);
  }

  // Generator for a non-empty message object with both heading and body
  const messageArb = fc.record({
    heading: fc.string({ minLength: 1, maxLength: 100 }),
    body: fc.string({ minLength: 1, maxLength: 300 })
  });

  // Generator for an array of 1-10 message objects
  const messagesArrayArb = fc.array(messageArb, { minLength: 1, maxLength: 10 });

  it('rendered message blocks appear in the same order as the input array', () => {
    fc.assert(
      fc.property(
        messagesArrayArb,
        (messages) => {
          // Reset DOM
          document.body.innerHTML = `
            <section id="messages-section">
              <div id="messages-container"></div>
            </section>
          `;

          // Set config with generated messages
          global.CONFIG = { messages: messages };

          // Load and init module
          loadModule();
          Messages.init();

          const container = document.getElementById('messages-container');
          const blocks = container.querySelectorAll('.message-block');

          // The number of rendered blocks should match input length
          expect(blocks.length).toBe(messages.length);

          // Verify order: each rendered block matches the corresponding input
          for (let i = 0; i < messages.length; i++) {
            const heading = blocks[i].querySelector('.message-heading');
            const body = blocks[i].querySelector('.message-body');

            expect(heading).not.toBeNull();
            expect(body).not.toBeNull();
            expect(heading.textContent).toBe(messages[i].heading);
            expect(body.textContent).toBe(messages[i].body);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each block has the correct heading text matching its position in the input', () => {
    fc.assert(
      fc.property(
        messagesArrayArb,
        (messages) => {
          // Reset DOM
          document.body.innerHTML = `
            <section id="messages-section">
              <div id="messages-container"></div>
            </section>
          `;

          global.CONFIG = { messages: messages };
          loadModule();
          Messages.init();

          const headings = document.querySelectorAll('.message-heading');

          expect(headings.length).toBe(messages.length);

          // Headings appear in exact input order
          for (let i = 0; i < messages.length; i++) {
            expect(headings[i].textContent).toBe(messages[i].heading);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each block has the correct body text matching its position in the input', () => {
    fc.assert(
      fc.property(
        messagesArrayArb,
        (messages) => {
          // Reset DOM
          document.body.innerHTML = `
            <section id="messages-section">
              <div id="messages-container"></div>
            </section>
          `;

          global.CONFIG = { messages: messages };
          loadModule();
          Messages.init();

          const bodies = document.querySelectorAll('.message-body');

          expect(bodies.length).toBe(messages.length);

          // Bodies appear in exact input order
          for (let i = 0; i < messages.length; i++) {
            expect(bodies[i].textContent).toBe(messages[i].body);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('messages with special characters and unicode preserve order and content', () => {
    // Generator with more diverse content including unicode and special chars
    const unicodeMessageArb = fc.record({
      heading: fc.unicodeString({ minLength: 1, maxLength: 80 }),
      body: fc.unicodeString({ minLength: 1, maxLength: 200 })
    });

    const unicodeMessagesArb = fc.array(unicodeMessageArb, { minLength: 1, maxLength: 10 });

    fc.assert(
      fc.property(
        unicodeMessagesArb,
        (messages) => {
          // Reset DOM
          document.body.innerHTML = `
            <section id="messages-section">
              <div id="messages-container"></div>
            </section>
          `;

          global.CONFIG = { messages: messages };
          loadModule();
          Messages.init();

          const container = document.getElementById('messages-container');
          const blocks = container.querySelectorAll('.message-block');

          expect(blocks.length).toBe(messages.length);

          for (let i = 0; i < messages.length; i++) {
            const heading = blocks[i].querySelector('.message-heading');
            const body = blocks[i].querySelector('.message-body');

            expect(heading).not.toBeNull();
            expect(body).not.toBeNull();
            expect(heading.textContent).toBe(messages[i].heading);
            expect(body.textContent).toBe(messages[i].body);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
