export default function DailyReport({ linea, area, fecha, lideres_presentes, total_lideres, incidencias }) {
  const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="bg-gray-900 text-green-400 rounded-lg p-5 font-mono text-sm leading-relaxed">
      <div className="text-white font-bold text-base">
        Línea {area} – {linea}
      </div>
      <div className="text-gray-400 text-xs mb-3">{fechaFormateada}</div>

      <div className="border-t border-gray-600 my-2" />

      {incidencias.length === 0 ? (
        <div className="text-gray-500 italic">Sin incidencias registradas</div>
      ) : (
        incidencias.map((inc, i) => (
          <div key={i}>
            <span className="text-yellow-300 font-semibold">{inc.cantidad}</span>{' '}
            {inc.tipo}
            {inc.notas && (
              <span className="text-gray-400 text-xs"> ({inc.notas})</span>
            )}
          </div>
        ))
      )}

      <div className="border-t border-gray-600 my-2" />

      <div className="text-cyan-300 font-semibold">
        {lideres_presentes} de {total_lideres} Lets libres
      </div>
    </div>
  )
}
