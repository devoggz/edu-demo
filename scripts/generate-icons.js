#!/usr/bin/env node
// Script to generate simple placeholder PNG icons
// Run: node scripts/generate-icons.js
// In production, replace with proper branded icons

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG-based placeholder icons
sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#2563eb"/>
  <text x="${size/2}" y="${size * 0.65}" font-family="Arial" font-weight="bold" 
    font-size="${size * 0.35}" fill="white" text-anchor="middle">E</text>
</svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

console.log('Icons generated! Replace with proper PNG icons for production.');
