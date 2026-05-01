"""
Puebla la tabla nomenclatura_mapa con los patrones de texto del archivo Excel
de Numérico y su correspondencia a líneas de la app.

Formato Excel detectado:
  Trip A: "GA {nombre} A ({supervisor})"
  Trip B: "Group Leader GA B {nombre} ({supervisor})"
  Trip C: "GA {nombre} C ({supervisor})"
"""
from database import SessionLocal
import models


# Patrones: (substring_en_excel, tripulacion, nombre_linea_app)
# El substring debe ser suficientemente único para no dar falsos positivos.
PATRONES = [
    # ── Tripulación A ──────────────────────────────────────────────────────────
    ("Vestiduras 1 A",          "A", "V1"),
    ("Vestiduras IP&TL",        "A", "V2"),
    ("Vestiduras 3 A",          "A", "V3"),
    ("Vestiduras 4 A",          "A", "V4"),
    ("Vestiduras PU A",         "A", "PUERTAS"),
    ("IP/Robots A",             "A", "IP"),
    ("AGV A",                   "A", "AGVs"),
    ("Motores / Chassis 1 A",   "A", "Motores"),
    ("Chassis 1  A",            "A", "C1"),
    ("Chassis 2 A",             "A", "C2"),
    ("Chassis 3 Final A",       "A", "C3/LF"),
    ("Reparaciones A",          "A", "Reparaciones"),

    # ── Tripulación B ──────────────────────────────────────────────────────────
    ("GA B V1",                 "B", "V1"),
    ("GA B V2",                 "B", "V2"),
    ("GA B V3",                 "B", "V3"),
    ("GA B V4",                 "B", "V4"),
    ("GA B Doors",              "B", "PUERTAS"),
    ("GA B IP-TL",              "B", "IP"),
    ("GA B AGVs",               "B", "AGVs"),
    ("GA B Engine",             "B", "Motores"),
    ("GA B C1",                 "B", "C1"),
    ("GA B C2",                 "B", "C2"),
    ("GA B C3 & FL",            "B", "C3/LF"),
    ("GA B Float Repair",       "B", "Reparaciones"),

    # ── Tripulación C ──────────────────────────────────────────────────────────
    ("Vestiduras V1 C",         "C", "V1"),
    ("IP/Robots C",             "C", "V2"),
    ("Vestiduras 2 C",          "C", "V3"),
    ("Vestiduras 4 C",          "C", "V4"),
    ("Vestiduras PU C",         "C", "PUERTAS"),
    ("Vestiduas IP C",          "C", "IP"),   # typo en Excel: "Vestiduas"
    ("AGV C",                   "C", "AGVs"),
    ("Motores / Chassis 1 C",   "C", "Motores"),
    ("Chassis 1  C",            "C", "C1"),
    ("Chassis 2 C",             "C", "C2"),
    ("Chassis 3 Final C",       "C", "C3/LF"),
    ("Reparaciones C",          "C", "Reparaciones"),
]


def seed_nomenclaturas():
    db = SessionLocal()
    try:
        if db.query(models.NomenclaturaMapa).count() > 0:
            db.close()
            return  # Ya poblado

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
        print(f"Nomenclaturas sembradas: {insertados} patrones.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_nomenclaturas()
