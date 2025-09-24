#!/bin/bash

echo "Installing Tauri build dependencies for Linux..."
echo "This script will install all required packages for building Tauri applications"
echo ""

# Update package lists
echo "Updating package lists..."
sudo apt-get update

# Install essential build tools
echo ""
echo "Installing essential build tools..."
sudo apt-get install -y \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    pkg-config

# Install GTK and WebKit development libraries
echo ""
echo "Installing GTK and WebKit libraries..."
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libwebkit2gtk-4.0-dev

# Install additional required libraries
echo ""
echo "Installing additional libraries..."
sudo apt-get install -y \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libsoup-3.0-dev \
    libjavascriptcoregtk-4.1-dev \
    libglib2.0-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libatk1.0-dev \
    libgdk-pixbuf2.0-dev

# Install optional but recommended tools
echo ""
echo "Installing optional tools..."
sudo apt-get install -y \
    patchelf

echo ""
echo "✅ All dependencies have been installed!"
echo "You can now run: npm run tauri:build"