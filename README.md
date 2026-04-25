# Sistema de Incidencias de Producción

Aplicación web para capturar y visualizar incidencias diarias por línea de producción.

## Requisitos

- Python 3.10+
- Node.js 18+

## Inicio rápido

Haz doble clic en **`start.bat`** o ejecuta en la terminal:

```bat
cd C:\Users\SZKBYC\incidencias-app
start.bat
```

Abre el navegador en **http://localhost:5173**

---

## Áreas y Líneas configuradas

| Área       | Línea       | Líderes |
|------------|-------------|---------|
| Vestiduras | V1          | 9       |
| Vestiduras | V2          | 9       |
| Vestiduras | V3          | 6       |
| Vestiduras | V4          | 5       |
| Vestiduras | PUERTAS     | 8       |
| Vestiduras | IP          | 6       |
| Chasis     | Motores     | 8       |
| Chasis     | AGVs        | 8       |
| Chasis     | C1          | 8       |
| Chasis     | C2          | 8       |
| Chasis     | C3/LF       | 7       |
| Chasis     | Reparaciones| 5       |

## Tipos de incidencia

1. Falta Injustificada
2. Retardo
3. Permiso Sin Goce
4. Permiso Por Paternidad
5. Permiso por Defunción
6. Baja
7. Servicio Médico
8. Vacaciones
9. Sanciones
10. Incapacidad

## Vistas

- **`/supervisor`** – Captura diaria de incidencias por línea
- **`/gerente`** – Dashboard con gráficas y filtros históricos

## Estructura

```
incidencias-app/
  backend/
    main.py        # FastAPI + endpoints
    crud.py        # Operaciones de base de datos
    models.py      # Modelos SQLAlchemy
    database.py    # Configuración SQLite
    seed.py        # Datos iniciales
    requirements.txt
  frontend/
    src/
      pages/
        SupervisorPage.jsx
        ManagerPage.jsx
        HomePage.jsx
      components/
        NavBar.jsx
        DailyReport.jsx
    package.json
  start.bat
```
