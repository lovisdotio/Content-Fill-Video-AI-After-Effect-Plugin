# Changelog

All notable changes to the AI Video Inpainting Plugin for After Effects will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-XX

### 🎉 Added
- **Fallback download popup** - Shows manual download link if automatic download fails
- **Prominent warnings** - Red warning box about limitations and save requirements
- **Cross-platform installers** - Working install scripts for both macOS and Windows
- **Improved error handling** - Better user feedback for common issues
- **Direct file download** - Replaced base64 conversion with direct MP4 download

### 🔧 Changed
- **Updated UI warnings** - Clear red warnings about 24fps, 81 frames, 480p limits
- **Enhanced README** - Comprehensive documentation with troubleshooting
- **Better build process** - Webpack configuration for reliable bundling

### 🐛 Fixed
- **Windows installer** - Previously empty, now fully functional
- **Download failures** - Added system-level curl/PowerShell download methods
- **File permissions** - Better handling of macOS and Windows file system differences

### 📚 Documentation
- **GitHub-ready README** - Complete open source documentation
- **License file** - MIT license for open source distribution
- **Changelog** - This file for tracking versions
- **Installation guides** - Step-by-step for both platforms

## [1.0.0] - 2025-01-XX

### 🎉 Initial Release
- **AI Video Inpainting** - Core functionality using fal.ai wan-vace model
- **After Effects Integration** - CEP panel with native AE integration
- **Mask-based Processing** - Uses AE masks for precise inpainting areas
- **Automatic Import** - Results automatically added to AE project
- **Real-time Progress** - Live updates during AI processing
- **FAL.ai Integration** - Official fal.ai client integration

### 📋 Features
- Support for After Effects 2020+
- 480p output resolution
- 24fps frame rate support
- Maximum 81 frames (~3.4 seconds)
- Automatic video rendering and masking
- Progress tracking and status updates

### ⚠️ Known Limitations
- Output limited to 480p (fal.ai constraint)
- Only supports 24fps compositions
- Maximum 81 frames per generation
- Requires fal.ai API key and credits

---

## Development Notes

### Why These Limitations?
- **480p**: Current fal.ai wan-vace model limitation
- **24fps**: Model training constraint
- **81 frames**: Processing time and cost optimization
- **Save warning**: Plugin modifies composition during rendering

### Future Plans
- Higher resolutions when fal.ai supports them
- Variable frame rate support
- Longer video processing
- Multiple AI model options

### Contributing
We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

*Made with ❤️ because Adobe was taking too long! 😅*