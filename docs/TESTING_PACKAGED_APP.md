# Testing Packaged Application

This document provides a comprehensive testing checklist for the packaged WiFi Map Viewer application across different platforms.

## Pre-Build Testing

Before packaging, ensure all tests pass:
```bash
npm test
npm run build
```

## Building Test Packages

### Quick Test Build (No Installer)
```bash
npm run package
```
This creates an unpacked directory for quick testing without creating installers.

### Platform-Specific Test Builds
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Testing Checklist

### Installation Testing

#### Windows
- [ ] Installer launches without errors
- [ ] User can choose installation directory
- [ ] Desktop shortcut is created
- [ ] Start menu shortcut is created
- [ ] Application appears in Add/Remove Programs
- [ ] Uninstaller works correctly

#### macOS
- [ ] DMG mounts correctly
- [ ] Application can be dragged to Applications folder
- [ ] Application launches from Applications folder
- [ ] Application icon displays correctly in Dock
- [ ] Application can be removed by dragging to Trash

#### Linux
- [ ] AppImage has execute permissions
- [ ] AppImage launches without errors
- [ ] DEB package installs correctly
- [ ] Application appears in application menu
- [ ] Application can be uninstalled via package manager

### Application Launch Testing

- [ ] Application launches without errors
- [ ] Main window displays correctly
- [ ] Window can be resized
- [ ] Window can be minimized/maximized
- [ ] Application icon displays in taskbar/dock

### Database Testing

- [ ] Database file is created on first launch
- [ ] Database is created in correct location:
  - Windows: `%APPDATA%/wifi-map-viewer/`
  - macOS: `~/Library/Application Support/wifi-map-viewer/`
  - Linux: `~/.config/wifi-map-viewer/`
- [ ] Database persists between application restarts
- [ ] Multiple application instances handle database correctly

### File Import Testing

- [ ] File dialog opens correctly
- [ ] Can select and import WiGLE CSV files
- [ ] Can select and import Kismet CSV files
- [ ] Can select and import KML files
- [ ] Can select and import SQLite database files
- [ ] Progress indicator displays during import
- [ ] Import results summary displays correctly
- [ ] Large files (>100MB) import without crashing
- [ ] Invalid files show appropriate error messages

### Map Visualization Testing

- [ ] Map displays correctly on launch
- [ ] OpenStreetMap tiles load correctly
- [ ] Can zoom in and out
- [ ] Can pan around the map
- [ ] Network markers display at correct locations
- [ ] Marker clustering works at low zoom levels
- [ ] Individual markers show at high zoom levels
- [ ] SSID labels display at appropriate zoom levels
- [ ] Clicking markers shows network details popup
- [ ] Popup displays all network information correctly

### Search and Filter Testing

- [ ] SSID search returns correct results
- [ ] BSSID search returns correct results
- [ ] Encryption type filter works correctly
- [ ] Date range filter works correctly
- [ ] Signal strength filter works correctly
- [ ] Multiple filters work together (AND logic)
- [ ] Clear filters button works
- [ ] Result count displays correctly
- [ ] Filtered networks highlight on map

### Performance Testing

- [ ] Application launches within 5 seconds
- [ ] Map renders within 3 seconds with 100k networks
- [ ] Panning/zooming is smooth (no lag)
- [ ] Search results return within 2 seconds
- [ ] Import of 100k networks completes within 5 minutes
- [ ] Memory usage stays under 500MB with 1M networks
- [ ] Application doesn't freeze during operations

### Error Handling Testing

- [ ] Invalid file formats show error messages
- [ ] Corrupted database shows error and recovery option
- [ ] Network errors (if any) are handled gracefully
- [ ] Application doesn't crash on invalid input
- [ ] Error messages are user-friendly
- [ ] Errors are logged for debugging

### Configuration Testing

