@echo off
cd /d "%~dp0"
node indexador.js --estado
echo.
echo Registro completo (se abre en Excel): %LOCALAPPDATA%\InglesConLeo\indexador\registro.csv
pause
