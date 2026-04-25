from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date as date_type, timedelta
import models
import crud
import pathlib
import os
from database import engine, get_db, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Incidencias de Producción")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed DB on startup
@app.on_event("startup")
async def startup_event():
    # Run migrations first
    with engine.connect() as conn:
        try:
            conn.execute(__import__('sqlalchemy').text(
                "ALTER TABLE reportes_diarios ADD COLUMN tripulacion VARCHAR DEFAULT 'A'"
            ))
            conn.commit()
        except Exception:
            pass  # Column already exists
    from seed import seed
    seed()


# ── Schemas ────────────────────────────────────────────────────────────────────

class IncidenciaIn(BaseModel):
    tipo: str
    cantidad: int
    notas: Optional[str] = None


class ReporteIn(BaseModel):
    linea_id: int
    fecha: date_type
    tripulacion: str = "A"
    lideres_presentes: int
    incidencias: List[IncidenciaIn]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _serialize_reporte(reporte, linea):
    return {
        "id": reporte.id,
        "linea_id": reporte.linea_id,
        "linea_nombre": linea.nombre,
        "area_nombre": linea.area.nombre,
        "fecha": reporte.fecha.isoformat(),
        "tripulacion": reporte.tripulacion,
        "lideres_presentes": reporte.lideres_presentes,
        "total_lideres": linea.total_lideres,
        "incidencias": [
            {"id": i.id, "tipo": i.tipo, "cantidad": i.cantidad, "notas": i.notas}
            for i in reporte.incidencias
        ],
        "creado_en": reporte.creado_en.isoformat(),
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/api/areas")
def get_areas(db: Session = Depends(get_db)):
    areas = crud.get_areas(db)
    return [
        {
            "id": a.id,
            "nombre": a.nombre,
            "lineas": [
                {"id": l.id, "nombre": l.nombre, "total_lideres": l.total_lideres}
                for l in a.lineas
            ],
        }
        for a in areas
    ]


@app.get("/api/lineas")
def get_lineas(area_id: Optional[int] = None, db: Session = Depends(get_db)):
    lineas = crud.get_lineas(db, area_id)
    return [
        {
            "id": l.id,
            "nombre": l.nombre,
            "total_lideres": l.total_lideres,
            "area_id": l.area_id,
            "area_nombre": l.area.nombre,
        }
        for l in lineas
    ]


@app.get("/api/lineas/{linea_id}")
def get_linea(linea_id: int, db: Session = Depends(get_db)):
    linea = crud.get_linea(db, linea_id)
    if not linea:
        raise HTTPException(status_code=404, detail="Línea no encontrada")
    return {
        "id": linea.id,
        "nombre": linea.nombre,
        "total_lideres": linea.total_lideres,
        "area_id": linea.area_id,
        "area_nombre": linea.area.nombre,
    }


@app.post("/api/reportes", status_code=201)
def create_reporte(data: ReporteIn, db: Session = Depends(get_db)):
    linea = crud.get_linea(db, data.linea_id)
    if not linea:
        raise HTTPException(status_code=404, detail="Línea no encontrada")
    inc_list = [i.model_dump() for i in data.incidencias]
    reporte = crud.upsert_reporte(db, data.linea_id, data.fecha, data.tripulacion, data.lideres_presentes, inc_list)
    # Re-fetch linea with area after commit
    linea = crud.get_linea(db, data.linea_id)
    reporte = crud.get_reporte(db, data.linea_id, data.fecha)
    return _serialize_reporte(reporte, linea)


@app.get("/api/reportes")
def get_reporte(linea_id: int, fecha: date_type, tripulacion: str = "A", db: Session = Depends(get_db)):
    reporte = crud.get_reporte(db, linea_id, fecha, tripulacion)
    if not reporte:
        return None
    linea = crud.get_linea(db, linea_id)
    return _serialize_reporte(reporte, linea)


@app.get("/api/estado-dia")
def get_estado_dia(fecha: date_type, tripulacion: str = "A", db: Session = Depends(get_db)):
    """Devuelve todas las líneas con su estado de carga para una fecha y tripulación dada."""
    lineas = crud.get_lineas(db)
    reportes = {
        r.linea_id: r
        for r in db.query(models.ReporteDiario)
        .options(__import__('sqlalchemy.orm', fromlist=['joinedload']).joinedload(models.ReporteDiario.incidencias))
        .filter(models.ReporteDiario.fecha == fecha, models.ReporteDiario.tripulacion == tripulacion)
        .all()
    }
    resultado = []
    for linea in lineas:
        reporte = reportes.get(linea.id)
        resultado.append({
            "linea_id": linea.id,
            "linea": linea.nombre,
            "area": linea.area.nombre,
            "cargado": reporte is not None,
            "lideres_presentes": reporte.lideres_presentes if reporte else None,
            "total_lideres": linea.total_lideres,
            "total_incidencias": sum(i.cantidad for i in reporte.incidencias) if reporte else None,
            "hora_carga": reporte.creado_en.strftime("%H:%M") if reporte else None,
        })
    total = len(resultado)
    cargados = sum(1 for r in resultado if r["cargado"])
    return {
        "fecha": str(fecha),
        "resumen": {"cargados": cargados, "pendientes": total - cargados, "total": total},
        "lineas": resultado,
    }



@app.get("/api/dashboard")
def get_dashboard(
    area_id: Optional[int] = None,
    linea_id: Optional[int] = None,
    tripulacion: Optional[str] = Query(default=None),
    fecha_inicio: Optional[date_type] = Query(default=None),
    fecha_fin: Optional[date_type] = Query(default=None),
    db: Session = Depends(get_db),
):
    today = date_type.today()
    if not fecha_inicio:
        fecha_inicio = today.replace(day=1)
    if not fecha_fin:
        fecha_fin = today
    return crud.get_dashboard_data(db, area_id, linea_id, tripulacion, fecha_inicio, fecha_fin)


# ── Serve React frontend (production build) ────────────────────────────────────

STATIC_DIR = pathlib.Path(__file__).parent / "static"

if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")
    app.mount("/static-files", StaticFiles(directory=str(STATIC_DIR)), name="static-files")

    @app.get("/")
    async def serve_root():
        return FileResponse(str(STATIC_DIR / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
