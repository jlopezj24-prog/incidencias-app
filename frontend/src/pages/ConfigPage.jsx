import { useState, useEffect } from 'react'
import axios from 'axios'

const PIN_CORRECTO = '1234'

export default function ConfigPage() {
  const [pin, setPin] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [pinError, setPinError] = useState(false)

  const [lineas, setLineas] = useState([])
  const [edits, setEdits] = useState({}) // { [linea_id]: { total_lideres, personas_autorizadas, pool_autorizado } }
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  const verificarPin = () => {
    if (pin === PIN_CORRECTO) {
      setAutenticado(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  useEffect(() => {
    if (!autenticado) return
    axios.get('/api/lineas').then((r) => {
      setLineas(r.data)
      const inicial = {}
      r.data.forEach((l) => {
        inicial[l.id] = {
          total_lideres: l.total_lideres,
          personas_autorizadas: l.personas_autorizadas,
          pool_autorizado: l.pool_autorizado,
        }
      })
      setEdits(inicial)
    })
  }, [autenticado])

  const handleChange = (lineaId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [lineaId]: { ...prev[lineaId], [field]: parseInt(value) || 0 },
    }))
    setSaved((prev) => ({ ...prev, [lineaId]: false }))
  }

  const handleSave = async (linea) => {
    setSaving((prev) => ({ ...prev, [linea.id]: true }))
    try {
      await axios.put(`/api/lineas/${linea.id}/config`, edits[linea.id])
      setSaved((prev) => ({ ...prev, [linea.id]: true }))
    } finally {
      setSaving((prev) => ({ ...prev, [linea.id]: false }))
    }
  }

  const totalAutorizado = (id) => {
    const e = edits[id]
    if (!e) return 0
    return (e.total_lideres || 0) + (e.personas_autorizadas || 0) + (e.pool_autorizado || 0)
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
            maxLength={10}
            className={`w-full border rounded-xl px-4 py-3 text-center text-xl tracking-widest outline-none mb-3 ${
              pinError ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {pinError && (
            <p className="text-red-500 text-sm mb-3">❌ PIN incorrecto</p>
          )}
          <button
            onClick={verificarPin}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  // ── Pantalla de configuración ────────────────────────────────────────────────
  // Agrupar por área
  const porArea = lineas.reduce((acc, l) => {
    if (!acc[l.area_nombre]) acc[l.area_nombre] = []
    acc[l.area_nombre].push(l)
    return acc
  }, {})

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Configuración de Plantilla Autorizada</h1>
        <button
          onClick={() => setAutenticado(false)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          🔒 Cerrar sesión
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Instrucciones:</strong> Ingresa los números autorizados por línea (Personas operadoras, Lets/Líderes y Pool).
        El <strong>Total Autorizado</strong> se calcula automáticamente. Haz clic en <strong>Guardar</strong> en cada línea que modifiques.
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
                          value={edits[linea.id]?.[field] ?? 0}
                          onChange={(e) => handleChange(linea.id, field, e.target.value)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:border-blue-500 outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <span className="text-lg font-bold text-blue-700">
                        {totalAutorizado(linea.id)}
                      </span>
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
    </div>
  )
}
