#!/bin/bash

echo "=== FAL Inpainting Plugin - Diagnostic ==="

# 1. Vérifier le mode debug
echo "1. Checking debug mode..."
for version in 9 10 11 12; do
    result=$(defaults read com.adobe.CSXS.$version PlayerDebugMode 2>/dev/null || echo "not set")
    echo "  CSXS.$version PlayerDebugMode: $result"
done

# 2. Vérifier l'installation du plugin
echo ""
echo "2. Checking plugin installation..."
PLUGIN_PATH="/Library/Application Support/Adobe/CEP/extensions/com.fal.inpainting"
if [ -d "$PLUGIN_PATH" ]; then
    echo "  ✅ Plugin directory exists"
    echo "  Files:"
    ls -la "$PLUGIN_PATH" | head -10
else
    echo "  ❌ Plugin directory NOT found"
fi

# 3. Vérifier le manifest
echo ""
echo "3. Checking manifest..."
MANIFEST_PATH="$PLUGIN_PATH/CSXS/manifest.xml"
if [ -f "$MANIFEST_PATH" ]; then
    echo "  ✅ Manifest exists"
    echo "  Extension ID:"
    grep "ExtensionBundleId" "$MANIFEST_PATH" || echo "  ❌ No ExtensionBundleId found"
else
    echo "  ❌ Manifest NOT found"
fi

# 4. Vérifier les fichiers principaux
echo ""
echo "4. Checking main files..."
for file in "index-test.html" "js/libs/CSInterface.js" "js/main-simple.js" "jsx/main-simple.jsx"; do
    if [ -f "$PLUGIN_PATH/$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
    fi
done

# 5. Réinstaller si nécessaire
echo ""
echo "5. Reinstalling plugin..."
sudo rm -rf "$PLUGIN_PATH"
sudo ln -sf "$PWD/fal-inpainting-cep" "$PLUGIN_PATH"
echo "  ✅ Plugin reinstalled"

echo ""
echo "=== Diagnostic Complete ==="
echo "Now restart After Effects and check Window > Extensions > FAL Inpainting"