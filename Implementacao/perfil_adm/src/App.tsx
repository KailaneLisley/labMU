import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/editar-perfil" element={<EditProfilePage />} />
        <Route path="/" element={<Navigate to="/perfil" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
