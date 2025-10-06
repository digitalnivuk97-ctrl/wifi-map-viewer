# Quick Start: Building WiFi Map Viewer

This guide will get you building the application as quickly as possible.

## Prerequisites

Install Node.js 18 or higher from https://nodejs.org/

### Platform-Specific Requirements

**Windows:**
- Visual Studio Build Tools with C++ workload
- Download: https://visualstudio.microsoft.com/downloads/

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install build-essential python3 fuse libfuse2
```

## Quick Build (5 Steps)

### 1. Clone and Install
```bash
git clone <repository-url>
cd wifi-map-viewer
npm install
```

### 2. Check Icons (Optional)
```bash
npm run check-icons
```

If icons are missing, the app will build with default system icons. For production, create icons following `build/README.md`.

### 3. Build for Your Platform
```bash
# Automatic (detects your platform)
npm run build

# Or specify platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### 4. Find Your Installer
Look in the `release/` directory:
- **Windows**: `WiFi-Map-Viewer-{version}-x64.exe`
- **macOS**: `WiFi-Map-Viewer-{version}-x64.dmg` or `WiFi-Map-Viewer-{version}-arm64.dmg`
- **Linux**: `WiFi-Map-Viewer-{version}-x64.AppImage` or `WiFi-Map-Viewer-{version}-x64.deb`

### 5. Test the Installer
Install and run the application to verify everything works.

## Development Build

To run the app in development mode:
```bash
npm run electron:dev
```

This starts a development server with hot reload.

## Quick Test Build

To test without creating an installer:
```bash
npm run package
```

This creates an unpacked directory in `release/` that you can run directly:
- **Windows**: `release/win-unpacked/WiFi Map Viewer.exe`
- **macOS**: `release/mac/WiFi Map Viewer.app`
- **Linux**: `release/linux-unpacked/wifi-map-viewer`

## Common Issues

### "better-sqlite3 native module error"
```bash
npm rebuild better-sqlite3
```

### "electron-builder not found"
```bash
npm install
```

### Build is slow
- Disable antivirus temporarily (Windows)
- Build on SSD instead of HDD
- Close other applications

### Icons not showing
- Run `npm run check-icons` to see what's missing
- Follow instructions in `build/README.md` to create icons
- Or build without custom icons (uses defaults)

## Build Times

Typical build times on modern hardware:
- **First build**: 5-10 minutes (downloads dependencies)
- **Subsequent builds**: 2-5 minutes
- **Quick test build**: 1-2 minutes

## Next Steps

- Read [BUILD_PACKAGING.md](BUILD_PACKAGING.md) for detailed build information
- Read [TESTING_PACKAGED_APP.md](TESTING_PACKAGED_APP.md) for testing checklist
- Read [BUILD_TROUBLESHOOTING.md](BUILD_TROUBLESHOOTING.md) if you encounter issues
- Read [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before releasing

## Build Output Size

Expect these approximate sizes:
- **Windows installer**: ~150MB
- **macOS DMG**: ~150MB per architecture
- **Linux AppImage**: ~180MB
- **Linux DEB**: ~150MB

The size includes:
- Electron runtime (~100MB)
- Application code (~10MB)
- Dependencies (~40MB)
- Native modules (~5MB)

## Tips

1. **Clean build if issues occur:**
   ```bash
   rm -rf node_modules dist dist-electron release
   npm install
   npm run build
   ```

2. **Check for updates:**
   ```bash
   npm outdated
   ```

3. **Test on clean systems:**
   - Use virtual machines
   - Test on systems without development tools
   - Verify all features work

4. **Create icons for production:**
   - Use `build/icon.svg` as source
   - Convert to platform-specific formats
   - See `build/README.md` for instructions

5. **Monitor build output:**
   - Watch for warnings
   - Check file sizes
   - Verify all files are included

## Support

If you encounter issues:
1. Check [BUILD_TROUBLESHOOTING.md](BUILD_TROUBLESHOOTING.md)
2. Search existing issues on GitHub
3. Create a new issue with:
   - Your OS and version
   - Node.js version (`node --version`)
   - Full error message
   - Steps to reproduce
