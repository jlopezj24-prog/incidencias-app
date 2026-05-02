from sqlalchemy.orm import Session, joinedload
from datetime import date
from typing import Optional
import models

# Orden personalizado de líneas por nombre
LINEA_ORDEN = {
    'V1': 1, 'V2': 2, 'V3': 3, 'V4': 4, 'IP': 5, 'Puertas': 6,
    'C1': 7, 'C2': 8, 'C3/LF': 9, 'AGVS': 10, 'Motores': 11, 'Reparaciones': 12,
}

def linea_sort_key(nombre: str) -> int:
    return LINEA_ORDEN.get(nombre, 99)


def get_areas(db: Session):
    return db.query(models.Area).options(joinedload(models.Area.lineas)).all()


def get_lineas(db: Session, area_id: Optional[int] = None):
    q = db.query(models.Linea).options(joinedload(models.Linea.area))
    if area_id:
        q = q.filter(models.Linea.area_id == area_id)
    return sorted(q.all(), key=lambda l: linea_sort_key(l.nombre))


def get_linea(db: Session, linea_id: int):
    return (
        db.query(models.Linea)
        .options(joinedload(models.Linea.area))
        .filter(models.Linea.id == linea_id)
        .first()
    )


def get_reporte(db: Session, linea_id: int, fecha: date, tripulacion: str = "A"):
    return (
        db.query(models.ReporteDiario)
        .options(
            joinedload(models.ReporteDiario.incidencias),
            joinedload(models.ReporteDiario.linea).joinedload(models.Linea.area),
        )
        .filter(
            models.ReporteDiario.linea_id == linea_id,
            models.ReporteDiario.fecha == fecha,
            models.ReporteDiario.tripulacion == tripulacion,
        )
        .first()
    )


def upsert_reporte(db: Session, linea_id: int, fecha: date, tripulacion: str, lideres_presentes: int, incidencias: list):
    existing = get_reporte(db, linea_id, fecha, tripulacion)
    if existing:
        existing.lideres_presentes = lideres_presentes
        for inc in list(existing.incidencias):
            db.delete(inc)
        db.flush()
        for inc_data in incidencias:
            inc = models.Incidencia(reporte_id=existing.id, **inc_data)
            db.add(inc)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        reporte = models.ReporteDiario(
            linea_id=linea_id,
            fecha=fecha,
            tripulacion=tripulacion,
            lideres_presentes=lideres_presentes,
        )
        db.add(reporte)
        db.flush()
        for inc_data in incidencias:
            inc = models.Incidencia(reporte_id=reporte.id, **inc_data)
            db.add(inc)
        db.commit()
        db.refresh(reporte)
        return reporte


