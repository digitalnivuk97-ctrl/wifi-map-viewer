# Build Troubleshooting Guide

This document provides solutions to common build and packaging issues.

## Common Build Issues

### Issue: "Cannot find module 'electron'"

**Symptoms:**
```
Error: Cannot find module 'electron'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: "better-sqlite3 native module error"

**Symptoms:**
```
Error: The module was compiled against a different Node.js version
```

**Solution:**
```bash
# Rebuild native modules for Electron
npm rebuild better-sqlite3 --runtime=electron --target=33.3.1 --disturl=https://electronjs.org/headers --abi=120
```

Or use electron-rebuild:
```bash
npm install --save-dev electron-rebuild
npx electron-rebuild
```

### Issue: "electron-builder not found"

**Symptoms:**
```
'electron-builder' is not recognized as an internal or external command
```

**Solution:**
```bash
# Install electron-builder
npm install --save-dev electron-builder
```

### Issue: TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module 'X' or its corresponding type declarations
```

**Solution:**
```bash
# Install missing type definitions
npm install --save-dev @types/node @types/react @types/react-dom

# Clear TypeScript cache
rm -rf node_modules/.cache
```

### Issue: Vite build fails

**Symptoms:**
```
Error: Build failed with errors
```

**Solution:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

## Platform-Specific Issues

### Windows

#### Issue: "MSBuild not found"

**Symptoms:**
```
error MSB3428: Could not load the Visual C++ component "VCBuild.exe"
```

**Solution:**
Install Visual Studio Build Tools:
1. Download from https://visualstudio.microsoft.com/downloads/
2. Install "Desktop development with C++" workload
3. Restart terminal and try again

Or use windows-build-tools:
```bash
npm install --global windows-build-tools
```

#### Issue: "Python not found"

**Symptoms:**
```
gyp ERR! find Python - "python" is not in PATH
```

**Solution:**
```bash
# Install Python 3
# Download from https://www.python.org/downloads/

# Or use windows-build-tools
npm install --global windows-build-tools
```

#### Issue: NSIS installer creation fails

**Symptoms:**
```
Error: NSIS not found
```

**Solution:**
electron-builder downloads NSIS automatically. If it fails:
```bash
# Clear electron-builder cache
rm -rf ~/AppData/Local/electron-builder/Cache

# Rebuild
npm run build:win
```

### macOS

#### Issue: "xcode-select: error: tool 'xcodebuild' requires Xcode"

**Symptoms:**
```
xcode-select: error: tool 'xcodebuild' requires Xcode
```

**Solution:**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

#### Issue: "codesign failed"

**Symptoms:**
```
Error: Command failed: codesign
```

**Solution:**
If you don't have a signing certificate:
```bash
# Disable code signing for development
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:mac
```

For production, obtain an Apple Developer certificate.

#### Issue: DMG creation fails

**Symptoms:**
```
Error: Cannot create DMG
```

**Solution:**
```bash
# Install required tools
brew install create-dmg

# Or let electron-builder download them
rm -rf ~/Library/Caches/electron-builder
npm run build:mac
```

### Linux

#### Issue: "fuse: device not found"

**Symptoms:**
```
fuse: device not found, try 'modprobe fuse' first
```

**Solution:**
```bash
# Install FUSE
sudo apt-get install fuse libfuse2

# Load FUSE module
sudo modprobe fuse
```

#### Issue: AppImage won't run

**Symptoms:**
```
Permission denied
```

**Solution:**
```bash
# Make AppImage executable
chmod +x WiFi-Map-Viewer-*.AppImage

# Run
./WiFi-Map-Viewer-*.AppImage
```

#### Issue: DEB package creation fails

**Symptoms:**
```
Error: dpkg-deb not found
```

**Solution:**
```bash
# Install required tools
sudo apt-get install dpkg fakeroot
```

## Icon Issues

### Issue: Icons not showing in built app

**Symptoms:**
Application uses default system icon instead of custom icon.

**Solution:**
1. Verify icon files exist:
   ```bash
   ls -la build/
   # Should show icon.ico, icon.icns, icon.png
   ```

2. Check icon file sizes:
   - Windows (.ico): Should be ~100KB
   - macOS (.icns): Should be ~200KB
   - Linux (.png): Should be ~50KB

