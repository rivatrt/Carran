#!/bin/bash

echo "Starting Manus AI Clone..."

if [ -d "venv" ]; then
    source venv/bin/activate
fi

export PYTHONPATH=$PYTHONPATH:.
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
