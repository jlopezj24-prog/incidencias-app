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

  if (error) return null

  // Agrupar por área
  const porArea = estado
    ? estado.lineas.reduce((acc, l) => {
        if (!acc[l.area]) acc[l.area] = []
        acc[l.area].push(l)
        return acc
      }, {})
    : {}

  return (
    <div className="bg-white rounded-2xl shadow p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-800 text-sm">Estado del día</h2>
          {estado && (
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                OK {estado.resumen.cargados} cargadas
              </span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                PEND {estado.resumen.pendientes} pendientes
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
    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          <button
            onClick={() => fetchDashboard()}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Cargando…' : '🔍 Aplicar filtros'}
          </button>
        </div>
      </section>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            <KPICard
              title="Total incidencias"
              value={data.kpis.total_incidencias}
              icon="⚠️"
              colorClass="border-red-200"
            />
            <KPICard
              title="Líneas afectadas"
              value={data.kpis.lineas_con_incidencias}
              icon="🏭"
              colorClass="border-yellow-200"
            />
          </div>

          {/* ── Gráficas ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Barras por tipo */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="font-semibold text-gray-700 mb-4">Incidencias por tipo</h2>
              {data.por_tipo.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.por_tipo} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="tipo"
                      width={140}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="total" name="Cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Tendencia diaria */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="font-semibold text-gray-700 mb-4">Tendencia diaria</h2>
              {data.por_dia.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.por_dia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

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
                        <span>Lets libres (promedio)</span>
                        <span className="font-semibold">
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
                      <th className="text-center p-3">Total incidencias</th>
                      <th className="text-center p-3">Lets libres</th>
                      <th className="text-left p-3 min-w-[220px]">Desglose por tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_linea.map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 align-top">
                        <td className="p-3 text-gray-500">{row.area}</td>
                        <td className="p-3 font-medium">{row.linea}</td>
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
    </div>
  )
}
