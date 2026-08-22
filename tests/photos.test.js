/**
 * Unit tests for the Photos Section Module (js/photos.js)
 */

// Set up CONFIG before loading the module
global.CONFIG = {
  photos: [
    { src: 'img/photos/photo1.jpg', alt: 'Karen y Nicolas' },
    { src: 'img/photos/photo2.jpg', alt: 'Karen y Nicolas en el parque' },
    { src: 'img/photos/photo3.jpg', alt: 'Karen y Nicolas - sesión de fotos' }
  ]
};

require('../js/photos.js');

describe('Photos Section Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="photos-section">
        <div id="photos-grid" class="photos-grid"></div>
      </section>
    `;
    // Reset CONFIG photos to default
    CONFIG.photos = [
      { src: 'img/photos/photo1.jpg', alt: 'Karen y Nicolas' },
      { src: 'img/photos/photo2.jpg', alt: 'Karen y Nicolas en el parque' },
      { src: 'img/photos/photo3.jpg', alt: 'Karen y Nicolas - sesión de fotos' }
    ];
  });

  describe('init()', () => {
    test('renders correct number of images from CONFIG.photos', () => {
      window.Photos.init();
      const grid = document.getElementById('photos-grid');
      const images = grid.querySelectorAll('img');
      expect(images.length).toBe(3);
    });

    test('each image has correct src attribute', () => {
      window.Photos.init();
      const images = document.querySelectorAll('#photos-grid img');
      expect(images[0].src).toContain('img/photos/photo1.jpg');
      expect(images[1].src).toContain('img/photos/photo2.jpg');
      expect(images[2].src).toContain('img/photos/photo3.jpg');
    });

    test('each image has correct alt attribute from config', () => {
      window.Photos.init();
      const images = document.querySelectorAll('#photos-grid img');
      expect(images[0].alt).toBe('Karen y Nicolas');
      expect(images[1].alt).toBe('Karen y Nicolas en el parque');
      expect(images[2].alt).toBe('Karen y Nicolas - sesión de fotos');
    });

    test('each image has loading="lazy" attribute', () => {
      window.Photos.init();
      const images = document.querySelectorAll('#photos-grid img');
      images.forEach((img) => {
        expect(img.getAttribute('loading')).toBe('lazy');
      });
    });

    test('each image has class "photo-item"', () => {
      window.Photos.init();
      const images = document.querySelectorAll('#photos-grid img');
      images.forEach((img) => {
        expect(img.className).toBe('photo-item');
      });
    });

    test('hides section when CONFIG.photos is empty array', () => {
      CONFIG.photos = [];
      window.Photos.init();
      const section = document.getElementById('photos-section');
      expect(section.style.display).toBe('none');
    });

    test('hides section when CONFIG.photos is undefined', () => {
      CONFIG.photos = undefined;
      window.Photos.init();
      const section = document.getElementById('photos-section');
      expect(section.style.display).toBe('none');
    });

    test('uses fallback alt text when photo entry has no alt', () => {
      CONFIG.photos = [
        { src: 'img/photos/photo1.jpg' },
        { src: 'img/photos/photo2.jpg', alt: '' }
      ];
      window.Photos.init();
      const images = document.querySelectorAll('#photos-grid img');
      expect(images[0].alt).toBe('Foto de la pareja');
      expect(images[1].alt).toBe('Foto de la pareja');
    });

    test('renders up to 20 images', () => {
      CONFIG.photos = [];
      for (var i = 1; i <= 20; i++) {
        CONFIG.photos.push({ src: 'img/photos/photo' + i + '.jpg', alt: 'Photo ' + i });
      }
      window.Photos.init();
      const images = document.querySelectorAll('#photos-grid img');
      expect(images.length).toBe(20);
    });

    test('renders single image correctly', () => {
      CONFIG.photos = [{ src: 'img/photos/solo.jpg', alt: 'Solo photo' }];
      window.Photos.init();
      const images = document.querySelectorAll('#photos-grid img');
      expect(images.length).toBe(1);
      expect(images[0].alt).toBe('Solo photo');
    });

    test('does nothing if #photos-section is missing from DOM', () => {
      document.body.innerHTML = '';
      expect(() => window.Photos.init()).not.toThrow();
    });

    test('does nothing if #photos-grid is missing from DOM', () => {
      document.body.innerHTML = '<section id="photos-section"></section>';
      expect(() => window.Photos.init()).not.toThrow();
    });

    test('clears existing grid content before rendering', () => {
      const grid = document.getElementById('photos-grid');
      grid.innerHTML = '<p>Old content</p>';
      window.Photos.init();
      const paragraphs = grid.querySelectorAll('p');
      expect(paragraphs.length).toBe(0);
      const images = grid.querySelectorAll('img');
      expect(images.length).toBe(3);
    });
  });
});
