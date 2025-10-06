# Release Checklist

This checklist ensures a smooth release process for WiFi Map Viewer.

## Pre-Release

### Code Quality
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] Code is properly formatted
- [ ] No console.log statements in production code
- [ ] All TODOs are resolved or documented

### Version Management
- [ ] Update version in `package.json`
- [ ] Update version in documentation if needed
- [ ] Create CHANGELOG.md entry with changes
- [ ] Tag the release in git: `git tag v1.0.0`

### Documentation
- [ ] README.md is up to date
- [ ] All documentation files are current
- [ ] Build instructions are accurate
- [ ] Installation instructions are clear
- [ ] Known issues are documented

### Icons and Assets
- [ ] Run `npm run check-icons` to verify icons
- [ ] Platform-specific icons are created:
  - [ ] Windows: `build/icon.ico`
  - [ ] macOS: `build/icon.icns`
  - [ ] Linux: `build/icon.png`
- [ ] Icons display correctly in builds

## Building

### Clean Build
- [ ] Remove old build artifacts: `rm -rf dist dist-electron release`
- [ ] Clean install dependencies: `rm -rf node_modules && npm install`
- [ ] Verify no build warnings

### Platform Builds

#### Windows Build
- [ ] Build: `npm run build:win`
- [ ] Verify installer created: `release/WiFi-Map-Viewer-{version}-x64.exe`
- [ ] Check installer size (should be ~150-200MB)
- [ ] Test installer on clean Windows 10 VM
- [ ] Test installer on clean Windows 11 VM
- [ ] Verify application launches
- [ ] Verify all features work
- [ ] Verify uninstaller works

#### macOS Build
- [ ] Build: `npm run build:mac`
- [ ] Verify DMG created for Intel: `release/WiFi-Map-Viewer-{version}-x64.dmg`
- [ ] Verify DMG created for Apple Silicon: `release/WiFi-Map-Viewer-{version}-arm64.dmg`
- [ ] Check DMG size (should be ~150-200MB each)
- [ ] Test on Intel Mac (macOS 11+)
- [ ] Test on Apple Silicon Mac (macOS 11+)
- [ ] Verify application launches
- [ ] Verify all features work
- [ ] Verify application can be moved to Applications

#### Linux Build
- [ ] Build: `npm run build:linux`
- [ ] Verify AppImage created: `release/WiFi-Map-Viewer-{version}-x64.AppImage`
- [ ] Verify DEB created: `release/WiFi-Map-Viewer-{version}-x64.deb`
- [ ] Check file sizes (should be ~150-200MB each)
- [ ] Test AppImage on Ubuntu 20.04+
- [ ] Test DEB on Ubuntu 20.04+
- [ ] Test on Debian 11+
- [ ] Test on Fedora 35+
- [ ] Verify application launches
- [ ] Verify all features work

## Testing

### Functional Testing
- [ ] Application launches without errors
- [ ] Database is created correctly
- [ ] File import works for all formats:
  - [ ] WiGLE CSV
  - [ ] Kismet CSV
  - [ ] KML
  - [ ] SQLite
- [ ] Map displays correctly
- [ ] Network markers render correctly
- [ ] Search and filter work correctly
- [ ] Network details popup works
- [ ] OUI lookup works
- [ ] Configuration persists

### Performance Testing
- [ ] Import 100k networks completes in <5 minutes
- [ ] Map renders 100k networks in <3 seconds
- [ ] Search returns results in <2 seconds
- [ ] Memory usage stays under 500MB
- [ ] No memory leaks during extended use

### Error Handling
- [ ] Invalid files show appropriate errors
- [ ] Corrupted database is handled gracefully
- [ ] Application doesn't crash on invalid input
- [ ] Error messages are user-friendly

### Cross-Platform Testing
- [ ] File paths work correctly on all platforms
- [ ] Native dialogs work correctly
- [ ] Application respects system theme
- [ ] Keyboard shortcuts work
- [ ] Window management works

## Security

### Code Signing (Optional but Recommended)

#### Windows
- [ ] Obtain code signing certificate
- [ ] Set environment variables:
  ```
  set CSC_LINK=C:\path\to\certificate.pfx
  set CSC_KEY_PASSWORD=your_password
  ```
