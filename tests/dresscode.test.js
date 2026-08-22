/**
 * Unit tests for the DressCode module (js/dresscode.js)
 * Validates: Requirements 10.1, 10.2, 10.3
 */

describe('DressCode Section', () => {
  let section, textEl, colorsContainer;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <section id="dresscode-section">
        <p id="dresscode-text"></p>
        <div id="dresscode-colors"></div>
      </section>
    `;
    section = document.getElementById('dresscode-section');
    textEl = document.getElementById('dresscode-text');
    colorsContainer = document.getElementById('dresscode-colors');

    // Clean up any previous globals
    delete global.CONFIG;
    delete global.DressCode;
    delete window.DressCode;
  });

  function loadModule() {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.resolve(__dirname, '../js/dresscode.js'), 'utf8');
    eval(code);
  }

  describe('init() - hiding section when no dress code configured', () => {
    test('hides section when CONFIG.dressCode is undefined', () => {
      global.CONFIG = { dressCode: undefined };
      loadModule();
      DressCode.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG.dressCode is null', () => {
      global.CONFIG = { dressCode: null };
      loadModule();
      DressCode.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG is undefined', () => {
      // CONFIG not defined at all
      loadModule();
      DressCode.init();
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG has no dressCode property', () => {
      global.CONFIG = {};
      loadModule();
      DressCode.init();
      expect(section.style.display).toBe('none');
    });
  });

  describe('init() - displaying attire guidelines text', () => {
    test('displays attire guidelines text from config', () => {
      global.CONFIG = {
        dressCode: { text: 'Formal / Black Tie Optional', colors: [] }
      };
      loadModule();
      DressCode.init();
      expect(textEl.textContent).toBe('Formal / Black Tie Optional');
    });

    test('does not hide section when dress code is configured', () => {
      global.CONFIG = {
        dressCode: { text: 'Casual', colors: [] }
      };
      loadModule();
      DressCode.init();
      expect(section.style.display).not.toBe('none');
    });

    test('handles dress code with text but no colors array', () => {
      global.CONFIG = {
        dressCode: { text: 'Semi-formal' }
      };
      loadModule();
      DressCode.init();
      expect(textEl.textContent).toBe('Semi-formal');
      expect(colorsContainer.children.length).toBe(0);
    });
  });

  describe('init() - rendering color swatches', () => {
    test('renders color swatches with colored squares and name labels', () => {
      global.CONFIG = {
        dressCode: {
          text: 'Formal',
          colors: [
            { hex: '#2C3E50', name: 'Navy' },
            { hex: '#8E44AD', name: 'Purple' }
          ]
        }
      };
      loadModule();
      DressCode.init();

      const swatches = colorsContainer.querySelectorAll('.color-swatch');
      expect(swatches.length).toBe(2);

      // First swatch
      const square1 = swatches[0].querySelector('.swatch-square');
      const name1 = swatches[0].querySelector('.swatch-name');
      expect(square1.style.backgroundColor).toBe('rgb(44, 62, 80)');
      expect(name1.textContent).toBe('Navy');

      // Second swatch
      const square2 = swatches[1].querySelector('.swatch-square');
      const name2 = swatches[1].querySelector('.swatch-name');
      expect(square2.style.backgroundColor).toBe('rgb(142, 68, 173)');
      expect(name2.textContent).toBe('Purple');
    });

    test('limits color swatches to 6 maximum', () => {
      global.CONFIG = {
        dressCode: {
          text: 'Formal',
          colors: [
            { hex: '#111111', name: 'Color 1' },
            { hex: '#222222', name: 'Color 2' },
            { hex: '#333333', name: 'Color 3' },
            { hex: '#444444', name: 'Color 4' },
            { hex: '#555555', name: 'Color 5' },
            { hex: '#666666', name: 'Color 6' },
            { hex: '#777777', name: 'Color 7' },
            { hex: '#888888', name: 'Color 8' }
          ]
        }
      };
      loadModule();
      DressCode.init();

      const swatches = colorsContainer.querySelectorAll('.color-swatch');
      expect(swatches.length).toBe(6);
    });

    test('renders exactly 6 swatches when 6 colors configured', () => {
      global.CONFIG = {
        dressCode: {
          text: 'Formal',
          colors: [
            { hex: '#111111', name: 'One' },
            { hex: '#222222', name: 'Two' },
            { hex: '#333333', name: 'Three' },
            { hex: '#444444', name: 'Four' },
            { hex: '#555555', name: 'Five' },
            { hex: '#666666', name: 'Six' }
          ]
        }
      };
      loadModule();
      DressCode.init();

      const swatches = colorsContainer.querySelectorAll('.color-swatch');
      expect(swatches.length).toBe(6);
    });

    test('shows text without swatches when colors array is empty', () => {
      global.CONFIG = {
        dressCode: { text: 'Cocktail Attire', colors: [] }
      };
      loadModule();
      DressCode.init();

      expect(textEl.textContent).toBe('Cocktail Attire');
      expect(colorsContainer.querySelectorAll('.color-swatch').length).toBe(0);
    });

    test('skips colors with missing hex value', () => {
      global.CONFIG = {
        dressCode: {
          text: 'Formal',
          colors: [
            { hex: '#2C3E50', name: 'Navy' },
            { name: 'No Hex' },
            { hex: '#8E44AD', name: 'Purple' }
          ]
        }
      };
      loadModule();
      DressCode.init();

      const swatches = colorsContainer.querySelectorAll('.color-swatch');
      expect(swatches.length).toBe(2);
      expect(swatches[0].querySelector('.swatch-name').textContent).toBe('Navy');
      expect(swatches[1].querySelector('.swatch-name').textContent).toBe('Purple');
    });

    test('handles color with hex but no name', () => {
      global.CONFIG = {
        dressCode: {
          text: 'Formal',
          colors: [{ hex: '#FF0000' }]
        }
      };
      loadModule();
      DressCode.init();

      const swatches = colorsContainer.querySelectorAll('.color-swatch');
      expect(swatches.length).toBe(1);
      expect(swatches[0].querySelector('.swatch-name').textContent).toBe('');
    });

    test('skips null entries in colors array', () => {
      global.CONFIG = {
        dressCode: {
          text: 'Formal',
          colors: [
            null,
            { hex: '#2C3E50', name: 'Navy' }
          ]
        }
      };
      loadModule();
      DressCode.init();

      const swatches = colorsContainer.querySelectorAll('.color-swatch');
      expect(swatches.length).toBe(1);
      expect(swatches[0].querySelector('.swatch-name').textContent).toBe('Navy');
    });
  });

  describe('init() - missing DOM elements', () => {
    test('does nothing if #dresscode-section is missing', () => {
      document.body.innerHTML = '';
      global.CONFIG = {
        dressCode: { text: 'Formal', colors: [{ hex: '#000', name: 'Black' }] }
      };
      loadModule();
      expect(() => DressCode.init()).not.toThrow();
    });

    test('still hides section if #dresscode-text is missing', () => {
      document.body.innerHTML = `
        <section id="dresscode-section">
          <div id="dresscode-colors"></div>
        </section>
      `;
      global.CONFIG = { dressCode: null };
      loadModule();
      DressCode.init();
      expect(document.getElementById('dresscode-section').style.display).toBe('none');
    });

    test('renders swatches even if #dresscode-text is missing', () => {
      document.body.innerHTML = `
        <section id="dresscode-section">
          <div id="dresscode-colors"></div>
        </section>
      `;
      global.CONFIG = {
        dressCode: { text: 'Formal', colors: [{ hex: '#123456', name: 'Test' }] }
      };
      loadModule();
      DressCode.init();
      const swatches = document.getElementById('dresscode-colors').querySelectorAll('.color-swatch');
      expect(swatches.length).toBe(1);
    });
  });
});