def get_dashboard_data(
    db: Session,
    area_id: Optional[int],
    linea_id: Optional[int],
    tripulacion: Optional[str],
    fecha_inicio: date,
    fecha_fin: date,
):
    q = (
        db.query(models.Incidencia)
        .options(
            joinedload(models.Incidencia.reporte)
            .joinedload(models.ReporteDiario.linea)
            .joinedload(models.Linea.area)
        )
        .join(models.ReporteDiario)
        .join(models.Linea)
        .filter(
            models.ReporteDiario.fecha >= fecha_inicio,
            models.ReporteDiario.fecha <= fecha_fin,
        )
    )
    if tripulacion:
        q = q.filter(models.ReporteDiario.tripulacion == tripulacion)
    if linea_id:
        q = q.filter(models.Linea.id == linea_id)
    elif area_id:
        q = q.filter(models.Linea.area_id == area_id)

    incidencias = q.all()

    # Agregado por tipo
    tipo_totals: dict = {}
    for inc in incidencias:
        tipo_totals[inc.tipo] = tipo_totals.get(inc.tipo, 0) + inc.cantidad
    por_tipo = [
        {"tipo": k, "total": v}
        for k, v in sorted(tipo_totals.items(), key=lambda x: -x[1])
    ]

    # Tendencia por día
    fecha_data: dict = {}
    for inc in incidencias:
        fecha_str = inc.reporte.fecha.isoformat()
        if fecha_str not in fecha_data:
            fecha_data[fecha_str] = {}
        fecha_data[fecha_str][inc.tipo] = fecha_data[fecha_str].get(inc.tipo, 0) + inc.cantidad
    por_dia = [
        {"fecha": k, "total": sum(v.values()), **v}
        for k, v in sorted(fecha_data.items())
    ]

    # Resumen por línea — incidencias
    linea_data: dict = {}
    for inc in incidencias:
        linea_nombre = inc.reporte.linea.nombre
        area_nombre = inc.reporte.linea.area.nombre
        total_lideres = inc.reporte.linea.total_lideres
        trip = inc.reporte.tripulacion
        key = f"{linea_nombre}|{trip}"
        if key not in linea_data:
            linea_data[key] = {
                "linea": linea_nombre,
                "area": area_nombre,
                "tripulacion": trip,
                "total": 0,
                "total_lideres": total_lideres,
                "lideres_presentes_sum": 0,
                "reportes_count": 0,
                "incidencias_por_tipo": {},
            }
        linea_data[key]["total"] += inc.cantidad
        t = inc.tipo
        linea_data[key]["incidencias_por_tipo"][t] = (
            linea_data[key]["incidencias_por_tipo"].get(t, 0) + inc.cantidad
        )

    # Agregar datos de líderes desde reportes
    rq_linea = (
        db.query(models.ReporteDiario)
        .options(joinedload(models.ReporteDiario.linea).joinedload(models.Linea.area))
        .join(models.Linea)
        .filter(
            models.ReporteDiario.fecha >= fecha_inicio,
            models.ReporteDiario.fecha <= fecha_fin,
        )
    )
    if tripulacion:
        rq_linea = rq_linea.filter(models.ReporteDiario.tripulacion == tripulacion)
    if linea_id:
        rq_linea = rq_linea.filter(models.Linea.id == linea_id)
    elif area_id:
        rq_linea = rq_linea.filter(models.Linea.area_id == area_id)

    for rep in rq_linea.all():
        trip = rep.tripulacion
        ln = rep.linea.nombre
        key = f"{ln}|{trip}"
        if key not in linea_data:
            linea_data[key] = {
                "linea": ln,
                "area": rep.linea.area.nombre,
                "tripulacion": trip,
                "total": 0,
                "total_lideres": rep.linea.total_lideres,
                "lideres_presentes_sum": 0,
                "reportes_count": 0,
                "incidencias_por_tipo": {},
            }
        linea_data[key]["lideres_presentes_sum"] += rep.lideres_presentes
        linea_data[key]["reportes_count"] += 1

    # Calcular % líderes libres promedio y aplanar incidencias_por_tipo
    for k, v in linea_data.items():
        cnt = v["reportes_count"]
        total_lid = v["total_lideres"]
        if cnt > 0 and total_lid > 0:
            avg_presentes = v["lideres_presentes_sum"] / cnt
            v["pct_lideres_libres"] = round((avg_presentes / total_lid) * 100, 1)
            v["avg_lideres_presentes"] = round(avg_presentes, 1)
        else:
            v["pct_lideres_libres"] = None
            v["avg_lideres_presentes"] = None
        # Mover incidencias_por_tipo al nivel raíz para fácil lectura
        v["desglose"] = [
            {"tipo": t, "cantidad": c}
            for t, c in sorted(v["incidencias_por_tipo"].items(), key=lambda x: -x[1])
        ]
        del v["incidencias_por_tipo"]
        del v["lideres_presentes_sum"]
        del v["reportes_count"]

    por_linea = sorted(linea_data.values(), key=lambda x: (linea_sort_key(x["linea"]), -x["total"]))

    # Resumen por área — agregar desde por_linea
    area_data: dict = {}
    for row in linea_data.values():
        an = row["area"]
        if an not in area_data:
            area_data[an] = {
                "area": an,
                "total_incidencias": 0,
                "total_lideres": 0,
                "avg_lideres_presentes_sum": 0,
                "lineas_con_datos": 0,
                "desglose": {},
            }
        area_data[an]["total_incidencias"] += row["total"]
        area_data[an]["total_lideres"] += row["total_lideres"]
        if row["avg_lideres_presentes"] is not None:
            area_data[an]["avg_lideres_presentes_sum"] += row["avg_lideres_presentes"]
            area_data[an]["lineas_con_datos"] += 1
        for d in row["desglose"]:
            t = d["tipo"]
            area_data[an]["desglose"][t] = area_data[an]["desglose"].get(t, 0) + d["cantidad"]

    por_area = []
    for an, av in area_data.items():
        cnt = av["lineas_con_datos"]
        total_lid = av["total_lideres"]
        if cnt > 0 and total_lid > 0:
            avg_pres = av["avg_lideres_presentes_sum"]
            pct = round((avg_pres / total_lid) * 100, 1)
        else:
            avg_pres = None
            pct = None
        por_area.append({
            "area": an,
            "total_incidencias": av["total_incidencias"],
            "total_lideres": total_lid,
            "avg_lideres_presentes": round(avg_pres, 1) if avg_pres else None,
            "pct_lideres_libres": pct,
            "desglose": [
                {"tipo": t, "cantidad": c}
                for t, c in sorted(av["desglose"].items(), key=lambda x: -x[1])
            ],
        })
    por_area.sort(key=lambda x: -x["total_incidencias"])

    # Reportes para KPIs
    rq = db.query(models.ReporteDiario).join(models.Linea).filter(
        models.ReporteDiario.fecha >= fecha_inicio,
        models.ReporteDiario.fecha <= fecha_fin,
    )
    if tripulacion:
        rq = rq.filter(models.ReporteDiario.tripulacion == tripulacion)
    if linea_id:
        rq = rq.filter(models.Linea.id == linea_id)
    elif area_id:
        rq = rq.filter(models.Linea.area_id == area_id)
    total_reportes = rq.count()

    lineas_afectadas = len(set(inc.reporte.linea_id for inc in incidencias))

    return {
        "por_tipo": por_tipo,
        "por_dia": por_dia,
        "por_linea": por_linea,
        "por_area": por_area,
        "kpis": {
            "total_incidencias": sum(tipo_totals.values()),
            "total_reportes": total_reportes,
            "lineas_con_incidencias": lineas_afectadas,
            "tipos_distintos": len(tipo_totals),
        },
    }
