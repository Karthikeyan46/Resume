@echo off
title Academic & Certificate Portfolio Vault
cd /d "%~dp0"

echo ======================================================================
echo  Prof. Karthikeyan S. - Academic & Certificate Portfolio Vault
echo  SQLite Database + Document Storage + Printable CV Generator
echo ======================================================================
echo.

:: Check python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

:: Launch browser in 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5050"

:: Start the Flask app
echo [INFO] Starting Vault server on http://127.0.0.1:5050 ...
set PORT=5050
python app.py

pause
