# 🎬 AI Video Inpainting Plugin for After Effects

![Plugin Status](https://img.shields.io/badge/Status-Free%20&%20Working-green)

** AI-powered video inpainting plugin - Content Fill **

Remove or replace objects in videos using cutting-edge AI technology, directly in After Effects.

![Plugin Status](https://img.shields.io/badge/Status-Free%20&%20Working-green)
![After Effects](https://img.shields.io/badge/After_Effects-2020+-blue)
![AI Powered](https://img.shields.io/badge/AI-fal.ai-purple)

## ✨ Features

- 🎨 **AI Video Inpainting & Transformation**: Remove, replace, or completely transform objects in your videos.
- 🎭 **Two Powerful AI Models**: Choose between precise, mask-based inpainting or creative video-to-video transformation.
- 🚀 **Fast & Direct**: Powered by fal.ai and integrated directly into After Effects.
- ✨ **Free to Use**: No subscription, no hidden costs (API usage fees from fal.ai apply).
- 🔄 **Auto-Import**: Results are automatically added to your project.

## 🤖 AI Models

This plugin offers two distinct AI models to suit your creative needs:

1.  **Generative Fill (Inpaint)**
    -   **Model**: `wan-vace` (the original model)
    -   **How it works**: Uses a **mask and a text prompt**. It replaces only the masked area of your video based on your description.
    -   **Best for**: Removing objects, replacing specific items, or making targeted changes.

2.  **Video to Video**
    -   **Model**: `wan-vace-2-video-to-video`
    -   **How it works**: Uses **only a text prompt** to transform the *entire* video layer. It does not require a mask.
    -   **Best for**: Creative stylization, changing the entire scene, or generating completely new video content from a source video.



## 🚀 Quick Installation

### Easy Install (Recommended)

**macOS:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```batch
Right-click install-windows.bat → "Run as Administrator"
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

## 🔒 Permissions

For the plugin to work, you MUST enable a specific setting in After Effects:

1.  Go to `Preferences > Scripting & Expressions`
2.  Enable: `Allow Scripts to Write Files and Access Network`

**This is required for the plugin to save videos and connect to the AI service.**

## Requirements

- Adobe After Effects 2020 or later
- Internet connection
- FAL.ai API key (get it from [fal.ai](https://fal.ai))

## 🎯 How to Use

1. **Open the Plugin**
   - In After Effects, go to `Window > Extensions > Generative Fill Video - Lovis Odin`.
   - Paste your `FAL_KEY` into the API key field.

2. **Choose Your Model**
   - **For Generative Fill (Inpaint):**
     - Select a video layer.
     - Create a **mask** around the area you want to change.
     - Write a text prompt describing the change.
   - **For Video to Video:**
     - Select a video layer (no mask needed).
     - Write a text prompt describing the new scene you want to create.

3. **Generate!**
   - Click the "Generate" button and wait for the AI to process your video.
   - The result will be automatically imported into your project.

## 💡 Pro Tips

- **Save First** - Always save your composition before processing
- **Short & Sweet** - Keep videos under 240 frames for best results
- **Good Prompts** - Be specific: "red sports car" vs "car"
- **Clean Masks** - Smooth, precise masks = better results
- **Backup Plan** - Plugin shows download link if auto-download fails



**Plugin not showing in After Effects?**
- ✅ Check `Preferences > Scripting & Expressions > Allow Scripts to Write Files and Access Network` is ENABLED.
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
- ✅ Ensure composition is ≤240 frames at 24fps
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

**Made by Lovis Odin** 

 This plugin brings AI inpainting to After Effects using fal.ai's powerful wan-vace model.


## 📞 Support & Community


- 🐦 **Updates**: Follow [@odinlovis](https://twitter.com/odinlovis)
- 📧 **Business**: lovisodin@gmail.com

## 📄 License

**Free and Open** - Use it, modify it, share it! But credit my name always ! 

This plugin is free to use. The fal.ai API has its own terms of service.

---

**Made with ❤️ **

*Powered by [fal.ai](https://fal.ai) • Created by [Lovis Odin](https://lovis.io)*