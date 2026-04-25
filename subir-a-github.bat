@echo off
cd /d C:\Users\SZKBYC\incidencias-app

echo Verificando git...
git --version
if errorlevel 1 (
    echo ERROR: Git no esta instalado.
    pause
    exit /b
)

git init
git add .
git commit -m "Sistema de Incidencias GM" 2>nul || echo (sin cambios nuevos, continuando...)

echo.
echo Conectando con GitHub (cuenta personal)...
git branch -M main
git remote remove personal 2>nul
git remote add personal https://github.com/jlopezj24-prog/incidencias-app.git
git push -u personal main

echo.
echo listo! Codigo subido a GitHub.
echo Ahora ve a https://render.com para desplegar.
pause
