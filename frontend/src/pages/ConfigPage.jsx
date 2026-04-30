import { useState, useEffect } from 'react'
import axios from 'axios'

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
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

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
    axios.get('/api/lineas').then((r) => {
      setLineas(r.data)
      const inicial = {}
      r.data.forEach((l) => {
        inicial[l.id] = {
          total_lideres: l.total_lideres || '',
          personas_autorizadas: l.personas_autorizadas || '',
          pool_autorizado: l.pool_autorizado || '',
          numerico: l.numerico || '',
        }
      })
      setEdits(inicial)
    })
  }, [autenticado])

  const handleChange = (lineaId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [lineaId]: { ...prev[lineaId], [field]: value },
    }))
    setSaved((prev) => ({ ...prev, [lineaId]: false }))
  }

  const handleSave = async (linea) => {
    const e = edits[linea.id]
    setSaving((prev) => ({ ...prev, [linea.id]: true }))
    try {
      await axios.put(`/api/lineas/${linea.id}/config`, {
        total_lideres: parseInt(e.total_lideres) || 0,
        personas_autorizadas: parseInt(e.personas_autorizadas) || 0,
        pool_autorizado: parseInt(e.pool_autorizado) || 0,
        numerico: parseInt(e.numerico) || 0,
      })
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
    const e = edits[id]
    const num = parseInt(e.numerico)
    if (e.numerico === '' || isNaN(num)) return '—'
    const diff = num - total
    return diff
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
                    {/* Numérico — captura BM/Planner */}
                    <td className="p-3 text-center bg-yellow-50">
                      <input
                        type="number"
                        min="0"
                        value={edits[linea.id]?.numerico ?? ''}
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
