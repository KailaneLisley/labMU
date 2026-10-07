import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";

type LoanStatus = "em_campo" | "atrasado" | "devolucao_hoje";

interface Equipment {
  id: string;
  name: string;
  code: string;
  responsible: string;
  dueDate: string;
  status: LoanStatus;
}

const mockEquipment: Equipment[] = [
  {
    id: "1",
    name: "Scanner 3D EinScan 5E",
    code: "#3841",
    responsible: "Beatriz Alencar",
    dueDate: "Ontem, 18:00",
    status: "atrasado",
  },
  {
    id: "2",
    name: "Paquímetro Digital Mitutoyo 150mm",
    code: "#M4",
    responsible: "Prof. Carlos Mendes",
    dueDate: "Hoje, 17:30",
    status: "devolucao_hoje",
  },
  {
    id: "3",
    name: "Câmera Térmica Flir C5",
    code: "#1892",
    responsible: "Lucas Vasconcolos",
    dueDate: "28/10/2024 (12:00)",
    status: "em_campo",
  },
  {
    id: "4",
    name: "Kit Lentes Macro Canon 100mm",
    code: "#OPT-02",
    responsible: "Mariana Duarte",
    dueDate: "Hoje, 16:00",
    status: "em_campo",
  },
];

const getStatusColor = (status: LoanStatus) => {
  switch (status) {
    case "em_campo":
      return "bg-purple-100 text-purple-700";
    case "atrasado":
      return "bg-orange-100 text-orange-700";
    case "devolucao_hoje":
      return "bg-yellow-100 text-yellow-700";
  }
};

const getStatusLabel = (status: LoanStatus) => {
  switch (status) {
    case "em_campo":
      return "Em Campo";
    case "atrasado":
      return "Atrasado";
    case "devolucao_hoje":
      return "Devolução Hoje";
  }
};

export const LoanEquipmentPage = (): JSX.Element => {
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | "todos">("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEquipment = useMemo(() => {
    return mockEquipment.filter((item) => {
      const statusMatch = selectedStatus === "todos" || item.status === selectedStatus;
      const searchMatch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.responsible.toLowerCase().includes(searchQuery.toLowerCase());

      return statusMatch && searchMatch;
    });
  }, [selectedStatus, searchQuery]);

  const statusCounts = {
    todos: mockEquipment.length,
    em_campo: mockEquipment.filter((e) => e.status === "em_campo").length,
    atrasado: mockEquipment.filter((e) => e.status === "atrasado").length,
    devolucao_hoje: mockEquipment.filter((e) => e.status === "devolucao_hoje").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#1f1a1b]">Empréstimos de Equipamentos</h1>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors">
            <Plus className="w-4 h-4" />
            + Novo Equipamento
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Ativos</p>
            <p className="text-5xl font-bold text-[#1f1a1b]">0{statusCounts.em_campo}</p>
            <p className="text-xs text-[#7a6e70] mt-1">equipamentos em campo</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Devoluções Hoje</p>
            <p className="text-5xl font-bold text-[#8B1329]">0{statusCounts.devolucao_hoje}</p>
            <p className="text-xs text-[#7a6e70] mt-1">devoluções previstas</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Em Atraso</p>
            <p className="text-5xl font-bold text-yellow-600">0{statusCounts.atrasado}</p>
            <p className="text-xs text-[#7a6e70] mt-1">equipamento atrasado</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-[#efe6e6] overflow-x-auto">
          {[
            { key: "todos", label: "Todos", count: statusCounts.todos },
            { key: "em_campo", label: "Ativos", count: statusCounts.em_campo },
            { key: "atrasado", label: "Atrasados", count: statusCounts.atrasado },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key as any)}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                selectedStatus === tab.key
                  ? "border-[#8B1329] text-[#8B1329]"
                  : "border-transparent text-[#7a6e70] hover:text-[#1f1a1b]"
              }`}
            >
              {tab.label} <span className="text-xs ml-1">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7a6e70]" />
            <input
              type="text"
              placeholder="Buscar empréstimo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Equipamento</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Responsável</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Devolução Prevista</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="border-b border-[#efe6e6] hover:bg-[#fef3c7]/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#1f1a1b]">{item.name}</p>
                    <p className="text-xs text-[#7a6e70]">{item.code}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1f1a1b]">{item.responsible}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1f1a1b]">{item.dueDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm font-semibold text-[#8B1329] hover:text-[#6b0f1f]">
                      Registrar Devolução
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between text-sm text-[#7a6e70]">
          <p>Mostrando {filteredEquipment.length} empréstimos ativos</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded hover:bg-[#f7f0f0]">←</button>
            {[1, 2].map((page) => (
              <button
                key={page}
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

export default LoanEquipmentPage;
