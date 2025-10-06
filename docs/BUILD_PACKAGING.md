# Build and Packaging Guide

This document describes how to build and package the WiFi Map Viewer application for distribution.

## Prerequisites

Before building, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- All dependencies installed: `npm install`

### Platform-Specific Requirements

#### Windows
- No additional requirements for building on Windows
- For creating installers: NSIS is automatically downloaded by electron-builder

#### macOS
- Xcode Command Line Tools: `xcode-select --install`
- For code signing: Apple Developer account and certificates

#### Linux
- For AppImage: `fuse` package
- For DEB packages: `dpkg` and `fakeroot`
- Install: `sudo apt-get install fuse libfuse2 dpkg fakeroot`

## Build Scripts

The following npm scripts are available:

### Development Build
```bash
npm run dev
```
Starts the development server with hot reload.

### Production Build (All Platforms)
```bash
npm run build
```
Builds the application for the current platform.

### Platform-Specific Builds
```bash
# Windows only
npm run build:win

# macOS only
npm run build:mac

# Linux only
npm run build:linux
```

### Package Without Installer
```bash
npm run package
```
Creates an unpacked directory for testing without creating installers.

### Full Distribution Build
```bash
npm run dist
```
Creates installers for the current platform.

## Build Output

All build artifacts are created in the `release/` directory:

### Windows
- `WiFi-Map-Viewer-{version}-x64.exe` - NSIS installer
- Installer allows user to choose installation directory
- Creates desktop and start menu shortcuts

### macOS
- `WiFi-Map-Viewer-{version}-x64.dmg` - Intel Macs
- `WiFi-Map-Viewer-{version}-arm64.dmg` - Apple Silicon Macs
- DMG contains app bundle and Applications folder link

### Linux
- `WiFi-Map-Viewer-{version}-x64.AppImage` - Universal Linux binary
- `WiFi-Map-Viewer-{version}-x64.deb` - Debian/Ubuntu package

## Application Icons

Before building for production, create platform-specific icons:

1. Edit `build/icon.svg` with your desired icon design
2. Convert to platform-specific formats (see `build/README.md`)
3. Place the converted icons in the `build/` directory:
   - `build/icon.ico` for Windows
   - `build/icon.icns` for macOS
   - `build/icon.png` for Linux

If icons are not provided, the application will use default system icons.

## Testing the Packaged Application

### Test Without Installing

Use the package command to create an unpacked directory:
```bash
npm run package
```

Then run the application from:
- Windows: `release/win-unpacked/WiFi Map Viewer.exe`
- macOS: `release/mac/WiFi Map Viewer.app`
- Linux: `release/linux-unpacked/wifi-map-viewer`

### Test the Installer

1. Build the installer for your platform
2. Install the application
3. Verify:
   - Application launches correctly
   - Database is created in the correct location
   - File imports work
   - Map displays correctly
   - All features function as expected

### Cross-Platform Testing

To test on multiple platforms:
1. Use virtual machines or separate hardware
2. Build on each platform using the platform-specific build command
3. Test the installer and application functionality
4. Verify platform-specific features (file paths, dialogs, etc.)

## Build Configuration

The build configuration is in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.wifimapviewer.app",
    "productName": "WiFi Map Viewer",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "node_modules/better-sqlite3",
        "to": "better-sqlite3",
        "filter": ["**/*"]
      }
    ]
  }
}
```

### Key Configuration Options

- **appId**: Unique identifier for the application
- **productName**: Display name of the application
- **directories.output**: Where build artifacts are placed
- **files**: Which files to include in the package
- **extraResources**: Additional resources (like native modules)

## Native Dependencies

The application uses `better-sqlite3`, which is a native Node.js module. electron-builder automatically rebuilds native modules for Electron.

If you encounter issues with native modules:
```bash
# Rebuild for Electron
npm run electron:rebuild
```

## Code Signing

### macOS Code Signing

To sign the macOS application:
1. Obtain an Apple Developer certificate
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your_password
   ```
3. Build: `npm run build:mac`

### Windows Code Signing

To sign the Windows application:
1. Obtain a code signing certificate
2. Set environment variables:
   ```bash
   set CSC_LINK=C:\path\to\certificate.pfx
   set CSC_KEY_PASSWORD=your_password
   ```
3. Build: `npm run build:win`

## Troubleshooting

### Build Fails with "Cannot find module"
- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Native Module Errors
- Rebuild native modules: `npm rebuild better-sqlite3`
- Ensure you have the correct build tools installed

### Icon Not Showing
- Verify icon files exist in `build/` directory
- Check icon file names match configuration
- Rebuild the application

### Large Bundle Size
- The application includes Electron runtime (~100MB)
- better-sqlite3 native module adds ~5MB
- This is normal for Electron applications

## Distribution

### Hosting Installers

Upload the installers from `release/` to:
- GitHub Releases
- Your own web server
- Cloud storage (S3, Google Drive, etc.)

### Update Mechanism

For auto-updates, consider integrating:
- electron-updater (from electron-builder)
- Custom update checking mechanism

### Release Checklist

Before releasing:
- [ ] Update version in package.json
- [ ] Test on all target platforms
- [ ] Verify all features work in packaged app
- [ ] Create release notes
- [ ] Sign installers (if applicable)
- [ ] Upload to distribution platform
- [ ] Test download and installation

## Performance Considerations

The packaged application:
- Includes the full Electron runtime
- Bundles all dependencies
- Typical size: 150-200MB installed
- First launch may be slower due to database initialization

## Security

- Application runs in a sandboxed Electron environment
- No network access (offline-only)
- Database stored in user's app data directory
- File system access limited to user-selected files
