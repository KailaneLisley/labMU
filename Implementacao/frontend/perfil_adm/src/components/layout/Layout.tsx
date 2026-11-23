import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../../lib/session";
import { canAccessPath, getHomePath } from "../../lib/permissions";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Mesmo digitando a URL diretamente, cada perfil só alcança as próprias telas.
  if (!canAccessPath(location.pathname, session.user.role)) {
    return <Navigate to={getHomePath(session.user.role)} replace />;
  }

  return (
    <div className="flex h-screen bg-[#fff9f6]">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
