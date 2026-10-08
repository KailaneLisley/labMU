import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { downloadCsv } from "../lib/exportCsv";

type MaintenanceType = "preventiva" | "corretiva";
type MaintenanceStatus = "concluida" | "liberada" | "agendada";

interface MaintenanceRecord {
  id: string;
  machine: string;
  tag: string;
  date: string;
  type: MaintenanceType;
  technician: string;
  status: MaintenanceStatus;
  parts: boolean;
}

const mockRecords: MaintenanceRecord[] = [
  {
    id: "1",
    machine: "Ender 3 v2 #05",
    tag: "FAB-3D-005",
    date: "24 Out 2024",
    type: "corretiva",
    technician: "Matheus Silva",
    status: "liberada",
    parts: true,
  },
  {
    id: "2",
    machine: "Creality K1 Max #01",
    tag: "FAB-3D-001",
    date: "22 Out 2024",
    type: "preventiva",
    technician: "Carla Albuquerque",
    status: "concluida",
    parts: false,
  },
  {
    id: "3",
    machine: "EinScan Pro HD #01",
    tag: "SCN-OPT-001",
    date: "18 Out 2024",
    type: "preventiva",
    technician: "Matheus Silva",
    status: "concluida",
    parts: true,
  },
  {
    id: "4",
    machine: "Anycubic Photon #02",
    tag: "RES-SLA-002",
    date: "11 Out 2024",
    type: "corretiva",
    technician: "Juliana Ramos",
    status: "liberada",
    parts: true,
  },
  {
    id: "5",
    machine: "FlashForge Creator #06",
    tag: "FAB-3D-006",
    date: "05 Out 2024",
    type: "preventiva",
    technician: "Carla Albuquerque",
    status: "concluida",
    parts: false,
  },
];

