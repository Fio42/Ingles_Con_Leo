@echo off
cd /d "%~dp0..\.."
echo Iniciando la vista previa local en http://localhost:8765 ...
node tools\preview\servidor-preview.js
if errorlevel 1 echo No se pudo iniciar. Hace falta Node.js instalado.
pause
