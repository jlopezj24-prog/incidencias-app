"""
Lanzador de la aplicacion de Incidencias.
Doble clic en start.py o ejecutar: python start.py
"""
import subprocess
import sys
import os

BASE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(BASE, "backend")
FRONTEND = os.path.join(BASE, "frontend")

PYTHON = sys.executable
NPM = r"C:\Program Files\nodejs\npm.cmd"

# Fallback: buscar npm en PATH
if not os.path.exists(NPM):
    import shutil
    npm_in_path = shutil.which("npm")
    if npm_in_path:
        NPM = npm_in_path
    else:
        print("ERROR: No se encontro npm.")
        print("Instala Node.js desde https://nodejs.org")
        input("Presiona ENTER para cerrar...")
        sys.exit(1)

print("=" * 48)
print("  Sistema de Incidencias de Produccion")
print("=" * 48)
print(f"Python : {PYTHON}")
print(f"npm    : {NPM}")
print()

# 1. Instalar dependencias Python
print("[1/4] Instalando dependencias Python...")
subprocess.run([PYTHON, "-m", "pip", "install", "-r", "requirements.txt", "-q"], cwd=BACKEND, check=True)

# 2. Inicializar BD
print("[2/4] Inicializando base de datos...")
subprocess.run([PYTHON, "seed.py"], cwd=BACKEND, check=True)

# 3. Instalar dependencias frontend
print("[3/4] Instalando dependencias frontend (puede tardar 1-2 minutos la primera vez)...")
subprocess.run([NPM, "install"], cwd=FRONTEND, check=True)

# 4. Lanzar backend y frontend en ventanas separadas
print("[4/4] Iniciando servidores...")
subprocess.Popen(
    f'start "Backend-FastAPI" cmd /k "{PYTHON} -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"',
    cwd=BACKEND, shell=True
)
subprocess.Popen(
    f'start "Frontend-React" cmd /k "{NPM}" run dev -- --host',
    cwd=FRONTEND, shell=True
)

print()
print("=" * 48)
print("  LISTO - Abre tu navegador en:")
print("  http://localhost:5173")
print()
print("  (Espera 5-10 segundos a que cargue)")
print("=" * 48)
input("\nPresiona ENTER para cerrar este mensaje...")
