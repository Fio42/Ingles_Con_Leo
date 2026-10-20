@echo off
cd /d "%~dp0"
if not exist "%LOCALAPPDATA%\InglesConLeo\indexador" mkdir "%LOCALAPPDATA%\InglesConLeo\indexador"
node indexador.js >> "%LOCALAPPDATA%\InglesConLeo\indexador\salida.log" 2>&1
exit /b %errorlevel%
