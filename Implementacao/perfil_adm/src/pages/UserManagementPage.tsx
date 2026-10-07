import { useState, useMemo } from "react";
import { Plus, Edit2, MoreVertical, Search } from "lucide-react";

type UserRole = "tecnico" | "aluno" | "professor" | "administrador";
type UserStatus = "ativo" | "inativo" | "pendente";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  registration: string;
  phone: string;
  status: UserStatus;
  initials: string;
  avatarColor: string;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Lucas Vasconcolos",
    email: "lucas.vasconcolos@unicap.br",
    role: "tecnico",
    registration: "282119489",
    phone: "(81) 2119-4102 • Ramal 14",
    status: "ativo",
    initials: "LV",
    avatarColor: "bg-orange-200",
  },
  {
    id: "2",
    name: "Beatriz Albuquerque",
    email: "b.albuquerque@aluno.unicap.br",
    role: "aluno",
    registration: "282208192",
    phone: "(81) 99614-2209",
    status: "ativo",
    initials: "BA",
    avatarColor: "bg-gray-200",
  },
  {
    id: "3",
    name: "Prof. Carlos Eduardo",
    email: "carlos.mendes@unicap.br",
    role: "professor",
    registration: "199843210",
    phone: "(81) 2119-4088 • Ópio Arq",
    status: "ativo",
    initials: "CE",
    avatarColor: "bg-blue-200",
  },
  {
    id: "4",
    name: "Renata Mendes",
    email: "renata.mendes@unicap.br",
    role: "tecnico",
    registration: "201904732",
    phone: "(81) 2119-4102 • Ramal 18",
    status: "ativo",
    initials: "RM",
    avatarColor: "bg-orange-200",
  },
  {
    id: "5",
    name: "Dra. Sofia Arcoverde",
    email: "sofia.arcoverde@unicap.br",
    role: "administrador",
    registration: "201692100",
    phone: "(81) 2119-4000 • Ramal 01",
    status: "ativo",
    initials: "SA",
    avatarColor: "bg-pink-200",
  },
  {
    id: "6",
    name: "Mariana Lima",
    email: "mariana.lima@aluno.unicap.br",
    role: "aluno",
    registration: "282361988",
    phone: "(81) 98822-1094",
    status: "ativo",
    initials: "ML",
    avatarColor: "bg-purple-200",
  },
];

const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case "tecnico":
      return "bg-orange-100 text-orange-700";
    case "aluno":
      return "bg-gray-100 text-gray-700";
    case "professor":
      return "bg-blue-100 text-blue-700";
    case "administrador":
      return "bg-red-100 text-red-700";
  }
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case "tecnico":
      return "Técnico";
    case "aluno":
      return "Aluno";
    case "professor":
      return "Professor/Pesquisador";
    case "administrador":
      return "Administrador";
  }
};

export const UserManagementPage = (): JSX.Element => {
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | "all">("ativo");
  const [currentPage, setCurrentPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const roleMatch = selectedRole === "all" || user.role === selectedRole;
      const statusMatch = selectedStatus === "all" || user.status === selectedStatus;
      const searchMatch =
        searchQuery === "" ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.registration.includes(searchQuery);

      return roleMatch && statusMatch && searchMatch;
    });
  }, [selectedRole, searchQuery, selectedStatus]);

  const roleCounts = {
    all: mockUsers.length,
    tecnico: mockUsers.filter((u) => u.role === "tecnico").length,
    aluno: mockUsers.filter((u) => u.role === "aluno").length,
    professor: mockUsers.filter((u) => u.role === "professor").length,
    administrador: mockUsers.filter((u) => u.role === "administrador").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#8B1329] mb-2">Gestão de Usuários</h1>
            <p className="text-sm text-[#7a6e70]">
              Controle de acesso de administradores, técnicos de bancada e clientes da rede de prototipagem MUSARQ.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#efe6e6] rounded-lg font-semibold hover:bg-[#f7f0f0] transition-colors text-sm">
              👤 + Novo Técnico
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors text-sm">
              <Plus className="w-4 h-4" />
              + Novo Cliente
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-[#efe6e6] overflow-x-auto">
          {[
            { key: "all", label: "Todos", count: roleCounts.all },
            { key: "tecnico", label: "Técnicos", count: roleCounts.tecnico },
            { key: "aluno", label: "Clientes", count: roleCounts.aluno },
            { key: "administrador", label: "Administradores", count: roleCounts.administrador },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedRole(tab.key as any)}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                selectedRole === tab.key
                  ? "border-[#8B1329] text-[#8B1329]"
                  : "border-transparent text-[#7a6e70] hover:text-[#1f1a1b]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7a6e70]" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white transition-colors"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-4 py-2 border border-[#efe6e6] rounded-lg bg-white focus:outline-none focus:border-[#8B1329] text-sm font-medium"
          >
            <option value="ativo">Status: Ativos</option>
            <option value="inativo">Status: Inativos</option>
            <option value="pendente">Status: Pendentes</option>
            <option value="all">Todos os Status</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Perfil / Papel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Matrícula / RA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Telefone / Ramal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#7a6e70] uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#efe6e6] hover:bg-[#fef3c7]/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center font-semibold text-sm text-[#1f1a1b]`}>
                        {user.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1f1a1b]">{user.name}</p>
                        <p className="text-xs text-[#7a6e70]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1f1a1b]">{user.registration}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1f1a1b]">{user.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      <span className="text-sm font-semibold text-[#1f1a1b]">Ativo</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-[#f7f0f0] rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-[#8B1329]" />
                      </button>
                      <div className="relative">
                        <button
                          className="p-2 hover:bg-[#f7f0f0] rounded-lg transition-colors"
                          onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        >
                          <MoreVertical className="w-4 h-4 text-[#7a6e70]" />
                        </button>
                        {menuOpen === user.id && (
                          <div className="absolute right-0 mt-1 bg-white border border-[#efe6e6] rounded-lg shadow-lg z-10 min-w-[150px]">
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#f7f0f0] transition-colors">
                              Editar
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#f7f0f0] transition-colors">
                              Ver Detalhes
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              Desativar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between text-sm text-[#7a6e70]">
          <p>Mostrando 6 de 48 usuários credenciados</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded hover:bg-[#f7f0f0]">←</button>
            {[1, 2, 3, "...", 8].map((page, idx) => (
              <button
                key={idx}
                className={`px-3 py-2 rounded font-semibold ${
                  page === 1 ? "bg-[#8B1329] text-white" : "hover:bg-[#f7f0f0]"
                }`}
              >
                {page}
              </button>
            ))}
            <button className="px-3 py-2 rounded hover:bg-[#f7f0f0]">→</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
