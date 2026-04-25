@echo off
cd /d C:\Users\SZKBYC\incidencias-app

echo Instalando Railway CLI...
"C:\Program Files\nodejs\npm.cmd" install -g @railway/cli
if errorlevel 1 (
    echo ERROR instalando Railway CLI
    pause
    exit /b
)

echo.
echo Iniciando sesion en Railway...
echo (Se abrira el navegador para autorizar)
railway login --browserless

echo.
pause
