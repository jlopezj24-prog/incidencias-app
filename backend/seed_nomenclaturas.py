"""
Puebla la tabla nomenclatura_mapa con los patrones de texto del archivo Excel
de Numérico y su correspondencia a líneas de la app.

Formato Excel real detectado (columna Supervisory Organization):
  Trip A: "SLPO_xxx GA {nombre} A ({supervisor})"   — excepto V2 que dice "TA"
  Trip B: "SLPO_xxx Group Leader GA B {nombre} ({supervisor})"
  Trip C: "SLPO_xxx GA {nombre} C ({supervisor})"
"""
from database import SessionLocal
import models

# Versión del seed — incrementar cuando se cambien patrones para forzar re-inserción
SEED_VERSION = 2

# Patrones: (substring_en_excel, tripulacion, nombre_linea_app)
# Cada patron es un substring ÚNICO que aparece en la celda del Excel.
PATRONES = [
    # ── Tripulación A ──────────────────────────────────────────────────────────
    ("GA Vestiduras 1 A",          "A", "V1"),
    ("GA Vestiduras IP&TL TA",     "A", "V2"),   # "TA" es especial para esta línea
    ("GA Vestiduras 3 A",          "A", "V3"),
    ("GA Vestiduras 4 A",          "A", "V4"),
    ("GA Vestiduras PU A",         "A", "PUERTAS"),
    ("GA IP/Robots A",             "A", "IP"),
    ("GA AGV A",                   "A", "AGVs"),
    ("GA Motores / Chassis 1 A",   "A", "Motores"),
    ("GA Chassis 1  A",            "A", "C1"),   # dos espacios
    ("GA Chassis 2 A",             "A", "C2"),
    ("GA Chassis 3 Final A",       "A", "C3/LF"),
    ("GA Reparaciones A",          "A", "Reparaciones"),

    # ── Tripulación B ──────────────────────────────────────────────────────────
    ("Group Leader GA B V1",        "B", "V1"),
    ("Group Leader GA B V2",        "B", "V2"),
    ("Group Leader GA B V3",        "B", "V3"),
    ("Group Leader GA B V4",        "B", "V4"),
    ("Group Leader GA B Doors",     "B", "PUERTAS"),
    ("Group Leader GA B IP-TL",     "B", "IP"),
    ("Group Leader GA B AGVs",      "B", "AGVs"),
    ("Group Leader GA B Engine",    "B", "Motores"),
    ("Group Leader GA B C1",        "B", "C1"),
    ("Group Leader GA B C2",        "B", "C2"),
    ("Group Leader GA B C3 & FL",   "B", "C3/LF"),
    ("Group Leader GA B Float Repair", "B", "Reparaciones"),

    # ── Tripulación C ──────────────────────────────────────────────────────────
    ("GA Vestiduras V1 C",         "C", "V1"),
    ("GA IP/Robots C",             "C", "V2"),
    ("GA Vestiduras 2 C",          "C", "V3"),
    ("GA Vestiduras 4 C",          "C", "V4"),
    ("GA Vestiduras PU C",         "C", "PUERTAS"),
    ("GA Vestiduas IP C",          "C", "IP"),   # typo en Excel: "Vestiduas"
    ("GA AGV C",                   "C", "AGVs"),
    ("GA Motores / Chassis 1 C",   "C", "Motores"),
    ("GA Chassis 1  C",            "C", "C1"),   # dos espacios
    ("GA Chassis 2 C",             "C", "C2"),
    ("GA Chassis 3 Final C",       "C", "C3/LF"),
    ("GA Reparaciones C",          "C", "Reparaciones"),
]


def seed_nomenclaturas():
    db = SessionLocal()
    try:
        # Siempre re-insertar si la versión cambió o si los patrones son diferentes
        current_count = db.query(models.NomenclaturaMapa).count()
        expected_count = len(PATRONES)

        if current_count == expected_count:
            # Verificar si el primer patrón ya es el correcto (check de versión)
            first = db.query(models.NomenclaturaMapa).first()
            if first and first.patron == PATRONES[0][0]:
                db.close()
                return  # Ya actualizado

        # Borrar y re-insertar
        db.query(models.NomenclaturaMapa).delete()
        db.commit()

        # Construir lookup de líneas por nombre (case-insensitive)
        lineas = db.query(models.Linea).all()
        linea_lookup = {l.nombre.lower(): l for l in lineas}

        insertados = 0
        for patron, trip, nombre_app in PATRONES:
            linea = linea_lookup.get(nombre_app.lower())
            if not linea:
                print(f"  ⚠️  Línea no encontrada: '{nombre_app}' — omitida")
                continue
            db.add(models.NomenclaturaMapa(
                patron=patron,
                tripulacion=trip,
                linea_id=linea.id,
                linea_nombre_ref=linea.nombre,
            ))
            insertados += 1

        db.commit()
        print(f"Nomenclaturas sembradas: {insertados} patrones (v{SEED_VERSION}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed_nomenclaturas()
