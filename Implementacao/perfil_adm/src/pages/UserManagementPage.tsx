import { FormEvent, useEffect, useState, useMemo } from "react";
import { Plus, Edit2, MoreVertical, Search } from "lucide-react";
import { usePersistentState } from "../hooks/usePersistentState";

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

const INITIAL_USERS: User[] = [
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
  const [users, setUsers] = usePersistentState<User[]>("labmu:users", INITIAL_USERS);
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | "all">("ativo");
  const [currentPage, setCurrentPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editorRole, setEditorRole] = useState<UserRole | "aluno" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", registration: "", phone: "" });
  const pageSize = 5;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatch = selectedRole === "all" || user.role === selectedRole;
      const statusMatch = selectedStatus === "all" || user.status === selectedStatus;
      const searchMatch =
        searchQuery === "" ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.registration.includes(searchQuery);

      return roleMatch && statusMatch && searchMatch;
    });
  }, [users, selectedRole, searchQuery, selectedStatus]);

  const roleCounts = {
    all: users.length,
    tecnico: users.filter((u) => u.role === "tecnico").length,
    aluno: users.filter((u) => u.role === "aluno").length,
    professor: users.filter((u) => u.role === "professor").length,
    administrador: users.filter((u) => u.role === "administrador").length,
  };
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const openEditor = (role: UserRole | "aluno", user?: User) => {
    setEditorRole(role);
    setEditingUserId(user?.id ?? null);
    setEditorError("");
    setFormData(
      user
        ? { name: user.name, email: user.email, registration: user.registration, phone: user.phone }
        : { name: "", email: "", registration: "", phone: "" },
    );
    setMenuOpen(null);
  };

  const handleSaveUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editorRole) return;
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const duplicateEmail = users.some(
      (user) => user.email.toLowerCase() === email && user.id !== editingUserId,
    );
    if (duplicateEmail) {
      setEditorError("Já existe um usuário cadastrado com este e-mail.");
      return;
    }
    const duplicateRegistration = users.some(
      (user) =>
        user.registration === formData.registration.trim() &&
        user.id !== editingUserId,
    );
    if (duplicateRegistration) {
      setEditorError("Já existe um usuário cadastrado com esta matrícula.");
      return;
    }
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    if (editingUserId) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUserId
            ? { ...user, ...formData, name, email, initials }
            : user,
        ),
      );
    } else {
      setUsers((current) => [
        ...current,
        {
          id: `${Date.now()}`,
          name,
          email,
          registration: formData.registration.trim(),
          phone: formData.phone.trim(),
          role: editorRole,
          status: "ativo",
          initials,
          avatarColor: "bg-[#fdeaea]",
        },
      ]);
    }
    setEditorRole(null);
    setEditorError("");
  };

  const toggleUserStatus = (id: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id ? { ...user, status: user.status === "ativo" ? "inativo" : "ativo" } : user,
      ),
    );
    setMenuOpen(null);
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
            <button onClick={() => openEditor("tecnico")} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#efe6e6] rounded-lg font-semibold hover:bg-[#f7f0f0] transition-colors text-sm">
              👤 + Novo Técnico
            </button>
            <button onClick={() => openEditor("aluno")} className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors text-sm">
              <Plus className="w-4 h-4" />
              + Novo Cliente
            </button>
          </div>
        </div>

        {editorRole && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSaveUser} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-[#8B1329]">
                {editingUserId ? "Editar usuário" : editorRole === "tecnico" ? "Novo técnico" : "Novo cliente"}
              </h2>
              {editorError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{editorError}</p>}
              <label className="block text-sm font-semibold">
                Nome completo
                <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                E-mail
                <input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Matrícula / RA
                <input required value={formData.registration} onChange={(event) => setFormData({ ...formData, registration: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Telefone / Ramal
                <input value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditorRole(null)} className="rounded-lg border border-[#efe6e6] px-4 py-2">Cancelar</button>
                <button type="submit" className="rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Salvar usuário</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-[#efe6e6] overflow-x-auto">
          {([
            { key: "all", label: "Todos", count: roleCounts.all },
            { key: "tecnico", label: "Técnicos", count: roleCounts.tecnico },
            { key: "aluno", label: "Clientes", count: roleCounts.aluno },
            { key: "administrador", label: "Administradores", count: roleCounts.administrador },
          ] as { key: UserRole | "all" | "aluno"; label: string; count: number }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedRole(tab.key === "aluno" ? "aluno" : tab.key);
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white transition-colors"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all" || value === "ativo" || value === "inativo" || value === "pendente") {
                setSelectedStatus(value);
                setCurrentPage(1);
              }
            }}
            className="px-4 py-2 border border-[#efe6e6] rounded-lg bg-white focus:outline-none focus:border-[#8B1329] text-sm font-medium"
          >
            <option value="ativo">Status: Ativos</option>
            <option value="inativo">Status: Inativos</option>
            <option value="pendente">Status: Pendentes</option>
            <option value="all">Todos os Status</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[760px]">
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
              {pageUsers.map((user) => (
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
                      <span className={`w-2 h-2 rounded-full ${user.status === "ativo" ? "bg-green-600" : user.status === "inativo" ? "bg-gray-400" : "bg-yellow-500"}`}></span>
                      <span className="text-sm font-semibold text-[#1f1a1b] capitalize">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditor(user.role, user)}
                        aria-label={`Editar ${user.name}`}
                        className="p-2 hover:bg-[#f7f0f0] rounded-lg transition-colors"
                      >
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
                            <button onClick={() => openEditor(user.role, user)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f7f0f0] transition-colors">
                              Editar
                            </button>
                            <button onClick={() => {
                              setSelectedUser(user);
                              setMenuOpen(null);
                            }} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f7f0f0] transition-colors">
                              Ver Detalhes
                            </button>
                            <button onClick={() => toggleUserStatus(user.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              {user.status === "ativo" ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {pageUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#7a6e70]">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between text-sm text-[#7a6e70]">
          <p>
            Mostrando {pageUsers.length} de {filteredUsers.length} usuários
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Página anterior"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="px-3 py-2 rounded hover:bg-[#f7f0f0] disabled:opacity-40"
            >←</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded font-semibold ${
                  page === currentPage ? "bg-[#8B1329] text-white" : "hover:bg-[#f7f0f0]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              aria-label="Próxima página"
              disabled={currentPage === pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              className="px-3 py-2 rounded hover:bg-[#f7f0f0] disabled:opacity-40"
            >→</button>
          </div>
        </div>
        {selectedUser && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
            <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 shadow-xl">
              <h2 id="user-detail-title" className="text-xl font-bold text-[#8B1329]">{selectedUser.name}</h2>
              <p><strong>Perfil:</strong> {getRoleLabel(selectedUser.role)}</p>
              <p><strong>E-mail:</strong> {selectedUser.email}</p>
              <p><strong>Matrícula:</strong> {selectedUser.registration}</p>
              <p><strong>Telefone:</strong> {selectedUser.phone || "Não informado"}</p>
              <p><strong>Status:</strong> {selectedUser.status}</p>
              <button onClick={() => setSelectedUser(null)} className="mt-2 rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
