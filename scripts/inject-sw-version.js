const fs = require('fs');
const path = require('path');

// Generate cache version from current timestamp
const cacheVersion = Date.now().toString();

// Read the service worker file
const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace the placeholder with actual version
swContent = swContent.replace(/__CACHE_VERSION__/g, cacheVersion);

// Write back to the same file
fs.writeFileSync(swPath, swContent, 'utf8');

console.log(`✅ Service Worker cache version injected: ${cacheVersion}`);
