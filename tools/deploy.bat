@echo off
REM Commit everything and push to GitHub, which triggers a Vercel deploy.
REM Double-click this file, or run it from a terminal.

cd /d "%~dp0.."

echo Project: %CD%
echo.
echo ---------------- changes to be published ----------------
git status --short
echo ---------------------------------------------------------
echo.

set "MSG=Update site"
set /p "MSG=Commit message [%MSG%]: "

git add -A
git commit -m "%MSG%"

if errorlevel 1 (
    echo.
    echo Nothing to commit, or the commit failed. Read the message above.
    echo.
    pause
    exit /b 1
)

git push

if errorlevel 1 (
    echo.
    echo Push failed. Common causes:
    echo   - not signed in to GitHub yet ^(a browser window may have opened^)
    echo   - no internet connection
    echo.
    pause
    exit /b 1
)

echo.
echo Pushed. Vercel will redeploy in about a minute:
echo   https://karthikeyans.vercel.app
echo.
pause
