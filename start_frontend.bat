@echo off
echo ===================================================
echo Starting GeoVision AI Frontend Server (Vite React)...
echo ===================================================
cd frontend
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
)
call npm run dev
