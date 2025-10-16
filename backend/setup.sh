#!/bin/bash
# Setup script for EdTech Diagnostic Backend

set -e  # Exit on error

echo "================================================"
echo "EdTech Diagnostic Backend - Setup"
echo "================================================"

# Check Python version
echo -e "\n[1/5] Checking Python version..."
python3 --version

# Create virtual environment
echo -e "\n[2/5] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo -e "\n[3/5] Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo -e "\n[4/5] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Check .env file
echo -e "\n[5/5] Checking configuration..."
if [ ! -f ".env" ]; then
    echo "⚠ Warning: .env file not found"
    echo "  Creating .env from .env.example..."
    cp .env.example .env
    echo "  Please edit .env with your Supabase and Anthropic credentials"
else
    echo "✓ .env file found"
fi

echo -e "\n================================================"
echo "Setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Supabase and Anthropic API keys"
echo "  2. Run database migration (see README.md)"
echo "  3. Test with: python test_topic_parser.py"
echo ""
echo "To activate virtual environment:"
echo "  source venv/bin/activate"
echo ""
