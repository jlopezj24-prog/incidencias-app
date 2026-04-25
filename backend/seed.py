"""
Run once to populate the database with areas, lines and leader counts.
Usage: python seed.py
"""
from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()

    if db.query(models.Area).count() > 0:
        print("La base de datos ya tiene datos. Nada que hacer.")
        db.close()
        return

    # ── Áreas ────────────────────────────────────────────────────────────────
    vestiduras = models.Area(nombre="Vestiduras")
    chasis = models.Area(nombre="Chasis")
    db.add_all([vestiduras, chasis])
    db.flush()

    # ── Líneas Vestiduras ────────────────────────────────────────────────────
    lineas_vestiduras = [
        models.Linea(area_id=vestiduras.id, nombre="V1",     total_lideres=9),
        models.Linea(area_id=vestiduras.id, nombre="V2",     total_lideres=9),
        models.Linea(area_id=vestiduras.id, nombre="V3",     total_lideres=6),
        models.Linea(area_id=vestiduras.id, nombre="V4",     total_lideres=5),
        models.Linea(area_id=vestiduras.id, nombre="PUERTAS",total_lideres=8),
        models.Linea(area_id=vestiduras.id, nombre="IP",     total_lideres=6),
    ]

    # ── Líneas Chasis ────────────────────────────────────────────────────────
    lineas_chasis = [
        models.Linea(area_id=chasis.id, nombre="Motores",     total_lideres=8),
        models.Linea(area_id=chasis.id, nombre="AGVs",        total_lideres=8),
        models.Linea(area_id=chasis.id, nombre="C1",          total_lideres=8),
        models.Linea(area_id=chasis.id, nombre="C2",          total_lideres=8),
        models.Linea(area_id=chasis.id, nombre="C3/LF",       total_lideres=7),
        models.Linea(area_id=chasis.id, nombre="Reparaciones",total_lideres=5),
    ]

    db.add_all(lineas_vestiduras + lineas_chasis)
    db.commit()
    print("Base de datos inicializada correctamente.")
    db.close()


if __name__ == "__main__":
    seed()
