# 🎬 AI Video Inpainting Plugin for After Effects

**Free AI-powered video inpainting directly in After Effects!**

When Adobe takes too long to implement AI features, sometimes you just build them yourself. 🤷‍♂️

![Plugin Status](https://img.shields.io/badge/Status-Working%20&%20Free-brightgreen)
![After Effects](https://img.shields.io/badge/After_Effects-2020+-blue)
![AI Powered](https://img.shields.io/badge/AI-fal.ai%20wan--vace-purple)
![Downloads](https://img.shields.io/github/downloads/lovisodin/plugin-after-fal/total)
![Stars](https://img.shields.io/github/stars/lovisodin/plugin-after-fal)

**⭐ Star this repo if you find it useful! ⭐**

## ✨ Features

- **AI Video Inpainting**: Draw a mask, write a prompt, get AI-generated replacement
- **Easy Integration**: Works directly in After Effects as a CEP panel
- **Free to Use**: No subscription, no hidden costs
- **Real-time Processing**: Using fal.ai's powerful wan-vace model

## ⚠️ Current Limitations

- **480p Output** - Limited by fal.ai technical constraints
- **24 FPS Only** - Other frame rates not supported yet
- **81 Frames Max** - ~3.4 seconds at 24fps
- **Save Your Work** - Always backup your composition before processing!

## 🚀 Installation

### Quick Install (Recommended)

**macOS:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```batch
install-windows.bat
```

### Manual Installation

1. **Enable CEP Debug Mode**
   ```bash
   # macOS
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   
   # Windows (PowerShell as Admin)
   New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.12" -Name "PlayerDebugMode" -Value "1"
   ```

2. **Copy Plugin**
   ```bash
   # macOS
   sudo cp -r fal-inpainting-cep "/Library/Application Support/Adobe/CEP/extensions/com.lovisodin.generativefill"
   
   # Windows
   Copy plugin to: %ProgramFiles(x86)%\Common Files\Adobe\CEP\extensions\
   ```

3. **Restart After Effects**

## 🎯 How to Use

1. **Get FAL.ai API Key**
   - Sign up at [fal.ai](https://fal.ai)
   - Get your API key from dashboard

2. **In After Effects:**
   - Open: `Window > Extensions > Generative Fill Video - Lovis Odin`
   - Paste your API key
   - Select a layer with masks
   - Write your prompt
   - Click "Generate"

3. **Wait for Magic** ✨
   - Processing takes 2-5 minutes
   - Result automatically imports to your project

## 🔧 Development

### Requirements
- Node.js 18+
- After Effects 2020+
- FAL.ai API key

### Build from Source
```bash
npm install
npm run build
```

### Project Structure
```
fal-inpainting-cep/
├── index.html          # Main UI
├── jsx/main.jsx        # ExtendScript logic
├── js/                 # JavaScript modules
├── CSXS/manifest.xml   # CEP configuration
└── src/                # Source files
```

## 🐛 Troubleshooting

**Plugin not showing in AE?**
- Check CEP debug mode is enabled
- Restart After Effects completely
- Verify plugin is in correct extensions folder

**Download fails?**
- Check internet connection
- Try the manual download link in the popup
- Verify file permissions

**Processing stuck?**
- Check your FAL.ai API credits
- Ensure composition is ≤81 frames at 24fps
- Save and restart After Effects

## 🚀 Quick Start

1. **Download Latest Release**: Check [Releases](https://github.com/lovisodin/plugin-after-fal/releases)
2. **Run Installer**: 
   - macOS: `chmod +x install.sh && ./install.sh`
   - Windows: Right-click `install-windows.bat` → "Run as Administrator"
3. **Get API Key**: Sign up at [fal.ai](https://fal.ai)
4. **Start Creating**: Open After Effects → Window → Extensions → Generative Fill Video

## 🤝 Contributing

**This is an open source project - contributions welcome!**

### 🐛 Found a Bug?
1. Check [existing issues](https://github.com/lovisodin/plugin-after-fal/issues)
2. Create a new issue with details
3. Include After Effects version, OS, and error messages

### 💡 Want to Add Features?
1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### 📝 Areas for Contribution:
- **Higher resolutions** (when fal.ai supports it)
- **Better error handling**
- **UI/UX improvements**
- **More AI models integration**
- **Performance optimizations**
- **Documentation improvements**

## 🔧 Development Setup

```bash
# Clone repository
git clone https://github.com/lovisodin/plugin-after-fal.git
cd plugin-after-fal/fal-inpainting-cep

# Install dependencies
npm install

# Build bundle
npm run build

# Install for development
./install-dev.sh  # macOS
# or
install-windows.bat  # Windows
```

### 📁 Project Structure
```
fal-inpainting-cep/
├── 📄 index.html          # Main UI interface
├── 📄 index.css           # Styling
├── 📁 jsx/                # ExtendScript files
│   └── main.jsx           # After Effects integration
├── 📁 js/                 # JavaScript modules
│   ├── main.js            # UI logic & API calls
│   └── fal-client-bundled.js  # Bundled FAL.ai client
├── 📁 src/                # Source files
│   └── fal-client-bundled.js  # FAL.ai client wrapper
├── 📁 CSXS/               # CEP configuration
│   └── manifest.xml       # Plugin manifest
└── 📄 webpack.config.js   # Build configuration
```

## 🌟 Show Your Support

- ⭐ **Star this repository** if it helped you
- 🍴 **Fork it** to contribute
- 📢 **Share it** with other video editors
- 💝 **Sponsor** the project (coming soon)

## 📈 Roadmap

### Coming Soon (When Possible):
- [ ] **Higher resolutions** (720p, 1080p) - waiting on fal.ai
- [ ] **Variable frame rates** support
- [ ] **Longer video** support (>81 frames)
- [ ] **Batch processing** multiple clips
- [ ] **Custom AI models** integration

### Maybe Future:
- [ ] **Real-time preview**
- [ ] **Multiple AI providers**
- [ ] **Advanced mask tools**
- [ ] **Video style transfer**

## 📊 Stats

![GitHub repo size](https://img.shields.io/github/repo-size/lovisodin/plugin-after-fal)
![GitHub code size](https://img.shields.io/github/languages/code-size/lovisodin/plugin-after-fal)
![GitHub issues](https://img.shields.io/github/issues/lovisodin/plugin-after-fal)
![GitHub pull requests](https://img.shields.io/github/issues-pr/lovisodin/plugin-after-fal)

## 📝 License

**MIT License** - Free to use, modify, and distribute!

See [LICENSE](LICENSE) file for details.

## 🙏 Credits & Thanks

- **AI Magic**: [fal.ai](https://fal.ai) and their incredible wan-vace model
- **Creator**: [Lovis Odin](https://github.com/lovisodin) 
- **Inspired by**: Adobe's slow AI integration timeline 😅
- **Community**: All the video editors who requested this!

## 📞 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/lovisodin/plugin-after-fal/issues)
- 💬 **Feature Requests**: [GitHub Discussions](https://github.com/lovisodin/plugin-after-fal/discussions)
- 🐦 **Updates**: [@lovisodin](https://twitter.com/lovisodin)
- 📧 **Business**: contact@lovisodin.com
- 💼 **LinkedIn**: [Lovis Odin](https://linkedin.com/in/lovisodin)

---

**Made with ❤️, caffeine, and a healthy dose of impatience with Adobe's AI roadmap**

*If this plugin saved you time/money, consider starring the repo! ⭐*