export default function ManualPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div className="bg-blue-800 text-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📋</span>
          <div>
            <h1 className="text-2xl font-bold">Manual de Usuario</h1>
            <p className="text-blue-200 text-sm">Sistema de Incidencias — GM Ensamble General</p>
          </div>
        </div>
        <p className="text-blue-100 text-sm mt-2">
          Guía rápida para supervisores de línea y shift leaders.
        </p>
      </div>

      {/* ROLES */}
      <Section title="👥 Roles en el sistema">
        <Table
          headers={['Rol', '¿Qué puede hacer?']}
          rows={[
            ['Supervisor / Líder', 'Capturar incidencias diarias de su línea'],
            ['Gerente', 'Ver dashboard, tablas y gráficas de todas las líneas'],
            ['Planner / BM', 'Configurar plantilla autorizada por línea (requiere PIN)'],
          ]}
        />
      </Section>

      {/* CAPTURA */}
      <Section title="👷 Captura de Incidencias">
        <p className="text-gray-500 text-sm mb-4">
          Accede desde el menú superior → <strong>👷 Líder</strong>
        </p>

        <Step number="1" title="Seleccionar línea y fecha">
          <Table
            headers={['Campo', 'Descripción']}
            rows={[
              ['Tripulación', 'Selecciona A, B o C según tu turno'],
              ['Área', 'Vestiduras o Chasis'],
              ['Línea', 'Tu línea de producción'],
              ['Fecha', 'Por defecto hoy. Puedes cambiarla para corregir días anteriores'],
              ['Lets presentes', 'Número de LETs que sí se presentaron ese día'],
            ]}
          />
          <Alert color="amber">
            Si ya existe un reporte para esa línea + tripulación + fecha, aparecerá un aviso naranja.
            El sistema pedirá confirmación antes de sobrescribir.
          </Alert>
        </Step>

        <Step number="2" title="Registrar incidencias">
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside mb-3">
            <li>Selecciona el <strong>Tipo de incidencia</strong></li>
            <li>Ingresa la <strong>Cantidad</strong> de personas afectadas</li>
            <li>Para Incapacidad, Restricción Médica o Embarazada: escribe el <strong>nombre del colaborador</strong> (obligatorio)</li>
            <li>Presiona <strong>"Agregar"</strong></li>
          </ol>
          <Table
            headers={['Tipo', '¿Cuándo usarlo?']}
            rows={[
              ['Falta Injustificada', 'Ausencia sin justificación'],
              ['Retardo', 'Llegó tarde a su turno'],
              ['Permiso Sin Goce', 'Permiso autorizado sin pago'],
              ['Permiso Por Paternidad', 'Por nacimiento de hijo'],
              ['Permiso por Defunción', 'Por fallecimiento de familiar'],
              ['Baja', 'Colaborador dado de baja definitiva'],
              ['Servicio Médico', 'Atención médica durante turno'],
              ['Vacaciones', 'Periodo vacacional programado'],
              ['Sanciones', 'Sanción disciplinaria'],
              ['Incapacidad ⚠️', 'Incapacidad médica — requiere nombre'],
              ['Restricción Médica ⚠️', 'Restricción de actividades — requiere nombre'],
              ['Embarazada ⚠️', 'Colaboradora embarazada — requiere nombre'],
            ]}
          />
        </Step>

        <Step number="3" title="Vista previa del reporte">
          <p className="text-sm text-gray-600">
            Antes de guardar verás el formato final del reporte con el resumen de LETs libres e incidencias del día.
          </p>
        </Step>

        <Step number="4" title="Guardar reporte" last>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Presiona el botón verde <strong>"💾 Guardar Reporte"</strong></li>
            <li>Si ya existía un reporte → aparece modal de confirmación</li>
            <li>Confirma con <strong>"Sí, sobrescribir"</strong> o cancela para seguir editando</li>
            <li>Mensaje de éxito: <span className="text-green-600 font-medium">✅ Reporte guardado correctamente</span></li>
          </ol>
        </Step>
      </Section>

      {/* GERENTE */}
      <Section title="📊 Dashboard del Gerente">
        <p className="text-gray-500 text-sm mb-4">
          Accede desde el menú superior → <strong>📊 Gerente</strong>
        </p>

        <h3 className="font-semibold text-gray-700 mb-2">Filtros disponibles</h3>
        <Table
          headers={['Filtro', 'Descripción']}
          rows={[
            ['Tripulación', 'Ver solo datos de Trip A, B o C'],
            ['Área', 'Filtrar por Vestiduras o Chasis'],
            ['Línea', 'Ver una línea específica'],
            ['Fecha inicio / fin', 'Rango de fechas a analizar'],
          ]}
        />

        <h3 className="font-semibold text-gray-700 mt-4 mb-2">Secciones</h3>
        <div className="space-y-2">
          {[
            ['🟦 Tabla Incidencias Ensamble', 'Plantilla + numérico + incidencias por tipo + LETs libres por línea'],
            ['📊 Resumen por Tipo', 'Tarjetas con el total de cada tipo en el período'],
            ['🏭 Resumen por Área', 'Barra de LETs libres % y desglose por tipo por área'],
            ['📋 Tabla por Área', 'Tabla cruzada de incidencias por tipo y área'],
            ['📈 Detalle por Línea', 'Incidencias por línea y tripulación. Clic en fila = historial de tendencia'],
            ['👥 Colaboradores', 'Lista de personas con incapacidad, restricción médica o embarazo'],
            ['📊 Gráfica por Tipo', 'Barras horizontales con volumen de cada tipo de incidencia'],
          ].map(([titulo, desc]) => (
            <div key={titulo} className="flex gap-3 text-sm bg-gray-50 rounded-xl p-3">
              <span className="font-semibold text-gray-800 min-w-[200px]">{titulo}</span>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>

        <Alert color="blue" className="mt-4">
          Presiona <strong>"📥 Exportar Excel"</strong> para descargar el reporte del período en formato .xlsx.
        </Alert>
      </Section>

      {/* FAQ */}
      <Section title="❓ Preguntas Frecuentes">
        <div className="space-y-4">
          {[
            [
              '¿Me equivoqué en un reporte ya guardado?',
              'Regresa a Captura, selecciona la misma línea, tripulación y fecha. El sistema cargará los datos. Haz las correcciones y guarda de nuevo — te pedirá confirmar el sobrescribir.',
            ],
            [
              '¿Puedo capturar incidencias de días anteriores?',
              'Sí. Cambia la fecha en el Paso 1. El gerente puede ver el historial completo.',
            ],
            [
              '¿Qué hago si la aplicación tarda en cargar?',
              'El servidor puede tardar hasta 1 minuto si estuvo inactivo. Espera y recarga la página.',
            ],
            [
              '¿Qué significa "LETs Libres"?',
              'Es el número de líderes (LETs) presentes y disponibles ese día. Se calcula restando las incidencias a los LETs presentes.',
            ],
            [
              '¿Los datos se guardan automáticamente?',
              'No. Debes presionar "💾 Guardar Reporte" para que queden registrados.',
            ],
          ].map(([q, a]) => (
            <div key={q} className="border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-gray-800 text-sm mb-1">❓ {q}</p>
              <p className="text-gray-500 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="text-center text-xs text-gray-400 pb-6">
        Sistema desarrollado para GM Ensamble General — Planta SLP
      </div>
    </div>
  )
}

/* ── Componentes de apoyo ──────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </section>
  )
}

function Step({ number, title, children, last = false }) {
  return (
    <div className={`flex gap-4 ${!last ? 'mb-6' : ''}`}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </div>
        {!last && <div className="w-0.5 bg-gray-200 flex-1 mt-2" />}
      </div>
      <div className="flex-1 pb-2">
        <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-600 border border-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Alert({ color = 'amber', children }) {
  const colors = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  }
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm mt-2 ${colors[color]}`}>
      {children}
    </div>
  )
}
