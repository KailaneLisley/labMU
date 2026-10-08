import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UserManagementPage from './pages/UserManagementPage'
import MaintenanceManagementPage from './pages/MaintenanceManagementPage'
import StockSupplyPage from './pages/StockSupplyPage'
import LoanEquipmentPage from './pages/LoanEquipmentPage'
import RegisterEquipmentPage from './pages/RegisterEquipmentPage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import MachinesPage from './pages/MachinesPage'
import RegisterSupplyEntryPage from './pages/RegisterSupplyEntryPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route (sem Layout) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes (com Layout) */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/usuarios" element={<UserManagementPage />} />
                <Route path="/manutencao" element={<MaintenanceManagementPage />} />
                <Route path="/estoque" element={<StockSupplyPage />} />
                <Route path="/emprestimo" element={<LoanEquipmentPage />} />
                <Route path="/emprestimo/registrar" element={<RegisterEquipmentPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/editar-perfil" element={<EditProfilePage />} />
                <Route path="/maquinas" element={<MachinesPage />} />
                <Route path="/estoque/registrar-entrada" element={<RegisterSupplyEntryPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
