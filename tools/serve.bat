@echo off
REM Start a local preview of the portfolio and open it in your browser.
REM Double-click this file, or run it from a terminal. Ctrl+C stops the server.

cd /d "%~dp0.."

echo Refreshing local preview data from db\seed.sql ...
python tools\make-preview-data.py

echo.
echo Serving http://localhost:5173  --  press Ctrl+C to stop
echo.

start "" http://localhost:5173
python -m http.server 5173
