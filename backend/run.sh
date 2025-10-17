#!/bin/bash

# Run backend server from correct directory
cd "$(dirname "$0")/.."
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
cd backend
python -m uvicorn app.main:app --reload --port 8000
