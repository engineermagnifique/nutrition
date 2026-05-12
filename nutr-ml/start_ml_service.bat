@echo off
echo Starting NutritionX ML Microservice on port 8001...
cd /d "%~dp0"
call venv\Scripts\activate.bat
uvicorn api.serve:app --host 0.0.0.0 --port 8001 --reload
