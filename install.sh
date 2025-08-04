#!/bin/bash

echo "=== Generative Fill Video - Installation ==="
echo "Created by Lovis Odin"
echo ""

# Enable CEP debug mode
echo "Enabling CEP Debug Mode..."
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1

echo "✅ Debug mode enabled!"

# Create symlink to CEP extensions folder
PLUGIN_DIR="$PWD"
CEP_DIR="/Library/Application Support/Adobe/CEP/extensions"
PLUGIN_NAME="com.lovisodin.generativefill"

echo "Installing plugin..."
sudo mkdir -p "$CEP_DIR"

# Remove old installations
sudo rm -rf "$CEP_DIR/com.fal.inpainting"
sudo rm -rf "$CEP_DIR/com.fal.test"
sudo rm -rf "$CEP_DIR/$PLUGIN_NAME"

# Create new symlink
sudo ln -sf "$PLUGIN_DIR" "$CEP_DIR/$PLUGIN_NAME"

echo "✅ Plugin installed successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Restart After Effects"
echo "2. Go to Window > Extensions > 'Generative Fill Video - Lovis Odin'"
echo "3. Get your FAL.ai API key from https://fal.ai"
echo "4. Start creating amazing AI-powered videos!"
echo ""
echo "Created with ❤️ by Lovis Odin"