3. Rebuild application:
   ```bash
   npm run build
   ```

### Issue: "Icon file not found"

**Symptoms:**
```
Error: Icon file not found: build/icon.ico
```

**Solution:**
```bash
# Check if icons exist
npm run check-icons

# Create missing icons (see build/README.md)
# Or build without custom icons (uses defaults)
npm run build
```

## Build Performance Issues

### Issue: Build is very slow

**Solutions:**

1. **Disable virus scanner temporarily** (Windows)
   - Antivirus can slow down file operations significantly
   - Add project directory to exclusions

2. **Use faster disk**
   - Build on SSD instead of HDD
   - Use local disk instead of network drive

3. **Increase Node.js memory**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

4. **Clear caches**
   ```bash
   rm -rf node_modules/.cache
   rm -rf node_modules/.vite
   npm run build
   ```

## Runtime Issues After Building

### Issue: Application won't launch

**Symptoms:**
Double-clicking the application does nothing.

**Solution:**

1. **Run from command line to see errors:**
   ```bash
   # Windows
   "C:\Program Files\WiFi Map Viewer\WiFi Map Viewer.exe"
   
   # macOS
   /Applications/WiFi\ Map\ Viewer.app/Contents/MacOS/WiFi\ Map\ Viewer
   
   # Linux
   ./WiFi-Map-Viewer-*.AppImage
   ```

2. **Check logs:**
   - Windows: `%APPDATA%\wifi-map-viewer\logs\`
   - macOS: `~/Library/Logs/wifi-map-viewer/`
   - Linux: `~/.config/wifi-map-viewer/logs/`

### Issue: "DLL not found" (Windows)

**Symptoms:**
```
The code execution cannot proceed because VCRUNTIME140.dll was not found
```

**Solution:**
Install Visual C++ Redistributable:
https://aka.ms/vs/17/release/vc_redist.x64.exe

### Issue: Database errors after packaging

**Symptoms:**
```
Error: Cannot open database
```

**Solution:**
1. Check database path in config
2. Verify write permissions to app data directory
3. Delete database and let app recreate it

### Issue: Import fails in packaged app

**Symptoms:**
File import works in development but fails in packaged app.

**Solution:**
1. Check file paths are absolute, not relative
2. Verify file permissions
3. Check if file is accessible from packaged app location

## Debugging Built Application

### Enable Developer Tools

Add this to your main process code temporarily:
```typescript
mainWindow.webContents.openDevTools();
```

### Check Console Logs

Look for errors in:
- Electron main process console
- Renderer process DevTools console
- Application log files

### Verify File Paths

Log all file paths to ensure they're correct:
```typescript
console.log('App path:', app.getPath('userData'));
console.log('Database path:', databasePath);
```

## Clean Build

If all else fails, do a completely clean build:

```bash
# Remove all build artifacts
rm -rf node_modules
rm -rf dist
rm -rf dist-electron
rm -rf release
rm -rf build/*.ico build/*.icns build/*.png

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

## Getting Help

If you're still having issues:

1. **Check the logs:**
   - Build logs in terminal
   - Application logs in app data directory

2. **Search for similar issues:**
   - electron-builder issues: https://github.com/electron-userland/electron-builder/issues
   - Electron issues: https://github.com/electron/electron/issues

3. **Provide information when asking for help:**
   - Operating system and version
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - Full error message
   - Build command used
   - Steps to reproduce

## Useful Commands

```bash
# Check versions
node --version
npm --version
npx electron --version

# Clear caches
npm cache clean --force
rm -rf node_modules/.cache

# Rebuild native modules
npm rebuild

# Check for outdated packages
npm outdated

# Update packages
npm update

# Verify package.json
npm install --dry-run

# Check for security issues
npm audit
```

## Prevention

To avoid build issues:

1. **Use consistent Node.js version**
   - Use nvm or nvm-windows
   - Document required Node.js version

2. **Lock dependency versions**
   - Commit package-lock.json
   - Use exact versions for critical dependencies

3. **Test builds regularly**
   - Don't wait until release to test packaging
   - Test on clean systems, not just development machines

4. **Document custom setup**
   - Document any special build requirements
   - Keep build documentation up to date

5. **Use CI/CD**
   - Automate builds with GitHub Actions or similar
   - Catch build issues early
