#!/bin/bash

echo "Installing Manus AI Clone for Termux..."

# Update packages
pkg update -y && pkg upgrade -y

# Install dependencies
pkg install -y python nodejs-lts git

# Install python packages
pip install -r requirements.txt

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
