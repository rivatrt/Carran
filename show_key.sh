#!/bin/bash
if [ -f "data/api_key.txt" ]; then
    echo "=================================================="
    echo "  YOUR CARREN AI API KEY IS:"
    cat data/api_key.txt
    echo ""
    echo "  Use this key to log in to the Web UI."
    echo "=================================================="
else
    echo "API Key file not found. Please start the server first with ./start.sh"
fi
