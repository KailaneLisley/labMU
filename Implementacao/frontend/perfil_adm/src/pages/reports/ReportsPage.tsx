import { useState } from "react";
import { Download } from "lucide-react";
import { downloadCsv } from "../../lib/exportCsv";
import { useApiData } from "../../hooks/useApiData";
import { api } from "../../services/api";

type PeriodType = "mes" | "dias90" | "todos";
type ModuleType = "todos" | "impressao3d" | "escaneamento" | "emprestimo";

interface ModuleRow {
  id: string;
  name: string;
  count: number;
  consumption: string;
  detail: string;
  color: string;
}

interface ReportsView {
  production: { totalJobs: number; totalHours: number; totalMaterialKg: number };
  technicians: number;
  printCount: number;
  scanCount: number;
  loans: { totalLoans: number; activeLoans: number; overdueLoans: number; returnedLoans: number };
  maintenances: { totalMaintenances: number; preventiveCount: number; correctiveCount: number; totalCost: number };
}

const EMPTY_VIEW: ReportsView = {
  production: { totalJobs: 0, totalHours: 0, totalMaterialKg: 0 },
  technicians: 0,
  printCount: 0,
  scanCount: 0,
  loans: { totalLoans: 0, activeLoans: 0, overdueLoans: 0, returnedLoans: 0 },
  maintenances: { totalMaintenances: 0, preventiveCount: 0, correctiveCount: 0, totalCost: 0 },
};

const periodLabels: Record<PeriodType, string> = {
  mes: "Este mês",
  dias90: "Últimos 90 dias",
  todos: "Todo o histórico",
};

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

// Intervalo de datas do período escolhido (o servidor aplica o "até" até o fim do dia)
function periodRange(period: PeriodType): { from?: string; to?: string } {
  const today = new Date();
  if (period === "mes") {
    return { from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to: isoDay(today) };
  }
  if (period === "dias90") {
    return { from: isoDay(new Date(Date.now() - 89 * 86400000)), to: isoDay(today) };
  }
  return {};
}

// Busca os cinco relatórios em paralelo e reduz a um resumo para a tela
async function loadReports(period: PeriodType): Promise<ReportsView> {
  const range = periodRange(period);
  const [production, byTechnician, , loans, maintenances] = await Promise.all([
    api.getReports("production", range),
    api.getReports("production-by-technician", range),
    api.getReports("stock-consumption", range),
    api.getReports("loans", range),
    api.getReports("maintenances", range),
  ]);
  const technicianRows: any[] = byTechnician.report ?? [];
  return {
    production: {
      totalJobs: production.metrics?.totalJobs ?? 0,
      totalHours: production.metrics?.totalHours ?? 0,
      totalMaterialKg: production.metrics?.totalMaterialKg ?? 0,
    },
    technicians: technicianRows.length,
    printCount: technicianRows.reduce((sum, r) => sum + (r.printCount ?? 0), 0),
    scanCount: technicianRows.reduce((sum, r) => sum + (r.scanCount ?? 0), 0),
    loans: loans.metrics ?? EMPTY_VIEW.loans,
    maintenances: maintenances.metrics ?? EMPTY_VIEW.maintenances,
  };
}

const buildModules = (view: ReportsView): ModuleRow[] => [
  {
    id: "impressao3d",
    name: "Impressão 3D",
    count: view.printCount,
    consumption: `${view.production.totalMaterialKg.toFixed(2)} kg`,
    detail: `${view.printCount} impressões, ${view.production.totalHours.toFixed(1)} h de produção`,
    color: "bg-[#8B1329]",
  },
  {
    id: "escaneamento",
    name: "Escaneamento 3D",
    count: view.scanCount,
    consumption: "—",
    detail: `${view.scanCount} escaneamentos`,
    color: "bg-yellow-600",
  },
  {
    id: "emprestimo",
    name: "Empréstimo de Equipamentos",
    count: view.loans.totalLoans,
    consumption: `${view.loans.activeLoans} ativos`,
    detail: `${view.loans.activeLoans} em campo, ${view.loans.overdueLoans} em atraso, ${view.loans.returnedLoans} devolvidos`,
    color: "bg-yellow-700",
  },
  {
    id: "manutencao",
    name: "Manutenções",
    count: view.maintenances.totalMaintenances,
    consumption: `R$ ${view.maintenances.totalCost.toFixed(2)}`,
    detail: `${view.maintenances.preventiveCount} preventivas, ${view.maintenances.correctiveCount} corretivas`,
    color: "bg-gray-400",
  },
];

