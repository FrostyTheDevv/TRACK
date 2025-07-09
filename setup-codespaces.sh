#!/bin/bash

# Codespaces Browser Setup Script
# Run this in your Codespace to install Chrome dependencies

echo "🔧 Installing Chrome dependencies for Codespaces..."

# Update package list
sudo apt-get update

# Install Chrome dependencies
sudo apt-get install -y \
    libnss3-dev \
    libgconf-2-4 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libxrandr2 \
    libasound2-dev \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxfixes3 \
    libnss3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0

echo "✅ Chrome dependencies installed!"

# Install Chromium browser
sudo apt-get install -y chromium-browser

echo "🎉 Setup complete! You can now run your bot with web scraping support."