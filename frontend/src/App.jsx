import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import SupervisorPage from './pages/SupervisorPage'
import ManagerPage from './pages/ManagerPage'
import ConfigPage from './pages/ConfigPage'
import ManualPage from './pages/ManualPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <main className="max-w-6xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/supervisor" element={<SupervisorPage />} />
            <Route path="/gerente" element={<ManagerPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/manual" element={<ManualPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
