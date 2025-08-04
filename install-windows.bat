@echo off
echo ======================================================
echo 🚀 AI Video Inpainting Plugin for After Effects
echo ======================================================
echo Created by Lovis Odin
echo.
echo 🚀 Installation starting...

set "PLUGIN_NAME=com.lovisodin.generativefill"
set "CEP_DIR=%ProgramFiles(x86)%\Common Files\Adobe\CEP\extensions"
set "PLUGIN_DIR=%~dp0"

echo 🔓 Enabling CEP Debug Mode...
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

if %ERRORLEVEL% neq 0 (
    echo ❌ Could not enable debug mode. Please run as Administrator.
    pause
    exit /b 1
)

echo ✅ Debug mode enabled!

echo 📦 Installing plugin...

REM Create CEP extensions directory if it doesn't exist
if not exist "%CEP_DIR%" (
    mkdir "%CEP_DIR%"
)

REM Remove old installations
if exist "%CEP_DIR%\com.fal.inpainting" (
    rmdir /s /q "%CEP_DIR%\com.fal.inpainting"
)
if exist "%CEP_DIR%\com.fal.test" (
    rmdir /s /q "%CEP_DIR%\com.fal.test"
)
if exist "%CEP_DIR%\%PLUGIN_NAME%" (
    rmdir /s /q "%CEP_DIR%\%PLUGIN_NAME%"
)

REM Copy plugin files
xcopy "%PLUGIN_DIR%" "%CEP_DIR%\%PLUGIN_NAME%\" /E /I /Y >nul

if %ERRORLEVEL% neq 0 (
    echo ❌ Installation failed. Please run as Administrator.
    pause
    exit /b 1
)

echo ✅ Plugin installed successfully!
echo.
echo 🚀 Next steps:
echo 1. Restart After Effects
echo 2. Go to Window ^> Extensions ^> 'Generative Fill Video - Lovis Odin'
echo 3. Get your FAL.ai API key from https://fal.ai
echo 4. Start creating amazing AI-powered videos!
echo.
echo Created with ❤️ by Lovis Odin
echo.
pause