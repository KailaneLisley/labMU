import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../lib/session";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  if (!getSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
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
