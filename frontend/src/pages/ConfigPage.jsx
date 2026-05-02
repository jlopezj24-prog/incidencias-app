import { useState, useEffect } from 'react'
import axios from 'axios'

const LINEA_ORDEN = {
  'V1': 1, 'V2': 2, 'V3': 3, 'V4': 4, 'IP': 5, 'Puertas': 6,
  'C1': 7, 'C2': 8, 'C3/LF': 9, 'AGVS': 10, 'Motores': 11, 'Reparaciones': 12,
}
const sortLineas = (arr) => [...arr].sort((a, b) => (LINEA_ORDEN[a.nombre] || 99) - (LINEA_ORDEN[b.nombre] || 99))

function CargaNumerico({ lineas, onGuardado }) {
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [todosGrupos, setTodosGrupos] = useState(null)
  const [filtroTrip, setFiltroTrip] = useState('todos')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [guardadoMsg, setGuardadoMsg] = useState(null)

  const handleParse = async () => {
    if (!file) return
    setParsing(true); setError(null); setTodosGrupos(null); setGuardadoMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await axios.post('/api/numerico/parse-excel', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setTodosGrupos(r.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al leer el archivo.')
    } finally {
      setParsing(false)
    }
  }

  const handleMapeo = (idx, linea_id) => {
    setTodosGrupos(prev => prev.map((g, i) => i === idx ? { ...g, linea_id: linea_id ? parseInt(linea_id) : null } : g))
  }

  const handleGuardar = async () => {
    setGuardando(true); setGuardadoMsg(null)
    try {
      const r = await axios.post('/api/numerico/confirmar', { mapeos: todosGrupos })
      setGuardadoMsg(`✅ ${r.data.guardados} registros guardados correctamente.`)
      if (onGuardado) onGuardado()  // refresca numericos en ConfigPage
    } catch (e) {
      setGuardadoMsg('❌ Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const tripBadge = (t) => {
    const cls = t === 'A' ? 'bg-blue-100 text-blue-700' : t === 'B' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{t}</span>
  }

  const gruposVisibles = todosGrupos
    ? (filtroTrip === 'todos' ? todosGrupos : todosGrupos.filter(g => g.tripulacion === filtroTrip))
    : []

  const trips = todosGrupos ? [...new Set(todosGrupos.map(g => g.tripulacion))].sort() : []
  const mapeoCompleto = todosGrupos && todosGrupos.some(g => g.linea_id !== null)
  const sinMapeo = todosGrupos ? todosGrupos.filter(g => !g.auto_mapeado).length : 0

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="font-semibold text-gray-700">📊 Cargar Numérico desde Excel</h2>
      <p className="text-sm text-gray-500">
        Sube el archivo Excel de Numérico. La app detectará automáticamente cada línea y tripulación
        usando la tabla de nomenclaturas configurada. Si hay grupos sin mapear, podrás asignarlos manualmente.
      </p>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => { setFile(e.target.files[0]); setTodosGrupos(null); setGuardadoMsg(null) }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 cursor-pointer"
        />
        <button
          onClick={handleParse}
          disabled={!file || parsing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {parsing ? 'Leyendo…' : '🔍 Analizar Excel'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {todosGrupos && (
        <>
          {/* Resumen auto-mapeo */}
          <div className="flex gap-3 flex-wrap text-xs">
            <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full font-medium">
              ✅ Auto-mapeados: {todosGrupos.filter(g => g.auto_mapeado).length}
            </span>
            {sinMapeo > 0 && (
              <span className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-medium">
                ⚠️ Sin mapear: {sinMapeo} — asigna manualmente abajo
              </span>
            )}
          </div>

          {/* Filtro por tripulación */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Filtrar por tripulación:</span>
            {['todos', ...trips].map(t => (
              <button
                key={t}
                onClick={() => setFiltroTrip(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  filtroTrip === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {t === 'todos' ? `Todas (${todosGrupos.length})` : `Trip. ${t} (${todosGrupos.filter(g => g.tripulacion === t).length})`}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b text-xs">
                <tr>
                  <th className="text-left p-2">Texto detectado en Excel</th>
                  <th className="text-left p-2">Supervisor(es)</th>
                  <th className="text-center p-2 w-16">Trip.</th>
                  <th className="text-center p-2 w-20">Conteo</th>
                  <th className="text-left p-2">→ Línea en App</th>
                </tr>
              </thead>
              <tbody>
                {gruposVisibles.map((g) => {
                  const realIdx = todosGrupos.indexOf(g)
                  return (
                    <tr key={realIdx} className={`border-t ${g.auto_mapeado ? (realIdx % 2 === 0 ? 'bg-green-50/30' : 'bg-green-50/60') : 'bg-yellow-50'}`}>
                      <td className="p-2 text-gray-700 text-xs font-medium">
                        {g.texto_excel}
                        {g.auto_mapeado && <span className="ml-1 text-green-500 text-xs">✓</span>}
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {g.supervisores && g.supervisores.length > 0
                          ? g.supervisores.join(', ')
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-2 text-center">{tripBadge(g.tripulacion)}</td>
                      <td className="p-2 text-center font-bold text-blue-700">{g.conteo}</td>
                      <td className="p-2">
                        {g.auto_mapeado && g.linea_nombre_ref ? (
                          <span className="text-green-700 text-xs font-semibold bg-green-100 px-2 py-1 rounded-lg">
                            {g.linea_nombre_ref}
                          </span>
                        ) : (
                          <select
                            value={g.linea_id ?? ''}
                            onChange={(e) => handleMapeo(realIdx, e.target.value || null)}
                            className={`w-full border rounded-lg px-2 py-1 text-xs outline-none ${
                              g.linea_id ? 'border-green-400 bg-green-50' : 'border-yellow-400 bg-yellow-50'
                            }`}
                          >
                            <option value="">— Seleccionar línea —</option>
                            {lineas.map(l => (
                              <option key={l.id} value={l.id}>{l.area_nombre} › {l.nombre}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleGuardar}
              disabled={guardando || !mapeoCompleto}
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
              {guardando ? 'Guardando…' : '💾 Guardar Numérico'}
            </button>
            <button
              onClick={() => { setTodosGrupos(null); setFile(null); setGuardadoMsg(null) }}
              className="text-gray-500 text-sm hover:text-gray-700 underline"
            >
              Cancelar
            </button>
            {guardadoMsg && (
              <span className={`text-sm font-medium ${guardadoMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {guardadoMsg}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function ConfigPage() {
  const [pin, setPin] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [verificando, setVerificando] = useState(false)

  // Cambio de PIN
  const [pinActual, setPinActual] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [pinConfirma, setPinConfirma] = useState('')
  const [pinMsg, setPinMsg] = useState(null)
  const [guardandoPin, setGuardandoPin] = useState(false)

  const [lineas, setLineas] = useState([])
  const [edits, setEdits] = useState({})           // personas, lets, pool por linea_id
  const [numericoEdits, setNumericoEdits] = useState({}) // numerico por linea_id (depende de trip)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [numericos, setNumericos] = useState([])   // [{linea_id, tripulacion, valor}] de la BD
  const [filtroTrip, setFiltroTrip] = useState(null)

  // Recalcula numericoEdits cuando cambia trip o cuando cambian los datos
  const calcNumericoEdits = (lineasData, numericosData, trip) => {
    const next = {}
    lineasData.forEach(l => {
      if (trip) {
        const found = numericosData.find(n => n.linea_id === l.id && n.tripulacion === trip)
        next[l.id] = found !== undefined ? String(found.valor) : ''
      } else {
        next[l.id] = l.numerico ? String(l.numerico) : ''
      }
    })
    setNumericoEdits(next)
  }

  const verificarPin = async () => {
    setVerificando(true)
    setPinError(false)
    try {
      const r = await axios.get('/api/config/pin-verify', { params: { pin } })
      if (r.data.ok) {
        setAutenticado(true)
      } else {
        setPinError(true)
      }
    } catch {
      setPinError(true)
    } finally {
      setVerificando(false)
    }
  }

  useEffect(() => {
    if (!autenticado) return
    Promise.all([axios.get('/api/lineas'), axios.get('/api/numerico')]).then(([rL, rN]) => {
      const ls = sortLineas(rL.data)
      const ns = rN.data
      setLineas(ls)
      setNumericos(ns)
      const inicial = {}
      ls.forEach((l) => {
        inicial[l.id] = {
          total_lideres: l.total_lideres || '',
          personas_autorizadas: l.personas_autorizadas || '',
          pool_autorizado: l.pool_autorizado || '',
        }
      })
      setEdits(inicial)
      calcNumericoEdits(ls, ns, null)
    })
  }, [autenticado])

  // Al cambiar el filtro de trip, recalcula numéricos mostrados
  const handleFiltroTrip = (trip) => {
    setFiltroTrip(trip)
    calcNumericoEdits(lineas, numericos, trip)
    setSaved({})
  }

  const handleChange = (lineaId, field, value) => {
    if (field === 'numerico') {
      setNumericoEdits(prev => ({ ...prev, [lineaId]: value }))
    } else {
      setEdits((prev) => ({ ...prev, [lineaId]: { ...prev[lineaId], [field]: value } }))
    }
    setSaved((prev) => ({ ...prev, [lineaId]: false }))
  }

  const handleSave = async (linea) => {
    const e = edits[linea.id]
    const numStr = numericoEdits[linea.id] ?? ''
    const numVal = parseInt(numStr) || 0
    setSaving((prev) => ({ ...prev, [linea.id]: true }))
    try {
      // Guarda plantilla base (igual para todas las trips)
      await axios.put(`/api/lineas/${linea.id}/config`, {
        total_lideres: parseInt(e.total_lideres) || 0,
        personas_autorizadas: parseInt(e.personas_autorizadas) || 0,
        pool_autorizado: parseInt(e.pool_autorizado) || 0,
        numerico: numVal,
      })
      // Guarda numérico por tripulación si hay trip seleccionada
      if (filtroTrip && numStr !== '') {
        await axios.put(`/api/numerico/${linea.id}/${filtroTrip}`, { valor: numVal })
        setNumericos(prev => {
          const filtered = prev.filter(n => !(n.linea_id === linea.id && n.tripulacion === filtroTrip))
          return [...filtered, { linea_id: linea.id, tripulacion: filtroTrip, valor: numVal }]
        })
      }
      setSaved((prev) => ({ ...prev, [linea.id]: true }))
    } finally {
      setSaving((prev) => ({ ...prev, [linea.id]: false }))
    }
  }

  const handleCambiarPin = async () => {
    setPinMsg(null)
    if (pinNuevo.length < 4) {
      setPinMsg({ type: 'error', text: 'El PIN nuevo debe tener al menos 4 caracteres.' })
      return
    }
    if (pinNuevo !== pinConfirma) {
      setPinMsg({ type: 'error', text: 'El PIN nuevo y la confirmación no coinciden.' })
      return
    }
    setGuardandoPin(true)
    try {
      await axios.put('/api/config/pin', { pin_actual: pinActual, pin_nuevo: pinNuevo })
      setPinMsg({ type: 'success', text: '✅ PIN cambiado correctamente.' })
      setPinActual(''); setPinNuevo(''); setPinConfirma('')
      // Actualizar sesión con nuevo PIN
      setPin(pinNuevo)
    } catch (e) {
      setPinMsg({ type: 'error', text: e.response?.data?.detail || '❌ Error al cambiar el PIN.' })
    } finally {
      setGuardandoPin(false)
    }
  }

  const totalAutorizado = (id) => {
    const e = edits[id]
    if (!e) return '—'
    const p = parseInt(e.personas_autorizadas)
    const l = parseInt(e.total_lideres)
    const pool = parseInt(e.pool_autorizado)
    if (isNaN(p) || isNaN(l) || isNaN(pool)) return '—'
    return p + l + pool
  }

  const diferencia = (id) => {
    const total = totalAutorizado(id)
    if (total === '—') return '—'
    const numStr = numericoEdits[id] ?? ''
    const num = parseInt(numStr)
    if (numStr === '' || isNaN(num)) return '—'
    return num - total
  }

  // ── Pantalla de PIN ──────────────────────────────────────────────────────────
  if (!autenticado) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-4">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">Área de Configuración</h1>
          <p className="text-sm text-gray-400 mb-6">Solo para Planner / Business Manager</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && verificarPin()}
            placeholder="Ingresa el PIN"
            maxLength={20}
            className={`w-full border rounded-xl px-4 py-3 text-center text-xl tracking-widest outline-none mb-3 ${
              pinError ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {pinError && <p className="text-red-500 text-sm mb-3">❌ PIN incorrecto</p>}
          <button
            onClick={verificarPin}
            disabled={verificando}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {verificando ? 'Verificando…' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  // ── Pantalla de configuración ────────────────────────────────────────────────
  const porArea = lineas.reduce((acc, l) => {
    if (!acc[l.area_nombre]) acc[l.area_nombre] = []
    acc[l.area_nombre].push(l)
    return acc
  }, {})

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Configuración de Plantilla Autorizada</h1>
        <button onClick={() => setAutenticado(false)} className="text-sm text-gray-400 hover:text-gray-600">
          🔒 Cerrar sesión
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Instrucciones:</strong> Ingresa los números autorizados por línea. El <strong>Total Autorizado</strong> se calcula automáticamente. Haz clic en <strong>Guardar</strong> en cada línea que modifiques.
      </div>

      {/* ── Selector de Tripulación para Numérico ──────────────────────────── */}
      <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-700">📋 Ver Numérico por Tripulación:</span>
        {[null, 'A', 'B', 'C'].map(t => (
          <button
            key={t ?? 'todos'}
            onClick={() => handleFiltroTrip(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filtroTrip === t
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {t === null ? 'General' : `Tripulación ${t}`}
          </button>
        ))}
        {filtroTrip && (
          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            📊 Mostrando numérico de Trip. {filtroTrip} — edita y guarda para actualizar
          </span>
        )}
      </div>

      {Object.entries(porArea).map(([area, areaLineas]) => (
        <div key={area} className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="bg-gray-700 text-white px-5 py-3 font-bold text-sm uppercase tracking-wider">
            🏭 {area}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="text-left p-3">Línea</th>
                  <th className="text-center p-3">Personas<br/><span className="font-normal text-xs text-gray-400">Operadores</span></th>
                  <th className="text-center p-3">Lets<br/><span className="font-normal text-xs text-gray-400">Líderes</span></th>
                  <th className="text-center p-3">Pool</th>
                  <th className="text-center p-3 font-bold text-blue-700">Total<br/><span className="font-normal text-xs">Autorizado</span></th>
                  <th className="text-center p-3 font-bold text-gray-700 bg-yellow-50">Numérico<br/><span className="font-normal text-xs text-gray-400">Captura BM</span></th>
                  <th className="text-center p-3 font-bold bg-green-50">Diferencia<br/><span className="font-normal text-xs text-gray-400">Aut. − Num.</span></th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {areaLineas.map((linea, i) => (
                  <tr key={linea.id} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-3 font-medium text-gray-800">{linea.nombre}</td>
                    {['personas_autorizadas', 'total_lideres', 'pool_autorizado'].map((field) => (
                      <td key={field} className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={edits[linea.id]?.[field] ?? ''}
                          placeholder="—"
                          onChange={(e) => handleChange(linea.id, field, e.target.value)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:border-blue-500 outline-none placeholder-gray-300"
                        />
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <span className="text-lg font-bold text-blue-700">{totalAutorizado(linea.id)}</span>
                    </td>
                    {/* Numérico — captura BM/Planner, varía por tripulación */}
                    <td className="p-3 text-center bg-yellow-50">
                      <input
                        type="number"
                        min="0"
                        value={numericoEdits[linea.id] ?? ''}
                        placeholder="—"
                        onChange={(e) => handleChange(linea.id, 'numerico', e.target.value)}
                        className="w-16 border border-yellow-300 rounded-lg px-2 py-1 text-center focus:border-yellow-500 outline-none placeholder-gray-300 bg-white"
                      />
                    </td>
                    {/* Diferencia — calculada */}
                    <td className="p-3 text-center bg-green-50">
                      {(() => {
                        const diff = diferencia(linea.id)
                        if (diff === '—') return <span className="text-gray-400">—</span>
                        return (
                          <span className={`text-base font-bold ${diff >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleSave(linea)}
                        disabled={saving[linea.id]}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          saved[linea.id]
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
                        }`}
                      >
                        {saving[linea.id] ? '...' : saved[linea.id] ? '✅ Guardado' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── Carga de Excel Numérico ──────────────────────────────────────────── */}
      <CargaNumerico lineas={lineas} onGuardado={async () => {
        const r = await axios.get('/api/numerico')
        setNumericos(r.data)
        calcNumericoEdits(lineas, r.data, filtroTrip)
      }} />

      {/* ── Cambiar PIN ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">🔑 Cambiar PIN de acceso</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">PIN actual</label>
            <input
              type="password"
              value={pinActual}
              onChange={(e) => setPinActual(e.target.value)}
              placeholder="PIN actual"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">PIN nuevo</label>
            <input
              type="password"
              value={pinNuevo}
              onChange={(e) => setPinNuevo(e.target.value)}
              placeholder="Mín. 4 caracteres"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Confirmar PIN nuevo</label>
            <input
              type="password"
              value={pinConfirma}
              onChange={(e) => setPinConfirma(e.target.value)}
              placeholder="Repetir PIN nuevo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>
        </div>
        {pinMsg && (
          <p className={`mt-2 text-sm font-medium ${pinMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {pinMsg.text}
          </p>
        )}
        <button
          onClick={handleCambiarPin}
          disabled={guardandoPin}
          className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {guardandoPin ? 'Guardando…' : 'Cambiar PIN'}
        </button>
      </div>
    </div>
  )
}
