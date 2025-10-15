const fs = require('fs');

function generateSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad-${size})"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.3)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">ERP</text>
</svg>`;
}

// Create public directory if it doesn't exist
const publicDir = './public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG icons (browsers support SVG for PWA icons)
const sizes = [144, 192, 384, 512];

sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  const filename = `./public/icon-${size}x${size}.svg`;
  fs.writeFileSync(filename, svg);
  console.log(`✓ Generated ${filename}`);
});

console.log('\n✅ All PWA SVG icons generated successfully!');
console.log('\n📝 Note: For better compatibility, consider converting these to PNG using an image editor or online tool.');
console.log('   SVGs work in modern browsers, but PNGs have wider support.');
