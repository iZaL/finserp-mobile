import sharp from 'sharp';
import path from 'path';

const publicDir = path.join(__dirname, '..', 'public');

// Define icon sizes
const appleTouchIconSizes = [180, 152, 120, 76];
const manifestIconSizes = [192, 512, 384, 144];

// SVG template with gradient
const generateSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad-${size})"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.3)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">ERP</text>
</svg>
`;

async function generatePNGFromSVG(size, filename) {
  const svgBuffer = Buffer.from(generateSVG(size));
  const outputPath = path.join(publicDir, filename);

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`✓ Generated ${filename}`);
}

async function generateAllIcons() {
  console.log('Generating PNG icons...\n');

  // Generate Apple Touch Icons
  console.log('Apple Touch Icons:');
  for (const size of appleTouchIconSizes) {
    await generatePNGFromSVG(size, `apple-touch-icon-${size}x${size}.png`);
  }

  // Also generate the default apple-touch-icon.png (180x180)
  await generatePNGFromSVG(180, 'apple-touch-icon.png');

  console.log('\nManifest Icons:');
  // Generate manifest icons
  for (const size of manifestIconSizes) {
    await generatePNGFromSVG(size, `icon-${size}x${size}.png`);
  }

  console.log('\n✓ All icons generated successfully!');
}

generateAllIcons().catch(console.error);
