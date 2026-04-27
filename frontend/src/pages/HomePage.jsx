import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center">
        <img src="/logo.png" alt="GM Logo" className="h-20 w-20 mx-auto mb-4 rounded-2xl shadow" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Sistema de Incidencias de Producción
        </h1>
        <p className="text-gray-500">Selecciona tu rol para continuar</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <Link
          to="/supervisor"
          className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-400 w-52 group"
        >
          <span className="text-6xl mb-3 group-hover:scale-110 transition-transform">👷</span>
          <span className="font-bold text-lg text-gray-700">Líder de Grupo</span>
          <span className="text-sm text-gray-400 text-center mt-1">Capturar incidencias del día</span>
        </Link>

        <Link
          to="/gerente"
          className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-400 w-52 group"
        >
          <span className="text-6xl mb-3 group-hover:scale-110 transition-transform">📊</span>
          <span className="font-bold text-lg text-gray-700">Gerente</span>
          <span className="text-sm text-gray-400 text-center mt-1">Dashboard y reportes históricos</span>
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-4">Desarrollado por Josue Emmanuel Lopez Juarez</p>
    </div>
  )
}
