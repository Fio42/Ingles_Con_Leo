@echo off
cd /d "%~dp0"
echo Prueba: inspecciona 1 URL en Search Console SIN pulsar "Solicitar indexacion".
if "%~1"=="" (node indexador.js --prueba) else (node indexador.js --prueba --url %~1)
echo.
echo Cierra antes todas las ventanas de Chrome de login.bat. Guarda una captura en %LOCALAPPDATA%\InglesConLeo\indexador\capturas
pause