export const MaintenanceManagementPage = (): JSX.Element => {
  const [selectedTab, setSelectedTab] = useState<"todos" | "preventivas" | "corretivas" | "pecas">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const filteredRecords = useMemo(
    () =>
      mockRecords.filter((record) => {
        const typeMatch =
          selectedTab === "todos" ||
          (selectedTab === "preventivas" && record.type === "preventiva") ||
          (selectedTab === "corretivas" && record.type === "corretiva") ||
          (selectedTab === "pecas" && record.parts);
        const query = searchQuery.trim().toLowerCase();
        return typeMatch && `${record.machine} ${record.tag} ${record.technician}`.toLowerCase().includes(query);
      }),
    [selectedTab, searchQuery],
  );

  const exportRecords = () => {
    downloadCsv("manutencoes-labmu.csv", [
      ["Máquina", "TAG", "Data", "Tipo", "Técnico", "Status", "Peças"],
      ...filteredRecords.map((record) => [
        record.machine,
        record.tag,
        record.date,
        record.type,
        record.technician,
        record.status,
        record.parts ? "Sim" : "Não",
      ]),
    ]);
  };

  const getTypeColor = (type: MaintenanceType) => {
    return type === "preventiva" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700";
  };

  const getTypeLabel = (type: MaintenanceType) => {
    return type === "preventiva" ? "Preventiva" : "Corretiva";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#efe6e6] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-[#7a6e70]">
          <span>MÁQUINAS</span>
          <span>›</span>
          <span className="text-[#8B1329] font-semibold">MANUTENÇÃO & CONFIABILIDADE</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1f1a1b] mb-2">Gestão de Manutenções & Indicadores Gerenciais</h1>
            <p className="text-sm text-[#7a6e70]">
              Acompanhamento da saúde operacional do parque de fabricação, rotinas preventivas e histórico consolidado.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span>📅 Semestre 2024.2 (Jul - Dez)</span>
            </div>
            <button onClick={exportRecords} className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors">
              <Download className="w-4 h-4" />
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Disponibilidade Geral</p>
                <p className="text-4xl font-bold text-[#1f1a1b]">96.4%</p>
                <p className="text-xs text-[#7a6e70] mt-1">Uptime</p>
              </div>
              <span className="text-3xl">⚙️</span>
            </div>
            <p className="text-xs text-[#7a6e70]">Meta semestral atingida (&gt;95%)</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Preventivas em Dia</p>
                <p className="text-4xl font-bold text-[#1f1a1b]">14<span className="text-lg">/16</span></p>
                <p className="text-xs text-[#7a6e70] mt-1">Máquinas</p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-xs text-[#7a6e70]">2 intervenções agendadas no mês</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Corretivas no Semestre</p>
                <p className="text-4xl font-bold text-[#1f1a1b]">03</p>
                <p className="text-xs text-[#7a6e70] mt-1">Ocorrências</p>
              </div>
              <span className="text-3xl">🔧</span>
            </div>
            <p className="text-xs text-[#7a6e70]">Tempo médio de reparo: 3.2h MTTR</p>
          </div>
        </div>

        {/* Availability by Category */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-1">Saúde Operacional</p>
              <h2 className="text-2xl font-bold text-[#1f1a1b]">Disponibilidade por Categoria</h2>
            </div>
            <span className="text-sm text-[#7a6e70]">16 Máquinas Totais</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FDM Printers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[#1f1a1b]">Impressão 3D FDM (8 un)</p>
                <p className="font-bold text-[#8B1329]">97.8%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#8B1329] h-2 rounded-full" style={{ width: "97.8%" }}></div>
              </div>
            </div>

            {/* Resin Printers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[#1f1a1b]">Impressão Resina SLA/LCD (4 un)</p>
                <p className="font-bold text-yellow-700">93.2%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "93.2%" }}></div>
              </div>
            </div>

            {/* Scanners */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[#1f1a1b]">Scanners 3D Ópticos (2 un)</p>
                <p className="font-bold text-[#8B1329]">100.0%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#8B1329] h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            {/* Post-Cure Benches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[#1f1a1b]">Bancadas de Pós-Cura (2 un)</p>
                <p className="font-bold text-[#8B1329]">95.0%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#8B1329] h-2 rounded-full" style={{ width: "95%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Records */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-1">Auditoria Técnica</p>
            <h2 className="text-2xl font-bold text-[#1f1a1b] mb-4">Livro Oficial de Ordens & Ocorrências</h2>
            <p className="text-sm text-[#7a6e70]">18 Registros no semestre</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-[#efe6e6]">
            {(["todos", "preventivas", "corretivas", "pecas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  selectedTab === tab
                    ? "border-[#8B1329] text-[#8B1329]"
                    : "border-transparent text-[#7a6e70] hover:text-[#1f1a1b]"
                }`}
              >
                {tab === "todos" && "Todas"}
                {tab === "preventivas" && "Preventivas"}
                {tab === "corretivas" && "Corretivas"}
                {tab === "pecas" && "Com Peças"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7a6e70]" />
              <input
                type="text"
                placeholder="Filtrar por máquina, TAG ou técnico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Máquina & TAG</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Técnico</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-[#efe6e6] hover:bg-[#fef3c7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#1f1a1b]">{record.machine}</p>
                      <p className="text-xs text-[#7a6e70]">{record.tag}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1f1a1b]">{record.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(record.type)}`}>
                        {getTypeLabel(record.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1f1a1b]">{record.technician}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1f1a1b] capitalize">{record.status}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedRecord(record)} className="text-sm font-semibold text-[#8B1329] hover:text-[#6b0f1f]">Ver Ficha</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRecords.length === 0 && (
            <p className="py-8 text-center text-sm text-[#7a6e70]">Nenhuma manutenção encontrada.</p>
          )}

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between text-sm text-[#7a6e70]">
            <p>Mostrando {filteredRecords.length} de {mockRecords.length} registros</p>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="maintenance-detail-title">
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 shadow-xl">
            <h2 id="maintenance-detail-title" className="text-xl font-bold text-[#8B1329]">Ficha de manutenção</h2>
            <p><strong>Máquina:</strong> {selectedRecord.machine} ({selectedRecord.tag})</p>
            <p><strong>Data:</strong> {selectedRecord.date}</p>
            <p><strong>Tipo:</strong> {getTypeLabel(selectedRecord.type)}</p>
            <p><strong>Técnico:</strong> {selectedRecord.technician}</p>
            <p><strong>Status:</strong> {selectedRecord.status}</p>
            <p><strong>Peças utilizadas:</strong> {selectedRecord.parts ? "Sim" : "Não"}</p>
            <button onClick={() => setSelectedRecord(null)} className="mt-2 rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagementPage;
