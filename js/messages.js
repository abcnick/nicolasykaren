/**
 * Messages Section Module
 * Renders configurable message blocks from CONFIG.messages.
 * Hides the section entirely if no messages are configured.
 * 
 * @module Messages
 * @requires CONFIG (global)
 */
const Messages = (function () {

  /**
   * Initialize the messages section.
   * - If CONFIG.messages is undefined, null, or empty → hide #messages-section
   * - Otherwise, render each message block in order into #messages-container
   */
  function init() {
    const section = document.getElementById('messages-section');
    const container = document.getElementById('messages-container');

    if (!section || !container) {
      return;
    }

    const messages = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.messages) ? CONFIG.messages : null;

    // Hide section if no messages configured
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      section.style.display = 'none';
      return;
    }

    // Render each message block in order
    messages.forEach(function (msg) {
      // Skip blocks where both heading and body are missing
      if (!msg || (!msg.heading && !msg.body)) {
        return;
      }

      var block = document.createElement('div');
      block.className = 'message-block';

      // Add heading if present
      if (msg.heading) {
        var h3 = document.createElement('h3');
        h3.className = 'message-heading';
        h3.textContent = msg.heading;
        block.appendChild(h3);
      }

      // Add body if present
      if (msg.body) {
        var p = document.createElement('p');
        p.className = 'message-body';
        p.textContent = msg.body;
        block.appendChild(p);
      }

      container.appendChild(block);
    });
  }

  return { init: init };
})();

// Expose as global
window.Messages = Messages;
