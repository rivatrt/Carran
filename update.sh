#!/bin/bash

set -e

echo "Updating Carren AI Clone..."

# Pull latest changes
if [ -d ".git" ]; then
    echo "Pulling latest changes from git..."
    git pull
else
    echo "Not a git repository. Skipping git pull."
fi

# Activate venv
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Virtual environment not found. Please run install.sh first."
    exit 1
fi

# Update dependencies
echo "Updating dependencies..."
pip install -r requirements.txt

# Rebuild frontend if needed
echo "Rebuilding frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Update complete! Please restart the agent with ./start.sh"
