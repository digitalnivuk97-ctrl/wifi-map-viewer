#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '..', 'electron', 'preload.cjs');
const dest = path.join(__dirname, '..', 'dist-electron', 'preload.cjs');

// Ensure dist-electron directory exists
const distDir = path.dirname(dest);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the file
fs.copyFileSync(source, dest);
console.log('✓ Copied preload.cjs to dist-electron/');
