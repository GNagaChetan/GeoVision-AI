@echo off
echo ===================================================
echo Starting GeoVision AI Backend Server (FastAPI)...
echo ===================================================
cd backend
if not exist .venv (
    echo Creating Python virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate
)
python -m uvicorn main:app --reload --port 8000