- [ ] Rebuild with signing: `npm run build:win`
- [ ] Verify signature: Right-click installer → Properties → Digital Signatures

#### macOS
- [ ] Obtain Apple Developer certificate
- [ ] Set environment variables:
  ```
  export CSC_LINK=/path/to/certificate.p12
  export CSC_KEY_PASSWORD=your_password
  ```
- [ ] Rebuild with signing: `npm run build:mac`
- [ ] Verify signature: `codesign -dv --verbose=4 WiFi\ Map\ Viewer.app`
- [ ] Notarize with Apple (required for macOS 10.15+)

### Security Checks
- [ ] No hardcoded credentials
- [ ] No sensitive data in logs
- [ ] Input validation is in place
- [ ] SQL injection prevention verified
- [ ] File path validation works

## Distribution

### File Preparation
- [ ] Calculate checksums for all installers:
  ```bash
  # Windows
  certutil -hashfile WiFi-Map-Viewer-1.0.0-x64.exe SHA256
  
  # macOS/Linux
  shasum -a 256 WiFi-Map-Viewer-1.0.0-*.dmg
  shasum -a 256 WiFi-Map-Viewer-1.0.0-*.AppImage
  shasum -a 256 WiFi-Map-Viewer-1.0.0-*.deb
  ```
- [ ] Create checksums.txt file with all hashes
- [ ] Compress installers if needed (optional)

### Release Notes
- [ ] Create release notes with:
  - [ ] Version number
  - [ ] Release date
  - [ ] New features
  - [ ] Bug fixes
  - [ ] Known issues
  - [ ] Installation instructions
  - [ ] Upgrade instructions
  - [ ] Breaking changes (if any)

### GitHub Release
- [ ] Create new release on GitHub
- [ ] Upload all installers:
  - [ ] Windows installer (.exe)
  - [ ] macOS DMG files (.dmg)
  - [ ] Linux AppImage (.AppImage)
  - [ ] Linux DEB package (.deb)
- [ ] Upload checksums.txt
- [ ] Add release notes
- [ ] Mark as pre-release if applicable
- [ ] Publish release

### Alternative Distribution
- [ ] Upload to website (if applicable)
- [ ] Upload to cloud storage (if applicable)
- [ ] Update download links
- [ ] Update documentation with new version

## Post-Release

### Verification
- [ ] Download installers from release page
- [ ] Verify checksums match
- [ ] Test downloaded installers on clean systems
- [ ] Verify download links work

### Communication
- [ ] Announce release (if applicable)
- [ ] Update project website (if applicable)
- [ ] Post on social media (if applicable)
- [ ] Notify users (if applicable)

### Monitoring
- [ ] Monitor for bug reports
- [ ] Monitor download statistics
- [ ] Check for user feedback
- [ ] Document any issues found

### Cleanup
- [ ] Archive old releases (keep last 2-3 versions)
- [ ] Update documentation for next release
- [ ] Create milestone for next version
- [ ] Plan next release features

## Rollback Plan

If critical issues are found after release:

1. **Immediate Actions**
   - [ ] Mark release as problematic on GitHub
   - [ ] Add warning to release notes
   - [ ] Document the issue

2. **Fix or Revert**
   - [ ] Create hotfix branch
   - [ ] Fix the issue
   - [ ] Test thoroughly
   - [ ] Create new patch release

3. **Communication**
   - [ ] Notify users of the issue
   - [ ] Provide workaround if available
   - [ ] Announce fix when ready

## Version Numbering

Follow Semantic Versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backwards compatible
- **Patch** (1.0.1): Bug fixes, backwards compatible

## Release Schedule

Suggested release schedule:
- **Major releases**: Every 6-12 months
- **Minor releases**: Every 1-3 months
- **Patch releases**: As needed for critical bugs

## Automation (Future)

Consider automating:
- [ ] Build process with CI/CD
- [ ] Testing with automated test suite
- [ ] Code signing in CI pipeline
- [ ] Release creation with GitHub Actions
- [ ] Changelog generation
- [ ] Version bumping

## Notes

- Always test on clean systems, not development machines
- Keep build logs for troubleshooting
- Document any build issues and solutions
- Update this checklist based on experience
- Consider beta releases for major versions
