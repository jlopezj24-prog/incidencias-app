import { useState, useEffect } from 'react'
import axios from 'axios'
import DailyReport from '../components/DailyReport'

const TIPOS_INCIDENCIA = [
  'Falta Injustificada',
  'Retardo',
  'Permiso Sin Goce',
  'Permiso Por Paternidad',
  'Permiso por Defunción',
  'Baja',
  'Servicio Médico',
  'Vacaciones',
  'Sanciones',
  'Incapacidad',
]

const todayStr = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

export default function SupervisorPage() {
  const [areas, setAreas] = useState([])
  const [lineas, setLineas] = useState([])
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [selectedLineaId, setSelectedLineaId] = useState('')
  const [tripulacion, setTripulacion] = useState('A')
  const [fecha, setFecha] = useState(todayStr())
  const [lideresPresentes, setLideresPresentes] = useState('')
  const [incidencias, setIncidencias] = useState([])

  const [newTipo, setNewTipo] = useState(TIPOS_INCIDENCIA[0])
  const [newCantidad, setNewCantidad] = useState(1)
  const [newNotas, setNewNotas] = useState('')

  const [savedReport, setSavedReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Load areas on mount
  useEffect(() => {
    axios.get('/api/areas').then((r) => setAreas(r.data))
  }, [])

  // Load lines when area changes
  useEffect(() => {
    if (selectedAreaId) {
      axios.get(`/api/lineas?area_id=${selectedAreaId}`).then((r) => {
        setLineas(r.data)
        setSelectedLineaId('')
        setIncidencias([])
        setSavedReport(null)
        setLideresPresentes('')
      })
    }
  }, [selectedAreaId])

  // Load existing report when line + date change
  useEffect(() => {
    if (!selectedLineaId || !fecha) return
    setLoadingReport(true)
    setMessage(null)
    axios
      .get(`/api/reportes?linea_id=${selectedLineaId}&fecha=${fecha}&tripulacion=${tripulacion}`)
      .then((r) => {
        if (r.data) {
          setLideresPresentes(r.data.lideres_presentes)
          setIncidencias(
            r.data.incidencias.map((i) => ({
              tipo: i.tipo,
              cantidad: i.cantidad,
              notas: i.notas || '',
            }))
          )
          setSavedReport(r.data)
        } else {
          setLideresPresentes('')
          setIncidencias([])
          setSavedReport(null)
        }
      })
      .finally(() => setLoadingReport(false))
  }, [selectedLineaId, fecha, tripulacion])

  const addIncidencia = () => {
    if (newCantidad < 1) return
    setIncidencias((prev) => {
      const existing = prev.find((i) => i.tipo === newTipo)
      if (existing) {
        return prev.map((i) =>
          i.tipo === newTipo ? { ...i, cantidad: i.cantidad + newCantidad } : i
        )
      }
      return [...prev, { tipo: newTipo, cantidad: newCantidad, notas: newNotas }]
    })
    setNewCantidad(1)
    setNewNotas('')
  }

  const removeIncidencia = (tipo) => {
    setIncidencias((prev) => prev.filter((i) => i.tipo !== tipo))
  }

  const handleSave = async () => {
    if (!selectedLineaId || !fecha || lideresPresentes === '') {
      setMessage({ type: 'error', text: 'Completa todos los campos requeridos.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const r = await axios.post('/api/reportes', {
        linea_id: parseInt(selectedLineaId),
        fecha,
        tripulacion,
        lideres_presentes: parseInt(lideresPresentes),
        incidencias,
      })
      setSavedReport(r.data)
      setMessage({ type: 'success', text: '✅ Reporte guardado correctamente.' })
    } catch {
      setMessage({ type: 'error', text: '❌ Error al guardar el reporte.' })
    } finally {
      setSaving(false)
    }
  }

  const selectedLinea = lineas.find((l) => l.id == selectedLineaId)
  const selectedArea = areas.find((a) => a.id == selectedAreaId)

  return (
    <div className="space-y-5 py-4">
      <h1 className="text-2xl font-bold text-gray-800">Captura de Incidencias</h1>

      {/* ── Paso 1: Selección ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">1 · Seleccionar línea y fecha</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Tripulación</label>
            <select
              value={tripulacion}
              onChange={(e) => setTripulacion(e.target.value)}
              className="input"
            >
              <option value="A">Tripulación A</option>
              <option value="B">Tripulación B</option>
              <option value="C">Tripulación C</option>
            </select>
          </div>
          <div>
            <label className="label">Área</label>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="input"
            >
              <option value="">-- Seleccionar --</option>
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
              disabled={!selectedAreaId}
              className="input disabled:bg-gray-100"
            >
              <option value="">-- Seleccionar --</option>
              {lineas.map((l) => (
                <option key={l.id} value={l.id}>
                    {l.nombre}
                  </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Lets presentes</label>
            <input
              type="number"
              min="0"
              max={selectedLinea?.total_lideres ?? 100}
              value={lideresPresentes}
              onChange={(e) => setLideresPresentes(e.target.value)}
              placeholder={selectedLinea ? `máx ${selectedLinea.total_lideres}` : '0'}
              disabled={!selectedLineaId}
              className="input disabled:bg-gray-100"
            />
          </div>
        </div>

        {loadingReport && (
          <p className="text-sm text-blue-500 mt-3">Buscando reporte existente…</p>
        )}
        {savedReport && !loadingReport && (
          <p className="text-sm text-amber-600 mt-3">
            ⚠️ Ya existe un reporte para esta línea y fecha — se actualizará al guardar.
          </p>
        )}
      </section>

      {/* ── Paso 2: Incidencias ───────────────────────────────────────────── */}
      {selectedLineaId && (
        <section className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">2 · Registrar incidencias</h2>

          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={newTipo}
              onChange={(e) => setNewTipo(e.target.value)}
              className="input flex-1 min-w-[200px]"
            >
              {TIPOS_INCIDENCIA.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewCantidad(c => Math.max(1, c - 1))}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold w-9 h-9 rounded-lg text-lg flex items-center justify-center"
              >−</button>
              <span className="w-8 text-center font-semibold text-lg">{newCantidad}</span>
              <button
                type="button"
                onClick={() => setNewCantidad(c => c + 1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold w-9 h-9 rounded-lg text-lg flex items-center justify-center"
              >+</button>
            </div>
            <input
              type="text"
              value={newNotas}
              onChange={(e) => setNewNotas(e.target.value)}
              placeholder="Notas (opcional)"
              className="input flex-1 min-w-[140px]"
            />
            <button
              onClick={addIncidencia}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              + Agregar
            </button>
          </div>

          {incidencias.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3">Tipo de incidencia</th>
                  <th className="text-center p-3">Cantidad</th>
                  <th className="text-left p-3">Notas</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {incidencias.map((inc, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">{inc.tipo}</td>
                    <td className="p-3 text-center font-semibold text-blue-700">{inc.cantidad}</td>
                    <td className="p-3 text-gray-400 text-xs">{inc.notas}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => removeIncidencia(inc.tipo)}
                        className="text-red-400 hover:text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">
              No hay incidencias — agrega al menos una o deja vacío si no hubo.
            </p>
          )}
        </section>
      )}

      {/* ── Paso 3: Preview + Guardar ─────────────────────────────────────── */}
      {selectedLineaId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-4">3 · Vista previa del reporte</h2>
            {selectedLinea && lideresPresentes !== '' ? (
              <DailyReport
                linea={selectedLinea.nombre}
                area={selectedArea?.nombre || ''}
                fecha={fecha}
                lideres_presentes={parseInt(lideresPresentes) || 0}
                total_lideres={selectedLinea.total_lideres}
                incidencias={incidencias}
              />
            ) : (
              <p className="text-gray-400 text-sm">
                Ingresa los Lets presentes para ver la vista previa.
              </p>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow p-5 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-gray-700 mb-2">4 · Guardar reporte</h2>
              <p className="text-gray-400 text-sm">
                El reporte quedará disponible en el dashboard del gerente.
              </p>
            </div>

            {message && (
              <div
                className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !selectedLineaId || lideresPresentes === ''}
              className="mt-5 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando…' : '💾 Guardar Reporte'}
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
