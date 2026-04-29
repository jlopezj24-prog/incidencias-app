from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Area(Base):
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)
    lineas = relationship("Linea", back_populates="area")


class Linea(Base):
    __tablename__ = "lineas"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    nombre = Column(String, nullable=False)
    total_lideres = Column(Integer, default=0)
    personas_autorizadas = Column(Integer, default=0)
    pool_autorizado = Column(Integer, default=0)
    numerico = Column(Integer, default=0)
    area = relationship("Area", back_populates="lineas")
    reportes = relationship("ReporteDiario", back_populates="linea")


class ReporteDiario(Base):
    __tablename__ = "reportes_diarios"
    id = Column(Integer, primary_key=True, index=True)
    linea_id = Column(Integer, ForeignKey("lineas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    tripulacion = Column(String, nullable=False, default="A")
    lideres_presentes = Column(Integer, default=0)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    linea = relationship("Linea", back_populates="reportes")
    incidencias = relationship("Incidencia", back_populates="reporte", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("linea_id", "fecha", "tripulacion", name="uq_linea_fecha_tripulacion"),)


class Incidencia(Base):
    __tablename__ = "incidencias"
    id = Column(Integer, primary_key=True, index=True)
    reporte_id = Column(Integer, ForeignKey("reportes_diarios.id"), nullable=False)
    tipo = Column(String, nullable=False)
    cantidad = Column(Integer, default=1)
    notas = Column(String, nullable=True)
    reporte = relationship("ReporteDiario", back_populates="incidencias")


class AppConfig(Base):
    __tablename__ = "app_config"
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
