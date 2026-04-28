import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'

const todayStr = () => new Date().toISOString().split('T')[0]

const firstOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

function KPICard({ title, value, icon, colorClass }) {
  return (
    <div className={`bg-white rounded-2xl shadow border p-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span className="text-4xl font-bold text-gray-800">{value ?? '—'}</span>
      </div>
      <p className="text-sm text-gray-500 mt-2 font-medium">{title}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-44 text-gray-300 flex-col gap-2">
      <span className="text-4xl">📭</span>
      <p className="text-sm">Sin datos para el período seleccionado</p>
    </div>
  )
}

function EstadoDia() {
  const [fecha, setFecha] = useState(todayStr())
  const [tripulacion, setTripulacion] = useState('A')
  const [estado, setEstado] = useState(null)
  const [error, setError] = useState(false)

  const fetchEstado = async (f, t) => {
    try {
      const r = await axios.get(`/api/estado-dia?fecha=${f}&tripulacion=${t}`)
      setEstado(r.data)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => { fetchEstado(fecha, tripulacion) }, [fecha, tripulacion])

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => fetchEstado(fecha, tripulacion), 60000)
    return () => clearInterval(interval)
  }, [fecha, tripulacion])

  if (error) return null

  const pendientes = estado ? estado.lineas.filter(l => !l.cargado) : []
  const cargadas = estado ? estado.lineas.filter(l => l.cargado) : []

  // Agrupar por área
  const porArea = estado
    ? estado.lineas.reduce((acc, l) => {
        if (!acc[l.area]) acc[l.area] = []
        acc[l.area].push(l)
        return acc
      }, {})
    : {}

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-800 text-sm">Estado del día</h2>
          {estado && (
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                ✅ {estado.resumen.cargados} cargadas
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pendientes.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                {pendientes.length > 0 ? `⚠️ ${pendientes.length} pendientes` : '✔ Sin pendientes'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={tripulacion}
            onChange={(e) => setTripulacion(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="A">Trip. A</option>
            <option value="B">Trip. B</option>
            <option value="C">Trip. C</option>
          </select>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none"
          />
          <button
            onClick={() => fetchEstado(fecha, tripulacion)}
            className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs hover:bg-blue-700"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Banner de pendientes */}
      {pendientes.length > 0 && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-bold text-red-700 mb-2">🚨 Líneas que NO han reportado:</p>
          <div className="flex flex-wrap gap-1">
            {pendientes.map(l => (
              <span key={l.linea_id} className="bg-red-100 border border-red-300 text-red-800 text-xs font-semibold px-2 py-1 rounded-lg">
                {l.area} · {l.linea}
              </span>
            ))}
          </div>
        </div>
      )}

      {estado && pendientes.length === 0 && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-green-700">✅ Todas las líneas han reportado el día de hoy</p>
        </div>
      )}

      {estado && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(porArea).map(([area, lineas]) => (
            <div key={area} className="flex-1 min-w-[280px]">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{area}</div>
              <div className="flex flex-wrap gap-1">
                {lineas.map((l) => (
                  <div
                    key={l.linea_id}
                    title={l.cargado ? `${l.total_incidencias} incidencias · ${l.lideres_presentes}/${l.total_lideres} Lets · ${l.hora_carga}` : 'Sin reporte'}
                    className={`rounded-lg px-2 py-1 border text-center cursor-default ${
                      l.cargado
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <span className="text-xs">{l.cargado ? 'OK' : '--'}</span>
                    <span className="text-xs font-semibold text-gray-700 ml-1">{l.linea}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const TIPO_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6b7280',
]

export default function ManagerPage() {
  const [areas, setAreas] = useState([])
  const [lineas, setLineas] = useState([])
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [selectedLineaId, setSelectedLineaId] = useState('')
  const [selectedTripulacion, setSelectedTripulacion] = useState('')
  const [fechaInicio, setFechaInicio] = useState(firstOfMonth())
  const [fechaFin, setFechaFin] = useState(todayStr())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tendenciaLinea, setTendenciaLinea] = useState(null) // { linea, tripulacion, datos }
  const [loadingTendencia, setLoadingTendencia] = useState(false)

  const fetchDashboard = useCallback(
    async (overrides = {}) => {
      const params = {
        fecha_inicio: overrides.fechaInicio ?? fechaInicio,
        fecha_fin: overrides.fechaFin ?? fechaFin,
      }
      const aId = overrides.areaId !== undefined ? overrides.areaId : selectedAreaId
      const lId = overrides.lineaId !== undefined ? overrides.lineaId : selectedLineaId
      const trip = overrides.tripulacion !== undefined ? overrides.tripulacion : selectedTripulacion
      if (lId) params.linea_id = lId
      else if (aId) params.area_id = aId
      if (trip) params.tripulacion = trip

      setLoading(true)
      try {
        const r = await axios.get('/api/dashboard', { params })
        setData(r.data)
      } finally {
        setLoading(false)
      }
    },
    [fechaInicio, fechaFin, selectedAreaId, selectedLineaId, selectedTripulacion]
  )

  useEffect(() => {
    axios.get('/api/areas').then((r) => setAreas(r.data))
    axios.get('/api/lineas').then((r) => setLineas(r.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin])

  const openTendencia = async (row) => {
    setLoadingTendencia(true)
    setTendenciaLinea({ linea: row.linea, tripulacion: row.tripulacion, datos: null })
    try {
      const r = await axios.get('/api/dashboard', {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          tripulacion: row.tripulacion || undefined,
        }
      })
      // Filtrar por_dia ya existe, pero necesitamos datos sólo de esta línea
      // Re-fetching con linea_id buscado del array lineas
      const lineaObj = lineas.find(l => l.nombre === row.linea)
      if (lineaObj) {
        const r2 = await axios.get('/api/dashboard', {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            linea_id: lineaObj.id,
            tripulacion: row.tripulacion || undefined,
          }
        })
        setTendenciaLinea({ linea: row.linea, tripulacion: row.tripulacion, datos: r2.data })
      } else {
        setTendenciaLinea({ linea: row.linea, tripulacion: row.tripulacion, datos: r.data })
      }
    } finally {
      setLoadingTendencia(false)
    }
  }

  const filteredLineas = selectedAreaId
    ? lineas.filter((l) => l.area_id == selectedAreaId)
    : lineas

  const handleAreaChange = (e) => {
    setSelectedAreaId(e.target.value)
    setSelectedLineaId('')
  }

  return (
    <div className="space-y-5 py-4">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard de Incidencias</h1>

      {/* ── Estado del día ────────────────────────────────────────────────── */}
      <EstadoDia />

      {/* ── Filtros (Reportes históricos) ─────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3">
        <h2 className="font-semibold text-blue-800 text-sm uppercase tracking-wider">
          📊 Reportes históricos — usa los filtros para ver datos por período
        </h2>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow p-4">
        {/* Botones de período rápido */}
        <div className="flex gap-2 flex-wrap mb-3">
          <span className="text-xs text-gray-500 self-center font-medium">Período rápido:</span>
          {[
            { label: '📅 Hoy', fn: () => { const t = todayStr(); setFechaInicio(t); setFechaFin(t) } },
            { label: '📆 Esta semana', fn: () => {
              const now = new Date(); const day = now.getDay() || 7
              const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
              const offset = now.getTimezoneOffset()
              const toStr = d => new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10)
              setFechaInicio(toStr(mon)); setFechaFin(todayStr())
            }},
            { label: '🗓️ Este mes', fn: () => { setFechaInicio(firstOfMonth()); setFechaFin(todayStr()) } },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={() => { fn(); setTimeout(() => fetchDashboard(), 50) }}
              className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Tripulación</label>
            <select value={selectedTripulacion} onChange={(e) => setSelectedTripulacion(e.target.value)} className="input">
              <option value="">Todas</option>
              <option value="A">Tripulación A</option>
              <option value="B">Tripulación B</option>
              <option value="C">Tripulación C</option>
            </select>
          </div>
          <div>
            <label className="label">Área</label>
            <select value={selectedAreaId} onChange={handleAreaChange} className="input">
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Línea</label>
            <select
              value={selectedLineaId}
              onChange={(e) => setSelectedLineaId(e.target.value)}
              className="input"
            >
              <option value="">Todas las líneas</option>
              {filteredLineas.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => fetchDashboard()}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Cargando…' : '🔍 Aplicar filtros'}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams()
                params.set('fecha_inicio', fechaInicio)
                params.set('fecha_fin', fechaFin)
                if (selectedLineaId) params.set('linea_id', selectedLineaId)
                else if (selectedAreaId) params.set('area_id', selectedAreaId)
                if (selectedTripulacion) params.set('tripulacion', selectedTripulacion)
                window.open(`/api/export/excel?${params.toString()}`, '_blank')
              }}
              disabled={loading}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium disabled:bg-green-300 transition-colors"
            >
              📥 Exportar Excel
            </button>
          </div>
        </div>
      </section>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      {data && (
        <>
          {/* ── Tarjetas resumen por tipo ────────────────────────────────── */}
          {data.por_tipo.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="font-semibold text-gray-700 mb-4">Resumen por tipo de incidencia</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {data.por_tipo.map((item, i) => (
                  <div
                    key={i}
                    className="text-center p-3 rounded-xl border bg-gray-50"
                    style={{ borderColor: TIPO_COLORS[i % TIPO_COLORS.length] + '60' }}
                  >
                    <div
                      className="text-3xl font-bold"
                      style={{ color: TIPO_COLORS[i % TIPO_COLORS.length] }}
                    >
                      {item.total}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-tight">{item.tipo}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Resumen por área ────────────────────────────────────────── */}
          {data.por_area && data.por_area.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data.por_area.map((area, i) => (
                <div key={i} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-800 text-lg">🏭 {area.area}</h2>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-sm">
                      {area.total_incidencias} incidencias
                    </span>
                  </div>

                  {/* Barra de líderes libres */}
                  {area.pct_lideres_libres !== null && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="font-bold text-gray-800">Lets libres (promedio)</span>
                        <span className="font-bold text-gray-800">
                          {area.avg_lideres_presentes} / {area.total_lideres} — {area.pct_lideres_libres}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            area.pct_lideres_libres >= 80
                              ? 'bg-green-400'
                              : area.pct_lideres_libres >= 50
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(area.pct_lideres_libres, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Desglose por tipo */}
                  {area.desglose.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {area.desglose.map((d, j) => (
                        <span
                          key={j}
                          className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs"
                        >
                          {d.cantidad} {d.tipo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Tabla resumen por tipo y área ──────────────────────────── */}
          {data.por_area && data.por_area.length > 0 && (() => {
            // Construir mapa tipo -> { total, por_area }
            const tipoMap = {}
            data.por_area.forEach(area => {
              area.desglose.forEach(d => {
                if (!tipoMap[d.tipo]) tipoMap[d.tipo] = { total: 0, areas: {} }
                tipoMap[d.tipo].total += d.cantidad
                tipoMap[d.tipo].areas[area.area] = (tipoMap[d.tipo].areas[area.area] || 0) + d.cantidad
              })
            })
            const tipos = Object.entries(tipoMap).sort((a, b) => b[1].total - a[1].total)
            const areaNombres = data.por_area.map(a => a.area)
            const grandTotal = tipos.reduce((s, [, v]) => s + v.total, 0)
            if (tipos.length === 0) return null
            return (
              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="font-semibold text-gray-700 mb-4">📋 Resumen de incidencias por área</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 font-bold text-gray-700">Tipo de incidencia</th>
                        <th className="text-center p-3 font-bold text-gray-900">
                          Total <span className="text-blue-600 text-base">{grandTotal}</span>
                        </th>
                        {areaNombres.map(a => (
                          <th key={a} className="text-center p-3 font-bold text-gray-700">{a}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tipos.map(([tipo, v], i) => (
                        <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="p-3 text-gray-700">{tipo}</td>
                          <td className="p-3 text-center font-bold text-blue-600">{v.total}</td>
                          {areaNombres.map(a => (
                            <td key={a} className="p-3 text-center text-gray-600">
                              {v.areas[a] || 0}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-100">
                        <td className="p-3 font-bold text-gray-700">Total</td>
                        <td className="p-3 text-center font-bold text-blue-700">{grandTotal}</td>
                        {areaNombres.map(a => (
                          <td key={a} className="p-3 text-center font-bold text-gray-700">
                            {data.por_area.find(x => x.area === a)?.total_incidencias || 0}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })()}

          {/* ── Tabla por línea ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Resumen por línea</h2>
            {data.por_linea.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left p-3">Área</th>
                      <th className="text-left p-3">Línea</th>
                      <th className="text-left p-3">Tripulación</th>
                      <th className="text-center p-3">Total incidencias</th>
                      <th className="text-center p-3">Lets libres</th>
                      <th className="text-left p-3 min-w-[220px]">Desglose por tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_linea.map((row, i) => (
                      <tr key={i} onClick={() => openTendencia(row)} className="border-t hover:bg-blue-50 align-top cursor-pointer transition-colors">
                        <td className="p-3 text-gray-500">{row.area}</td>
                        <td className="p-3 font-medium text-blue-700 underline decoration-dotted">{row.linea}</td>
                        <td className="p-3">
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                            Trip. {row.tripulacion}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-red-100 text-red-700 px-3 py-0.5 rounded-full font-semibold">
                            {row.total}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {row.pct_lideres_libres !== null ? (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                                  row.pct_lideres_libres >= 80
                                    ? 'bg-green-100 text-green-700'
                                    : row.pct_lideres_libres >= 50
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {row.pct_lideres_libres}%
                              </span>
                              <span className="text-xs text-gray-400">
                                {row.avg_lideres_presentes} / {row.total_lideres}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          {row.desglose && row.desglose.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.desglose.map((d, j) => (
                                <span
                                  key={j}
                                  className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs"
                                >
                                  {d.cantidad} {d.tipo}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">Sin incidencias</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-300">
          <div className="text-5xl mb-3">📊</div>
          <p>Haz clic en <strong className="text-gray-400">Aplicar filtros</strong> para ver los datos</p>
        </div>
      )}
      {loading && (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-blue-400">
          <div className="text-5xl mb-3 animate-spin">⏳</div>
          <p>Cargando datos…</p>
        </div>
      )}

      {/* ── Gráficas (al final) ───────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Incidencias por tipo</h2>
            {data.por_tipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.por_tipo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="tipo" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Tendencia diaria</h2>
            {data.por_dia.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.por_dia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>
      )}

      {/* ── Modal tendencia por línea ─────────────────────────────────────── */}
      {tendenciaLinea && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setTendenciaLinea(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  📈 Tendencia — {tendenciaLinea.linea}
                </h2>
                <p className="text-xs text-gray-400">
                  Trip. {tendenciaLinea.tripulacion} · {fechaInicio} al {fechaFin}
                </p>
              </div>
              <button
                onClick={() => setTendenciaLinea(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
              >×</button>
            </div>

            {loadingTendencia && (
              <div className="text-center py-10 text-blue-400">
                <div className="text-4xl animate-spin mb-2">⏳</div>
                <p>Cargando tendencia…</p>
              </div>
            )}

            {!loadingTendencia && tendenciaLinea.datos && (
              <>
                {tendenciaLinea.datos.por_dia.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tendenciaLinea.datos.por_dia} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Total incidencias" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-300">
                    <p className="text-3xl mb-2">📭</p>
                    <p>Sin incidencias en este período</p>
                  </div>
                )}

                {tendenciaLinea.datos.por_tipo.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Desglose por tipo</h3>
                    <div className="flex flex-wrap gap-2">
                      {tendenciaLinea.datos.por_tipo.map((t, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-sm font-semibold">
                          {t.total} {t.tipo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tendenciaLinea.datos.kpis && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{tendenciaLinea.datos.kpis.total_incidencias}</p>
                      <p className="text-xs text-gray-500">Total incidencias</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{tendenciaLinea.datos.kpis.tipos_distintos}</p>
                      <p className="text-xs text-gray-500">Tipos distintos</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
