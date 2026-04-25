@echo off
cd /d C:\Users\SZKBYC\incidencias-app

echo Inicializando repositorio git...
git --version
if errorlevel 1 (
    echo ERROR: Git no esta instalado.
    echo Descargalo en https://git-scm.com/download/win
    pause
    exit /b
)

git init
git add .
git commit -m "Sistema de Incidencias GM"

echo Conectando con GitHub...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/SZKBYC_gme/incidencias-app.git
git push -u origin main

echo.
echo listo! Codigo subido a GitHub.
echo Ahora ve a https://render.com para desplegar.
pause
