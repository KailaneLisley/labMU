import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import UserManagementPage from './pages/UserManagementPage'
import MaintenanceManagementPage from './pages/MaintenanceManagementPage'
import StockSupplyPage from './pages/StockSupplyPage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import MachinesPage from './pages/MachinesPage'
import RegisterSupplyEntryPage from './pages/RegisterSupplyEntryPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/usuarios" element={<UserManagementPage />} />
          <Route path="/manutencao" element={<MaintenanceManagementPage />} />
          <Route path="/estoque" element={<StockSupplyPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/editar-perfil" element={<EditProfilePage />} />
          <Route path="/maquinas" element={<MachinesPage />} />
          <Route path="/estoque/registrar-entrada" element={<RegisterSupplyEntryPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
