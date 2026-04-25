import { Link, useLocation } from 'react-router-dom'

export default function NavBar() {
  const { pathname } = useLocation()
  const link = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-1 rounded transition-colors ${
        pathname === to ? 'bg-blue-600' : 'hover:bg-blue-700'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="GM Logo" className="h-10 w-10 rounded-lg" />
          <span className="font-bold text-xl">Incidencias de Producción</span>
        </div>
        <div className="flex gap-3">
          {link('/', 'Inicio')}
          {link('/supervisor', '👷 Líder de Grupo')}
          {link('/gerente', '📊 Gerente')}
        </div>
      </div>
    </nav>
  )
}
