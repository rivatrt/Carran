#!/bin/bash

set -e # Stop on error

echo "Installing Carran AI Clone for Termux..."

# Update packages
pkg update -y && pkg upgrade -y

# Install dependencies (Added chromium per instructions)
pkg install -y python nodejs git chromium

# Install Python requirements for search and web tools
pkg install -y libxml2 libxslt # for lxml/beautifulsoup

# Create virtual environment
echo "Setting up virtual environment..."
rm -rf venv # Clean start
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install python packages
echo "Installing Python dependencies (Fixed versions for Termux)..."
pip install -r requirements.txt
pip install playwright
# We DO NOT run playwright install chromium here as it downloads incompatible binaries
# Instead we use the native Termux chromium package installed via pkg

# Setup Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# Create data directory
mkdir -p data

echo "Installation complete!"
echo "------------------------------------------------"
echo "READ THE GUIDE: Open GUIDE.txt for instructions."
echo "------------------------------------------------"
echo "To start the agent, run: ./start.sh"
echo "On first run, check the console for your generated API Key."
echo "------------------------------------------------"
