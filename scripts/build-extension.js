/**
 * Build script for Chrome Extension
 * Copies necessary files to dist folder for extension packaging
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

console.log('🔨 Building Chrome Extension...\n');

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
  'manifest.json',
  'background.js',
  'content.js',
];

console.log('📋 Copying extension files...');
filesToCopy.forEach(file => {
  const src = join(rootDir, file);
  const dest = join(distDir, file);
  
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ⚠ ${file} not found`);
  }
});

// Copy offscreen document files from public/
const offscreenFiles = ['offscreen.html', 'offscreen.js'];
console.log('\n📄 Copying offscreen document files...');
offscreenFiles.forEach(file => {
  const src = join(rootDir, 'public', file);
  const dest = join(distDir, file);
  
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ⚠ ${file} not found in public/`);
  }
});

// Copy assets directory if it exists
const assetsDir = join(rootDir, 'assets');
const distAssetsDir = join(distDir, 'assets');

if (existsSync(assetsDir)) {
  console.log('\n📦 Copying assets...');
  mkdirSync(distAssetsDir, { recursive: true });
  
  function copyRecursive(src, dest) {
    const entries = readdirSync(src);
    
    entries.forEach(entry => {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      
      if (statSync(srcPath).isDirectory()) {
        mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
        console.log(`  ✓ assets/${entry}`);
      }
    });
  }
  
  copyRecursive(assetsDir, distAssetsDir);
}

console.log('\n✅ Extension build complete!');
console.log(`📁 Output directory: ${distDir}`);
console.log('\n📝 Next steps:');
console.log('  1. Open Chrome and navigate to chrome://extensions/');
console.log('  2. Enable "Developer mode"');
console.log('  3. Click "Load unpacked"');
console.log('  4. Select the dist/ folder');
