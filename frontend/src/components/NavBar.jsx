import { Link, useLocation } from 'react-router-dom'

export default function NavBar() {
  const { pathname } = useLocation()
  const link = (to, label) => (
    <Link
      to={to}
      className={`px-2 py-1 rounded transition-colors text-sm whitespace-nowrap ${
        pathname === to ? 'bg-blue-600' : 'hover:bg-blue-700'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="GM Logo" className="h-8 w-8 rounded-lg flex-shrink-0" />
          <span className="font-bold text-sm sm:text-xl truncate">Incidencias de Producción</span>
        </div>
        <div className="flex gap-1 sm:gap-3 flex-shrink-0">
          {link('/', 'Inicio')}
          {link('/supervisor', '👷 Líder')}
          {link('/gerente', '📊 Gerente')}
        </div>
      </div>
    </nav>
  )
}
