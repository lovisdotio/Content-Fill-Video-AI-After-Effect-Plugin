# 🎬 AI Video Inpainting Plugin for After Effects

**FREE AI-powered video inpainting plugin - Because Adobe was taking too long! 🤷‍♂️**

Remove or replace objects in videos using cutting-edge AI technology, directly in After Effects.

![Plugin Status](https://img.shields.io/badge/Status-Free%20&%20Working-green)
![After Effects](https://img.shields.io/badge/After_Effects-2020+-blue)
![AI Powered](https://img.shields.io/badge/AI-fal.ai-purple)

## ✨ Features

- 🎨 **AI Video Inpainting**: Remove or replace objects in videos using AI
- 🎭 **Mask-Based**: Uses After Effects masks for precise control
- 🚀 **Fast Processing**: Powered by fal.ai's wan-vace model
- 🎬 **Direct Integration**: Works as a native After Effects panel
- ✨ **Open Source & Free Plugin**: The plugin is free, but the AI service has a small fee.
- 💸 **Affordable AI**: Each video generation costs approximately $0.20, charged by the fal.ai service.
- 🔄 **Auto-Import**: Results automatically added to your project

## ⚠️ Current Limitations (But Hey, It's Free!)

- **480p Output** - Limited by fal.ai technical constraints for now
- **24 FPS Only** - Other frame rates not supported yet  
- **81 Frames Max** - About 3.4 seconds at 24fps
- **Save Your Work** - Always backup your composition before processing!

## 🚀 Quick Installation

### Easy Install (Recommended)

**macOS:**
```bash
# Make the script executable, then run it
chmod +x install.sh
./install.sh
```

**Windows:**
> **Important**: You must run the installer as an administrator.
```batch
# Right-click the .bat file and select "Run as administrator"
install-windows.bat
```

### Manual Installation

**macOS:**
```bash
# Enable CEP Debug Mode
defaults write com.adobe.CSXS.12 PlayerDebugMode 1

# Copy plugin
sudo cp -r fal-inpainting-cep "/Library/Application Support/Adobe/CEP/extensions/com.lovisodin.generativefill"
```

**Windows:**
```batch
REM Run PowerShell as Administrator
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.12" -Name "PlayerDebugMode" -Value "1"

REM Copy plugin to:
C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\
```

Then restart After Effects!

## Requirements

- Adobe After Effects 2020 or later
- Internet connection
- FAL.ai API key (get it from [fal.ai](https://fal.ai))

## 🎯 How to Use

1. **Get Your API Key**
   - Sign up at [fal.ai](https://fal.ai) (free credits included!)
   - Copy your API key from the dashboard

2. **In After Effects:**
   - Open: `Window > Extensions > Generative Fill Video - Lovis Odin`
   - Paste your API key in the plugin
   - Select a video layer with a mask
   - Write a descriptive prompt (e.g., "remove the person", "replace with a cat")
   - Click "Generate Video"

3. **Wait for Magic** ✨
   - Processing takes 2-5 minutes
   - Progress updates in real-time
   - Result automatically imports to your project
   - If download fails, you get a manual download link

## 💡 Pro Tips

- **Save First** - Always save your composition before processing
- **Short & Sweet** - Keep videos under 81 frames for best results
- **Good Prompts** - Be specific: "red sports car" vs "car"
- **Clean Masks** - Smooth, precise masks = better results
- **Backup Plan** - Plugin shows download link if auto-download fails

## ⚠️ Important Warnings (In the Plugin)

The plugin now displays these warnings prominently:
- ⚠️ **SAVE YOUR COMPOSITION** before processing  
- ⚠️ **24 FPS ONLY** - Other frame rates not supported
- ⚠️ **81 FRAMES MAX** - Longer videos will be truncated  
- ⚠️ **480p OUTPUT** - Limited by current API constraints

## 🐛 Troubleshooting

**Plugin not showing in After Effects?**
- ✅ Check CEP debug mode is enabled (run install script again)
- ✅ Restart After Effects completely
- ✅ Verify plugin is in extensions folder
- ✅ Try: `Window > Extensions > Generative Fill Video - Lovis Odin`

**"No masks" error?**
- ✅ Select a layer with at least one mask
- ✅ Make sure the mask is enabled (not just created)
- ✅ Try drawing a simple rectangle mask first

**Download fails?**
- ✅ Check internet connection
- ✅ Use the manual download link from the popup
- ✅ Check file/folder permissions on your system

**Processing stuck or fails?**
- ✅ Verify your FAL.ai API key and credits
- ✅ Ensure composition is ≤81 frames at 24fps
- ✅ Try a simpler, clearer prompt
- ✅ Save project and restart After Effects

## 🔧 For Developers

Want to build from source or contribute?

```bash
# Clone and setup
git clone [your-repo]
cd fal-inpainting-cep
npm install
npm run build

# Install for development  
./install-dev.sh  # macOS
```

Project structure:
- `jsx/main.jsx` - ExtendScript logic
- `js/main.js` - UI and API integration  
- `src/fal-client-bundled.js` - FAL.ai client wrapper
- `index.html` - Main interface

## 🙋‍♂️ About

**Made by Lovis Odin** because Adobe was taking forever to add AI video tools! 😅

Sometimes when you need something done, you just build it yourself. This plugin brings cutting-edge AI inpainting to After Effects using fal.ai's powerful wan-vace model.

**Why I built this:**
- Adobe's AI roadmap was too slow
- Video editors need AI tools NOW  
- Wanted to democratize access to AI video tech
- Because why not? 🤷‍♂️

## 📞 Support & Community

- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/your-repo/issues)
- 💬 **Questions**: Create a GitHub discussion
- 🐦 **Updates**: Follow [@lovisodin](https://twitter.com/lovisodin)
- 📧 **Business**: contact@lovisodin.com

## 📄 License

**Free and Open** - Use it, modify it, share it!

This plugin is free to use. The fal.ai API has its own terms of service.

---

**Made with ❤️ and a healthy dose of impatience with Adobe's AI timeline**

*Powered by [fal.ai](https://fal.ai) • Created by [Lovis Odin](https://lovisodin.com)*