@echo off
cd /d "%~dp0"
echo Instalando el robot (solo la primera vez)...
call npm install --omit=dev --no-audit --no-fund
if errorlevel 1 (echo FALLO la instalacion. Comprueba que Node.js esta instalado: node -v & pause & exit /b 1)
echo.
echo Listo. Siguiente paso: login.bat
pause
