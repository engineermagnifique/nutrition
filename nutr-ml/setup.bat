@echo off
echo =======================================
echo  NutritionX ML Environment Setup
echo =======================================

:: Create virtual environment
echo [1/4] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create venv. Is Python installed?
    exit /b 1
)

:: Activate
echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

:: Upgrade pip
echo [3/4] Upgrading pip...
python -m pip install --upgrade pip

:: Install dependencies
echo [4/4] Installing dependencies...
echo.
echo NOTE: PyTorch install depends on your hardware.
echo       CPU-only (no GPU): install as-is
echo       NVIDIA GPU: visit https://pytorch.org to get the correct install command
echo.

python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
if errorlevel 1 (
    echo WARNING: PyTorch CPU install failed. Try manually from https://pytorch.org
)

python -m pip install -r requirements-dev.txt
if errorlevel 1 (
    echo ERROR: Failed to install requirements.
    exit /b 1
)

:: Copy env file
if not exist .env (
    copy .env.example .env
    echo .env file created from template.
)

echo.
echo =======================================
echo  Setup complete!
echo  Activate venv: venv\Scripts\activate
echo  Start API:     uvicorn api.serve:app --port 8001
echo  Train food model:  python models\food_classifier\train.py
echo  Train recommender: python models\recommender\train.py
echo =======================================
