#!/bin/bash

echo "🧹 Preparing project for GitHub..."

# Remove node_modules and rebuild
echo "📦 Cleaning and rebuilding..."
rm -rf node_modules/
rm -f package-lock.json
npm install
npm run build

# Remove system files
echo "🗑️ Removing system files..."
find . -name ".DS_Store" -type f -delete
find . -name "._*" -type f -delete

# Create clean directory structure
echo "📁 Organizing files..."

# Create dist folder with ready-to-use plugin
if [ ! -d "dist" ]; then
    mkdir dist
fi

# Copy essential files to dist
cp -r CSXS dist/
cp -r js dist/
cp -r jsx dist/
cp -r icons dist/
cp index.html dist/
cp index.css dist/
cp README-GITHUB.md dist/README.md

echo "✅ Project ready for GitHub!"
echo ""
echo "📋 What to share:"
echo "✅ dist/ folder - Ready-to-use plugin"
echo "✅ src/ - Source files"
echo "✅ package.json - Dependencies"
echo "✅ webpack.config.js - Build configuration"
echo "✅ install scripts - Installation helpers"
echo ""
echo "❌ Don't include:"
echo "❌ node_modules/ (excluded by .gitignore)"
echo "❌ .DS_Store files (excluded by .gitignore)"
echo "❌ package-lock.json (let users generate their own)"
echo ""
echo "🚀 Ready to push to GitHub!"