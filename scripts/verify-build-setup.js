#!/usr/bin/env node

/**
 * Build Setup Verification Script
 * 
 * This script verifies that the build configuration is correct
 * and all necessary files are in place.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('WiFi Map Viewer - Build Setup Verification\n');
console.log('==========================================\n');

let errors = 0;
let warnings = 0;

// Check package.json
console.log('Checking package.json...');
const packageJsonPath = path.join(rootDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  errors++;
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check build configuration
  if (!packageJson.build) {
    console.error('❌ Missing build configuration in package.json');
    errors++;
  } else {
    console.log('✅ Build configuration found');
    
    // Check required build fields
    const requiredFields = ['appId', 'productName', 'directories'];
    for (const field of requiredFields) {
      if (!packageJson.build[field]) {
        console.error(`❌ Missing build.${field} in package.json`);
        errors++;
      }
    }
    
    // Check platform configurations
    const platforms = ['win', 'mac', 'linux'];
    for (const platform of platforms) {
      if (!packageJson.build[platform]) {
        console.warn(`⚠️  Missing build.${platform} configuration`);
        warnings++;
      } else {
        console.log(`✅ ${platform} configuration found`);
      }
    }
  }
  
  // Check build scripts
  const requiredScripts = ['build', 'build:win', 'build:mac', 'build:linux', 'package'];
  for (const script of requiredScripts) {
    if (!packageJson.scripts[script]) {
      console.error(`❌ Missing script: ${script}`);
      errors++;
    }
  }
  console.log('✅ All required build scripts found');
  
  // Check dependencies
  const requiredDevDeps = ['electron', 'electron-builder', 'vite', 'typescript'];
  for (const dep of requiredDevDeps) {
    if (!packageJson.devDependencies[dep]) {
      console.error(`❌ Missing devDependency: ${dep}`);
      errors++;
    }
  }
  console.log('✅ All required dependencies found');
}

// Check build directory
console.log('\nChecking build directory...');
const buildDir = path.join(rootDir, 'build');
if (!fs.existsSync(buildDir)) {
  console.error('❌ build/ directory not found');
  errors++;
} else {
  console.log('✅ build/ directory exists');
  
  // Check for icon.svg
  const svgPath = path.join(buildDir, 'icon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('❌ build/icon.svg not found');
    errors++;
  } else {
    console.log('✅ build/icon.svg exists');
  }
  
  // Check for README
  const readmePath = path.join(buildDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.warn('⚠️  build/README.md not found');
    warnings++;
  } else {
    console.log('✅ build/README.md exists');
  }
  
  // Check for platform-specific icons (optional)
  const icons = {
    'icon.ico': 'Windows',
    'icon.icns': 'macOS',
    'icon.png': 'Linux'
  };
  
  for (const [filename, platform] of Object.entries(icons)) {
    const iconPath = path.join(buildDir, filename);
    if (!fs.existsSync(iconPath)) {
      console.warn(`⚠️  ${platform} icon (${filename}) not found - will use default`);
      warnings++;
    } else {
      console.log(`✅ ${platform} icon exists`);
    }
  }
}

// Check vite.config.ts
console.log('\nChecking vite.config.ts...');
const viteConfigPath = path.join(rootDir, 'vite.config.ts');
if (!fs.existsSync(viteConfigPath)) {
  console.error('❌ vite.config.ts not found');
  errors++;
} else {
  console.log('✅ vite.config.ts exists');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (!viteConfig.includes('vite-plugin-electron')) {
    console.error('❌ vite-plugin-electron not configured');
    errors++;
  } else {
    console.log('✅ vite-plugin-electron configured');
  }
}

// Check TypeScript configuration
console.log('\nChecking TypeScript configuration...');
const tsconfigPath = path.join(rootDir, 'tsconfig.json');
const tsconfigNodePath = path.join(rootDir, 'tsconfig.node.json');

if (!fs.existsSync(tsconfigPath)) {
  console.error('❌ tsconfig.json not found');
  errors++;
} else {
  console.log('✅ tsconfig.json exists');
}

if (!fs.existsSync(tsconfigNodePath)) {
  console.error('❌ tsconfig.node.json not found');
  errors++;
} else {
  console.log('✅ tsconfig.node.json exists');
}

// Check electron files
console.log('\nChecking Electron files...');
const electronDir = path.join(rootDir, 'electron');
if (!fs.existsSync(electronDir)) {
  console.error('❌ electron/ directory not found');
  errors++;
} else {
  console.log('✅ electron/ directory exists');
  
  const electronFiles = ['main.ts', 'preload.ts'];
  for (const file of electronFiles) {
    const filePath = path.join(electronDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ electron/${file} not found`);
      errors++;
    } else {
      console.log(`✅ electron/${file} exists`);
    }
  }
}

// Check documentation
console.log('\nChecking documentation...');
const docsDir = path.join(rootDir, 'docs');
const requiredDocs = [
  'BUILD_PACKAGING.md',
  'TESTING_PACKAGED_APP.md',
  'BUILD_TROUBLESHOOTING.md',
  'RELEASE_CHECKLIST.md',
  'QUICK_START_BUILD.md'
];

if (!fs.existsSync(docsDir)) {
  console.error('❌ docs/ directory not found');
  errors++;
} else {
  for (const doc of requiredDocs) {
    const docPath = path.join(docsDir, doc);
    if (!fs.existsSync(docPath)) {
      console.warn(`⚠️  docs/${doc} not found`);
      warnings++;
    } else {
      console.log(`✅ docs/${doc} exists`);
    }
  }
}

// Check .gitignore
console.log('\nChecking .gitignore...');
const gitignorePath = path.join(rootDir, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  console.warn('⚠️  .gitignore not found');
  warnings++;
} else {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignore.includes('release')) {
    console.warn('⚠️  release/ not in .gitignore');
    warnings++;
  } else {
    console.log('✅ .gitignore configured correctly');
  }
}

// Summary
console.log('\n==========================================');
console.log('Verification Summary\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Build setup is complete.');
  console.log('\nYou can now build the application:');
  console.log('  npm run build          # Build for current platform');
  console.log('  npm run build:win      # Build for Windows');
  console.log('  npm run build:mac      # Build for macOS');
  console.log('  npm run build:linux    # Build for Linux');
  console.log('  npm run package        # Quick test build');
} else if (errors === 0 && warnings > 0) {
  console.log('✅ Build setup is complete!');
  console.warn(`\n⚠️  ${warnings} warning(s) found (non-critical):`);
  console.log('   - Missing platform-specific icons (will use defaults)');
  console.log('   - For production, create icons from build/icon.svg');
  console.log('   - See build/README.md for instructions');
  console.log('\nYou can build the application now:');
  console.log('  npm run build          # Build for current platform');
  console.log('  npm run build:win      # Build for Windows');
  console.log('  npm run build:mac      # Build for macOS');
  console.log('  npm run build:linux    # Build for Linux');
  console.log('  npm run package        # Quick test build');
} else {
  console.error(`\n❌ ${errors} error(s) found - build may fail`);
  if (warnings > 0) {
    console.warn(`⚠️  ${warnings} warning(s) found`);
  }
  
  console.log('\nPlease fix the errors before building.');
  console.log('See docs/BUILD_TROUBLESHOOTING.md for help.');
}

console.log('\nFor more information:');
console.log('  - Quick start: docs/QUICK_START_BUILD.md');
console.log('  - Full guide: docs/BUILD_PACKAGING.md');
console.log('  - Testing: docs/TESTING_PACKAGED_APP.md');
console.log('  - Troubleshooting: docs/BUILD_TROUBLESHOOTING.md');

process.exit(errors > 0 ? 1 : 0);
