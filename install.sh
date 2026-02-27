#!/bin/bash

echo "Installing Manus AI Clone for Termux..."

# Update packages
pkg update -y && pkg upgrade -y

# Install dependencies
pkg install -y python nodejs-lts

# Install python packages
pip install -r requirements.txt

echo "Installation complete!"
echo "To start the agent, run: ./start.sh"
