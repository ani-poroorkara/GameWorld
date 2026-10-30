@echo off
cd /d "%~dp0"
echo Opening MyWorld Studio at http://127.0.0.1:4180/
start "" "http://127.0.0.1:4180/"
node server.cjs
pause
