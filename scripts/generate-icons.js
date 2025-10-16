import fs from 'fs';
import { createCanvas } from 'canvas';

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#1e40af');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add text "ERP"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ERP', size / 2, size / 2);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated ${outputPath}`);
}

// Create public directory if it doesn't exist
const publicDir = './public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
try {
  generateIcon(192, './public/icon-192x192.png');
  generateIcon(512, './public/icon-512x512.png');
  generateIcon(144, './public/icon-144x144.png');
  generateIcon(384, './public/icon-384x384.png');
  console.log('\n✅ All PWA icons generated successfully!');
} catch (error) {
  console.error('❌ Error generating icons:', error.message);
  console.log('\n⚠️  canvas package not installed. Installing...');
  console.log('Run: npm install canvas --save-dev');

  // Create fallback SVG icons instead
  const svgIcon = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">ERP</text>
</svg>`;

  fs.writeFileSync('./public/icon-192x192.svg', svgIcon(192));
  fs.writeFileSync('./public/icon-512x512.svg', svgIcon(512));
  console.log('✅ Generated SVG fallback icons instead');
}