- [ ] Config file is created on first launch
- [ ] Default settings are applied correctly
- [ ] Settings persist between restarts
- [ ] Invalid config values use defaults
- [ ] Config file location is correct for platform

### OUI Lookup Testing

- [ ] Manufacturer names display correctly for known BSSIDs
- [ ] Unknown BSSIDs show "Unknown" manufacturer
- [ ] OUI database is included in packaged app
- [ ] Lookup is fast (no noticeable delay)

### Platform-Specific Testing

#### Windows
- [ ] File paths use backslashes correctly
- [ ] Application works on Windows 10
- [ ] Application works on Windows 11
- [ ] Native dialogs display correctly
- [ ] Application respects Windows theme

#### macOS
- [ ] File paths use forward slashes correctly
- [ ] Application works on Intel Macs
- [ ] Application works on Apple Silicon Macs
- [ ] Native dialogs display correctly
- [ ] Application respects macOS theme
- [ ] Application works on macOS 11+

#### Linux
- [ ] File paths use forward slashes correctly
- [ ] Application works on Ubuntu 20.04+
- [ ] Application works on Debian 11+
- [ ] Application works on Fedora 35+
- [ ] Native dialogs display correctly
- [ ] Application respects system theme

### Security Testing

- [ ] Application doesn't make network requests
- [ ] Database file has correct permissions (user-only)
- [ ] No temporary files left after operations
- [ ] File paths are validated (no directory traversal)
- [ ] Input is sanitized (no SQL injection)

### Accessibility Testing

- [ ] Application can be navigated with keyboard
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Screen reader compatibility (basic)
- [ ] High contrast mode works

## Automated Testing

Create automated tests for critical functionality:

```bash
# Run unit tests
npm test

# Run integration tests (if available)
npm run test:integration

# Run end-to-end tests (if available)
npm run test:e2e
```

## Test Data

Use these test datasets:

1. **Small Dataset**: 100 networks (quick smoke test)
2. **Medium Dataset**: 10,000 networks (typical use case)
3. **Large Dataset**: 100,000 networks (stress test)
4. **Extra Large Dataset**: 1,000,000 networks (maximum capacity)

Test files should include:
- Valid WiGLE CSV format
- Valid Kismet CSV format
- Valid KML format
- Valid SQLite database
- Invalid/corrupted files for error testing

## Regression Testing

After each build, verify:
- [ ] All previously working features still work
- [ ] No new bugs introduced
- [ ] Performance hasn't degraded
- [ ] UI hasn't broken

## Bug Reporting

When bugs are found, document:
1. Platform and version
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots/logs
6. Severity (critical, major, minor)

## Test Environment Setup

### Windows Testing
- Virtual Machine: Windows 10/11
- Physical Hardware: Various Windows PCs
- Test on both clean and existing installations

### macOS Testing
- Virtual Machine: macOS 11+ (if available)
- Physical Hardware: Intel and Apple Silicon Macs
- Test on both clean and existing installations

### Linux Testing
- Virtual Machines: Ubuntu, Debian, Fedora
- Physical Hardware: Various Linux distributions
- Test both AppImage and DEB packages

## Performance Benchmarks

Record these metrics for each platform:

| Metric | Target | Windows | macOS | Linux |
|--------|--------|---------|-------|-------|
| Launch Time | <5s | | | |
| Map Render (100k) | <3s | | | |
| Import (100k) | <5min | | | |
| Search Time | <2s | | | |
| Memory Usage | <500MB | | | |
| Package Size | <200MB | | | |

## Sign-Off

Before release, all critical tests must pass:
- [ ] Installation works on all platforms
- [ ] Core features work correctly
- [ ] Performance meets targets
- [ ] No critical bugs
- [ ] Security requirements met
- [ ] Platform-specific features work

## Continuous Testing

Set up automated testing:
1. Run tests on every commit
2. Build packages on every release
3. Test on multiple platforms automatically
4. Monitor performance metrics
5. Track bug reports and fixes