export const ReportsPage = (): JSX.Element => {
  const [period, setPeriod] = useState<PeriodType>("mes");
  const [module, setModule] = useState<ModuleType>("todos");
  const [selectedModule, setSelectedModule] = useState<ModuleRow | null>(null);
  const { data: view, loading, error: loadError, reload } = useApiData<ReportsView>(
    () => loadReports(period),
    EMPTY_VIEW,
    [period],
  );

  const modules = buildModules(view);
  const filteredModules = modules.filter((item) => module === "todos" || item.id === module);

  const exportReport = () => {
    downloadCsv("relatorio-labmu.csv", [
      ["Período", periodLabels[period]],
      [],
      ["Módulo", "Quantidade", "Consumo", "Detalhe"],
      ...filteredModules.map((item) => [item.name, item.count, item.consumption, item.detail]),
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
            Exportar Relatório (CSV)
          </button>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex gap-2">
            {(Object.keys(periodLabels) as PeriodType[]).map((value) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  period === value ? "bg-[#8B1329] text-white" : "bg-white text-[#7a6e70] shadow hover:text-[#1f1a1b]"
                }`}
              >
                {periodLabels[value]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {([
              { value: "todos", label: "Todos" },
              { value: "impressao3d", label: "Impressão 3D" },
              { value: "escaneamento", label: "Escaneamento" },
              { value: "emprestimo", label: "Empréstimos" },
            ] as { value: ModuleType; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setModule(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  module === opt.value ? "bg-[#1f1a1b] text-white" : "bg-white text-[#7a6e70] shadow hover:text-[#1f1a1b]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="mb-4 text-sm text-[#7a6e70]">Carregando relatórios...</p>}
        {loadError && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {loadError}{" "}
            <button onClick={reload} className="font-semibold underline">Tentar novamente</button>
          </p>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Produções Realizadas</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">{view.production.totalJobs}</p>
            <p className="text-xs text-[#7a6e70] mt-2">{periodLabels[period]}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Consumo de Filamento</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">{view.production.totalMaterialKg.toFixed(2)} <span className="text-lg">kg</span></p>
            <p className="text-xs text-[#7a6e70] mt-2">Soma dos consumos registrados</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Horas de Produção</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">{view.production.totalHours.toFixed(1)} <span className="text-lg">h</span></p>
            <p className="text-xs text-[#7a6e70] mt-2">Soma da duração das produções</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Técnicos com Produção</p>
            <p className="text-4xl font-bold text-[#1f1a1b]">{view.technicians}</p>
            <p className="text-xs text-[#7a6e70] mt-2">No período selecionado</p>
          </div>
        </div>

        {/* Consolidation Table */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#1f1a1b] mb-1">Consolidação por Módulo Operacional</h2>
              <p className="text-sm text-[#7a6e70]">Totais calculados pelo servidor a partir dos registros válidos.</p>
            </div>
            <p className="text-xs text-[#7a6e70]">Período: {periodLabels[period]}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Módulo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Consumo / Situação</th>
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
                      <p className="text-sm text-[#1f1a1b]">{mod.count}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1f1a1b]">{mod.consumption}</p>
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
              <p><strong>Quantidade:</strong> {selectedModule.count}</p>
              <p><strong>Consumo / situação:</strong> {selectedModule.consumption}</p>
              <p><strong>Detalhe:</strong> {selectedModule.detail}</p>
              <p className="text-xs text-[#7a6e70]">Período: {periodLabels[period]}</p>
              <button onClick={() => setSelectedModule(null)} className="mt-2 rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
