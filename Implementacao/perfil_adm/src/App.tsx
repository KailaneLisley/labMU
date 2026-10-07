import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import MachinesPage from './pages/MachinesPage'
import RegisterSupplyEntryPage from './pages/RegisterSupplyEntryPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/editar-perfil" element={<EditProfilePage />} />
          <Route path="/maquinas" element={<MachinesPage />} />
          <Route path="/estoque/registrar-entrada" element={<RegisterSupplyEntryPage />} />
          <Route path="/" element={<Navigate to="/maquinas" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
