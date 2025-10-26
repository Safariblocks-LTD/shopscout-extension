# ShopScout Owl Icon Conversion Guide

## Overview
The ShopScout extension now uses a custom owl-themed icon set for the Chrome Web Store listing. The icons are provided as SVG files that need to be converted to PNG format for the extension.

## Icon Files Created
- `assets/icons/owl-icon16.svg` - 16x16 icon
- `assets/icons/owl-icon32.svg` - 32x32 icon  
- `assets/icons/owl-icon48.svg` - 48x48 icon
- `assets/icons/owl-icon128.svg` - 128x128 icon

## Conversion Instructions

### Method 1: Online Converter (Recommended)
1. Visit an online SVG to PNG converter (e.g., cloudconvert.com, svg2png.com)
2. Upload each SVG file
3. Set the exact dimensions (16x16, 32x32, 48x48, 128x128)
4. Download the PNG files
5. Save them in `assets/icons/` with the same names but .png extension

### Method 2: Command Line (macOS/Linux)
```bash
# Install ImageMagick if not already installed
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Ubuntu/Debian

# Convert all SVG files to PNG
magick convert assets/icons/owl-icon16.svg assets/icons/owl-icon16.png
magick convert assets/icons/owl-icon32.svg assets/icons/owl-icon32.png
magick convert assets/icons/owl-icon48.svg assets/icons/owl-icon48.png
magick convert assets/icons/owl-icon128.svg assets/icons/owl-icon128.png
```

### Method 3: Online Tools
- https://svg2png.com/
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

## After Conversion
Once you have the PNG files:
1. Place them in `assets/icons/`
2. Ensure the filenames match exactly: `owl-icon16.png`, `owl-icon32.png`, `owl-icon48.png`, `owl-icon128.png`
3. The manifest.json is already configured to use these new owl icons

## Icon Design
The owl icon features:
- Gradient blue background matching ShopScout branding
- White owl with blue eyes
- Orange beak and feet accents
- Clean, modern design suitable for web store display
