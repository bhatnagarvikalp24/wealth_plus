#!/usr/bin/env node

/**
 * Generate PNG icons from SVG sources for PWA
 * Uses sharp to convert SVG to PNG at required dimensions
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const icons = [
  { input: 'icon-192.svg', output: 'icon-192.png', size: 192 },
  { input: 'icon-512.svg', output: 'icon-512.png', size: 512 },
  { input: 'icon-512.svg', output: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('Generating PNG icons from SVG sources...\n');

  for (const icon of icons) {
    const inputPath = path.join(PUBLIC_DIR, icon.input);
    const outputPath = path.join(PUBLIC_DIR, icon.output);

    // Read SVG as text
    const svgBuffer = fs.readFileSync(inputPath);

    // Convert to PNG using sharp
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);

    // Get metadata to verify
    const metadata = await sharp(outputPath).metadata();

    console.log(`Created: ${icon.output}`);
    console.log(`  Size: ${metadata.width}x${metadata.height}`);
    console.log(`  Format: ${metadata.format}`);
    console.log('');
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
