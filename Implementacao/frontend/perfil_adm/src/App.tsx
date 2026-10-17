import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout'
import { LoginPage, RegisterPage } from './pages/auth'
import { DashboardPage } from './pages/dashboard'
import { UserManagementPage } from './pages/users'
import { MaintenanceManagementPage } from './pages/maintenance'
import { StockSupplyPage, RegisterSupplyEntryPage } from './pages/stock'
import { LoanEquipmentPage, RegisterEquipmentPage } from './pages/loans'
import { ProfilePage, EditProfilePage } from './pages/profile'
import { MachinesPage } from './pages/machines'
import { ReportsPage } from './pages/reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route (sem Layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

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
