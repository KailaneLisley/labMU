import { useState } from "react";
import { Download } from "lucide-react";
import { downloadCsv } from "../lib/exportCsv";

type PeriodType = "semestre" | "mes" | "dias90";
type ModuleType = "todos" | "impressao3d" | "escaneamento" | "emprestimo";

interface Module {
  id: string;
  name: string;
  orders: number;
  consumption: string;
  occupancy: number;
  status: string;
  color: string;
}

const mockModules: Module[] = [
  {
    id: "1",
    name: "Impressão 3D (FDM & SLA)",
    orders: 84,
    consumption: "24.2 kg",
    occupancy: 88,
    status: "em_uso",
    color: "bg-[#8B1329]",
  },
  {
    id: "2",
    name: "Escaneamento 3D",
    orders: 26,
    consumption: "—",
    occupancy: 45,
    status: "em_uso",
    color: "bg-yellow-600",
  },
  {
    id: "3",
    name: "Empréstimo de Equipamentos",
    orders: 32,
    consumption: "9 ativos",
    occupancy: 70,
    status: "em_uso",
    color: "bg-yellow-700",
  },
  {
    id: "4",
    name: "Manutenções Preventivas",
    orders: 8,
    consumption: "4 peças",
    occupancy: 100,
    status: "concluido",
    color: "bg-gray-400",
  },
];

export const ReportsPage = (): JSX.Element => {
  const [period, setPeriod] = useState<PeriodType>("semestre");
  const [module, setModule] = useState<ModuleType>("todos");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const filteredModules = mockModules.filter((item) => {
    if (module === "todos") return true;
    if (module === "impressao3d") return item.id === "1";
    if (module === "escaneamento") return item.id === "2";
    return item.id === "3";
  });

  const exportReport = () => {
    downloadCsv("relatorio-labmu.csv", [
      ["Período", period],
      [],
      ["Módulo", "Ordens", "Consumo", "Ocupação", "Status"],
      ...filteredModules.map((item) => [item.name, item.orders, item.consumption, `${item.occupancy}%`, item.status]),
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="text-xs text-[#7a6e70] mb-4">
          • RELATÓRIOS & ANÁLISES • LABMÚ ATELIER
        </div>

        {/* Title and Export Button */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1f1a1b] mb-2">Relatórios Gerenciais</h1>
            <p className="text-sm text-[#7a6e70]">
              Consolidado operacional, consumo de filamentos e indicadores de utilização do parque.
            </p>
          </div>
          <button onClick={exportReport} className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors">
            <Download className="w-4 h-4" />
            Exportar Relatório (PDF / CSV)
          </button>
        </div>

        {/* Selectors */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Period */}
            <div>
              <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Período:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "semestre", label: "Semestre 2024.2" },
                  { value: "mes", label: "Este Mês" },
                  { value: "dias90", label: "Últimos 90 dias" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value as PeriodType)}
                    className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                      period === opt.value
                        ? "bg-[#8B1329] text-white"
                        : "bg-[#f7f0f0] text-[#1f1a1b] hover:bg-[#efe6e6]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Module */}
            <div>
              <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Módulo:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "todos", label: "Todos" },
                  { value: "impressao3d", label: "Impressão 3D" },
                  { value: "escaneamento", label: "Escaneamento" },
                  { value: "emprestimo", label: "Empréstimos" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setModule(opt.value as ModuleType)}
                    className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
                      module === opt.value
                        ? "bg-[#8B1329] text-white"
                        : "bg-[#f7f0f0] text-[#1f1a1b] hover:bg-[#efe6e6]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Produções Realizadas</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">142</p>
            <p className="text-xs text-green-600 font-semibold mt-2">+18% em relação ao mês anterior</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Consumo de Filamento</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">28.4 <span className="text-lg">kg</span></p>
            <p className="text-xs text-[#7a6e70] mt-2">PLA, PETG e Resina</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Horas Ativas</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">680 <span className="text-lg">h</span></p>
            <p className="text-xs text-[#7a6e70] mt-2">Média de 8.5h por dia útil</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Usuários Atendidos</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">64</p>
            <p className="text-xs text-[#7a6e70] mt-2">Alunos e pesquisadores ativos</p>
          </div>
        </div>

        {/* Consolidation Table */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#1f1a1b] mb-1">Consolidação por Módulo Operacional</h2>
              <p className="text-sm text-[#7a6e70]">
                Visão sintetizada de alocação de máquinas e materiais em curso.
              </p>
            </div>
            <p className="text-xs text-[#7a6e70]">Atualizado hoje às 17:30</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Módulo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Qtd. Ordens</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Consumo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Taxa de Ocupação</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((mod) => (
                  <tr key={mod.id} className="border-b border-[#efe6e6] hover:bg-[#fef3c7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${mod.color}`}></div>
                        <p className="font-semibold text-[#1f1a1b]">{mod.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1f1a1b]">{mod.orders} ordens</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1f1a1b]">{mod.consumption}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${mod.color}`}
                            style={{ width: `${mod.occupancy}%` }}
                          ></div>
                        </div>
                        <p className="text-sm font-semibold text-[#1f1a1b] w-12">{mod.occupancy}%</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedModule(mod)} className="text-sm font-semibold text-[#8B1329] hover:text-[#6b0f1f]">
                        Ver detalhes →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selectedModule && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="report-module-title">
            <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 shadow-xl">
              <h2 id="report-module-title" className="text-xl font-bold text-[#8B1329]">{selectedModule.name}</h2>
              <p><strong>Ordens:</strong> {selectedModule.orders}</p>
              <p><strong>Consumo:</strong> {selectedModule.consumption}</p>
              <p><strong>Taxa de ocupação:</strong> {selectedModule.occupancy}%</p>
              <button onClick={() => setSelectedModule(null)} className="mt-2 rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
