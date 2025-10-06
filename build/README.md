# Build Resources

This directory contains resources needed for building the application installers.

## Application Icons

The `icon.svg` file is the source icon for the application. To create platform-specific icons:

### Windows (.ico)
- Required size: 256x256 pixels
- Use a tool like ImageMagick or an online converter to convert icon.svg to icon.ico
- Command: `magick convert -density 256x256 -background transparent icon.svg -define icon:auto-resize -colors 256 icon.ico`

### macOS (.icns)
- Required sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Use a tool like `png2icns` or `iconutil` on macOS
- Steps:
  1. Export icon.svg to PNG at various sizes
  2. Create an iconset directory structure
  3. Run: `iconutil -c icns icon.iconset`

### Linux (.png)
- Required size: 512x512 pixels
- Use ImageMagick or Inkscape to convert icon.svg to icon.png
- Command: `magick convert -density 512x512 -background transparent icon.svg icon.png`
- Or: `inkscape -w 512 -h 512 icon.svg -o icon.png`

## Placeholder Icons

For development and testing, you can use placeholder icons:
- The build process will work without icons, but the app will use default system icons
- For production releases, proper icons should be created for each platform

## Creating Icons from SVG

If you have the required tools installed, you can run these commands:

```bash
# Windows (requires ImageMagick)
magick convert -density 256x256 -background transparent icon.svg -define icon:auto-resize -colors 256 icon.ico

# Linux (requires ImageMagick or Inkscape)
magick convert -density 512x512 -background transparent icon.svg icon.png
# or
inkscape -w 512 -h 512 icon.svg -o icon.png

# macOS (requires Inkscape and iconutil)
# First create PNGs at different sizes
for size in 16 32 64 128 256 512 1024; do
  inkscape -w $size -h $size icon.svg -o icon_${size}x${size}.png
done
# Then create iconset and convert to icns
mkdir icon.iconset
cp icon_16x16.png icon.iconset/icon_16x16.png
cp icon_32x32.png icon.iconset/icon_16x16@2x.png
cp icon_32x32.png icon.iconset/icon_32x32.png
cp icon_64x64.png icon.iconset/icon_32x32@2x.png
cp icon_128x128.png icon.iconset/icon_128x128.png
cp icon_256x256.png icon.iconset/icon_128x128@2x.png
cp icon_256x256.png icon.iconset/icon_256x256.png
cp icon_512x512.png icon.iconset/icon_256x256@2x.png
cp icon_512x512.png icon.iconset/icon_512x512.png
cp icon_1024x1024.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

## Online Converters

If you don't have the tools installed, you can use online converters:
- https://cloudconvert.com/ - Supports SVG to ICO, PNG, ICNS
- https://convertio.co/ - Multi-format converter
- https://icoconvert.com/ - Specialized for icon conversion
