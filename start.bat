@echo off
title Dragon Fruit Grader
cd /d "%~dp0"
echo Starting Dragon Fruit Grader local server...

REM Check if agy-node or node is available
where agy-node >nul 2>nul
if %errorlevel%==0 (
    start http://localhost:3000
    agy-node server.js
    goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
    start http://localhost:3000
    node server.js
    goto :eof
)

REM Fallback if node is not found, launch directly in browser
echo Node.js not detected in PATH. Opening index.html directly...
start "" "%~dp0index.html"
