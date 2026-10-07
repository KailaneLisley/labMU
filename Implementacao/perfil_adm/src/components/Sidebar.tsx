import { LayoutDashboard, Users, Wrench, Package, Share2, FileText, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "usuarios", label: "Gestão de Usuários", icon: Users, path: "/usuarios" },
  { id: "maquinas", label: "Máquinas", icon: Wrench, path: "/maquinas" },
  { id: "manutencao", label: "Manutenção", icon: Home, path: "/manutencao" },
  { id: "estoque", label: "Estoque e Suprimentos", icon: Package, path: "/estoque/registrar-entrada" },
  { id: "emprestimo", label: "Empréstimo", icon: Share2, path: "/emprestimo" },
  { id: "relatorios", label: "Relatórios Gerenciais", icon: FileText, path: "/relatorios" },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-[#efe6e6] h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#efe6e6]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#8B1329] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">Ω</span>
          </div>
          <div>
            <p className="font-bold text-[#8B1329]">labMU</p>
            <p className="text-xs text-[#7a6e70]">MUSARQ • UNICAP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  active
                    ? "bg-[#8B1329] text-white"
                    : "text-[#7a6e70] hover:bg-[#fdeaea] hover:text-[#8B1329]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#efe6e6] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f7f0f0] rounded-full flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1f1a1b] truncate">Lucas Vasconcel</p>
            <p className="text-xs text-[#7a6e70] truncate">Técnico de Bancada</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
