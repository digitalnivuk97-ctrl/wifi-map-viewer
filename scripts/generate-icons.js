#!/usr/bin/env node

/**
 * Icon Generation Helper Script
 * 
 * This script provides instructions for generating platform-specific icons
 * from the source SVG file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '..', 'build');
const svgPath = path.join(buildDir, 'icon.svg');

console.log('WiFi Map Viewer - Icon Generation Helper\n');
console.log('=========================================\n');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error('❌ Error: icon.svg not found in build/ directory');
  process.exit(1);
}

console.log('✅ Found source icon: build/icon.svg\n');

// Check for platform-specific icons
const icons = {
  'icon.ico': 'Windows',
  'icon.icns': 'macOS',
  'icon.png': 'Linux'
};

let missingIcons = [];

console.log('Checking for platform-specific icons:\n');

for (const [filename, platform] of Object.entries(icons)) {
  const iconPath = path.join(buildDir, filename);
  if (fs.existsSync(iconPath)) {
    console.log(`✅ ${platform}: build/${filename} exists`);
  } else {
    console.log(`❌ ${platform}: build/${filename} missing`);
    missingIcons.push({ filename, platform });
  }
}

if (missingIcons.length === 0) {
  console.log('\n✅ All platform icons are present!');
  console.log('You can now build the application with: npm run build');
  process.exit(0);
}

console.log('\n⚠️  Missing icons detected!\n');
console.log('The application will build with default system icons.');
console.log('For production releases, create platform-specific icons:\n');

// Provide instructions for missing icons
for (const { filename, platform } of missingIcons) {
  console.log(`${platform} (${filename}):`);
  
  if (filename === 'icon.ico') {
    console.log('  Using ImageMagick:');
    console.log('    magick convert -density 256x256 -background transparent build/icon.svg -define icon:auto-resize -colors 256 build/icon.ico\n');
    console.log('  Or use an online converter:');
    console.log('    https://cloudconvert.com/svg-to-ico\n');
  } else if (filename === 'icon.icns') {
    console.log('  On macOS with Inkscape and iconutil:');
    console.log('    1. Generate PNGs at multiple sizes');
    console.log('    2. Create iconset directory structure');
    console.log('    3. Run: iconutil -c icns icon.iconset\n');
    console.log('  Or use an online converter:');
    console.log('    https://cloudconvert.com/svg-to-icns\n');
  } else if (filename === 'icon.png') {
    console.log('  Using ImageMagick:');
    console.log('    magick convert -density 512x512 -background transparent build/icon.svg build/icon.png\n');
    console.log('  Using Inkscape:');
    console.log('    inkscape -w 512 -h 512 build/icon.svg -o build/icon.png\n');
    console.log('  Or use an online converter:');
    console.log('    https://cloudconvert.com/svg-to-png\n');
  }
}

console.log('For detailed instructions, see: build/README.md\n');
console.log('To build without custom icons (using defaults):');
console.log('  npm run build\n');
