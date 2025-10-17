# Starting the Backend Server

## Quick Start

From the `backend` directory, run:

```bash
# Option 1: Using uvicorn module (recommended)
python -m uvicorn app.main:app --reload --port 8000

# Option 2: Using the run script
./run.sh
```

## The Issue

When you run `python app/main.py`, Python looks for the `app` module in the current directory. Since you're already inside the `backend` folder, it can't find `app.config`.

## Solutions

### ✅ Solution 1: Use uvicorn as a module (BEST)
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

This tells Python to:
- Look for the `app` package in the current directory
- Load `main.py` from that package
- Run the FastAPI `app` instance

### ✅ Solution 2: Set PYTHONPATH
```bash
cd backend
PYTHONPATH=. python -m uvicorn app.main:app --reload
```

### ✅ Solution 3: Run from parent directory
```bash
# From reTeach directory (parent of backend)
cd ..
python -m uvicorn backend.app.main:app --reload
```

## Verify It's Working

1. Server should start without errors
2. Visit http://localhost:8000 - should see welcome message
3. Visit http://localhost:8000/docs - should see API documentation
4. Visit http://localhost:8000/health - should see health check

## Common Errors

**Error: `ModuleNotFoundError: No module named 'app.config'`**
- You're running from wrong directory
- Use `python -m uvicorn` instead of `python app/main.py`

**Error: `port already in use`**
- Another process is using port 8000
- Kill it: `lsof -ti:8000 | xargs kill -9`
- Or use different port: `--port 8001`

**Error: `No module named 'uvicorn'`**
- Virtual environment not activated
- Run: `source venv/bin/activate` first

## Full Startup Sequence

```bash
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies (first time only)
pip install -r requirements.txt

# 4. Start server
python -m uvicorn app.main:app --reload --port 8000
```

Server will be available at: **http://localhost:8000**
