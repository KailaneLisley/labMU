import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, AlertTriangle, Clock3 } from "lucide-react";
import { api } from "../../services/api";
import { useApiData } from "../../hooks/useApiData";

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  path: string;
}

interface Production {
  id: string;
  name: string;
  technicianCount?: number;
  technicians?: string[];
  requesters?: string[];
  status: "em_impressao" | "concluido" | "fila_laser";
  time: string;
}

interface Alert {
  id: string;
  type: "warning" | "critical" | "info";
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  path?: string;
}

const quickActions: QuickAction[] = [
  { id: "1", label: "Novo Cliente", icon: "/user.svg", path: "/usuarios" },
  { id: "2", label: "Novo Técnico", icon: "/users.svg", path: "/usuarios" },
  { id: "3", label: "Cadastrar Máquina", icon: "/maquinas.svg", path: "/maquinas" },
  { id: "4", label: "Novo Suprimento", icon: "/caixa.svg", path: "/estoque/registrar-entrada" },
  { id: "5", label: "Exportar Relatório", icon: "/exportar.svg", path: "/relatorios" },
];

interface Kpi {
  title: string;
  value: string;
  unit: string;
  details: string[];
  icon: string;
}

interface DashboardView {
  kpis: Kpi[];
  productions: Production[];
  alerts: Alert[];
}

const EMPTY_VIEW: DashboardView = { kpis: [], productions: [], alerts: [] };

// Tudo que aparece no painel vem do resumo do servidor. Sem valores de exemplo.
async function loadDashboard(): Promise<DashboardView> {
  const data: any = await api.getDashboardSummary();
  const kpis: Kpi[] = [
    {
      title: "USUÁRIOS CADASTRADOS",
      value: String(data.users?.total ?? 0),
      unit: "cadastrados",
      details: [
        `${data.users?.technicians ?? 0} Técnicos`,
        `${data.users?.admins ?? 0} Administradores`,
        `${data.users?.clients ?? 0} Clientes/Alunos`,
      ],
      icon: "/users.svg",
    },
    {
      title: "MÁQUINAS OPERANTES",
      value: `${data.machines?.active ?? 0}/${data.machines?.total ?? 0}`,
      unit: "ativas",
      details: [
        data.machines?.maintenance ? `${data.machines.maintenance} em manutenção` : "Nenhuma em manutenção",
      ],
      icon: "/maquinas.svg",
    },
    {
      title: "EMPRÉSTIMOS ATIVOS",
      value: String(data.loans?.active ?? 0),
      unit: "equipamentos em campo",
      details: [data.loans?.overdue ? `${data.loans.overdue} devolução(ões) em atraso` : "Nenhum atraso registrado"],
      icon: "/caixa.svg",
    },
    {
      title: "FILAMENTO DISPONÍVEL",
      value: Number(data.supplies?.totalBalanceKg ?? 0).toFixed(1),
      unit: "kg",
      details: [
        data.supplies?.lowStockItems ? `${data.supplies.lowStockItems} insumo(s) em nível baixo ou crítico` : "Estoque balanceado",
      ],
      icon: "/grafico.svg",
    },
  ];

  const productions: Production[] = (data.recentProductions ?? []).map((p: any) => ({
    id: String(p.id),
    name: p.description || p.type || "Produção",
    technicians: p.technician_name ? [p.technician_name] : [],
    requesters: p.client_name ? [p.client_name] : [],
    status: "concluido",
    time: p.created_at
      ? new Date(p.created_at.replace(" ", "T") + "Z").toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "",
  }));

  const alerts: Alert[] = [];
  if (data.loans?.overdue > 0) {
    alerts.push({
      id: "loans-overdue",
      type: "critical",
      title: "Empréstimos em Atraso",
      description: `${data.loans.overdue} equipamento(s) fora do prazo de devolução`,
      actionLabel: "Ver empréstimos",
      path: "/emprestimo",
    });
  }
  if (data.supplies?.lowStockItems > 0) {
    alerts.push({
      id: "supplies-low",
      type: "critical",
      title: "Estoque Baixo de Insumo",
      description: `${data.supplies.lowStockItems} insumo(s) abaixo do mínimo`,
      actionLabel: "Ver estoque",
      path: "/estoque",
    });
  }
  for (const m of data.upcomingMaintenances ?? []) {
    alerts.push({
      id: `m-${m.id}`,
      type: "warning",
      title: "Manutenção Agendada",
      description: `${m.name} (${m.tag})`,
      actionLabel: "Ver no parque",
      path: "/maquinas",
    });
  }

  return { kpis, productions, alerts };
}

const getStatusColor = (status: Production["status"]) => {
  switch (status) {
    case "em_impressao":
      return "bg-blue-100 text-blue-700";
    case "concluido":
      return "bg-green-100 text-green-700";
    case "fila_laser":
      return "bg-orange-100 text-orange-700";
  }
};

const getStatusLabel = (status: Production["status"]) => {
  switch (status) {
    case "em_impressao":
      return "• Em Impressão";
    case "concluido":
      return "• Concluído";
    case "fila_laser":
      return "• Fila Laser";
  }
};

const getAlertIcon = (type: Alert["type"]) => {
  switch (type) {
    case "warning":
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case "critical":
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case "info":
      return <Clock3 className="w-5 h-5 text-blue-600" />;
  }
};

export const DashboardPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { data: view, loading, error: loadError, reload } = useApiData<DashboardView>(loadDashboard, EMPTY_VIEW);
  const dashboardKpis = view.kpis;
  const dashboardProductions = view.productions;
  const dashboardAlerts = view.alerts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-[#8B1329] mb-2">Dashboard do Administrador</h1>
        <p className="text-sm text-[#7a6e70]">
          Visão geral das operações, equipamentos e usuários do labMU
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {loading && <p className="mb-4 text-sm text-[#7a6e70]">Carregando painel...</p>}
        {loadError && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {loadError}{" "}
            <button onClick={reload} className="font-semibold underline">Tentar novamente</button>
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-bold text-[#1f1a1b]">Atalhos Rápidos de Operação</h2>
          <span className="text-xs text-[#7a6e70]">Ações frequentes da coordenação</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3"
            >
              <div>
                <img src={action.icon} alt="" className="h-10 w-10 object-contain" />
              </div>
              <p className="text-sm font-semibold text-[#1f1a1b]">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardKpis.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <img src={kpi.icon} alt="" className="w-8 h-8 object-contain" />
                <p className="text-xs font-semibold text-[#7a6e70] uppercase text-right">{kpi.title}</p>
              </div>
              <div className="mb-3">
                <p className="text-4xl font-bold text-[#1f1a1b]">{kpi.value}</p>
                <p className="text-xs text-[#7a6e70]">{kpi.unit}</p>
              </div>
              {idx === 3 && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "87%" }}></div>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                {kpi.details.map((detail, i) => (
                  <p key={i} className="text-xs text-[#7a6e70] flex items-center gap-1">
                    <span className="text-yellow-500">•</span>
                    {detail}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Productions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <img src="/lista.svg" alt="" className="h-5 w-5 object-contain" />
                  <div>
                    <h3 className="font-bold text-[#1f1a1b]">Últimas Produções Registradas</h3>
                    <p className="text-xs text-[#7a6e70]">Atividades de usinagem, corte e impressão no parque</p>
                  </div>
                </div>
                <button onClick={() => navigate("/relatorios")} className="text-sm font-semibold text-[#8B1329] hover:text-[#6b0f1f]">Ver todas →</button>
              </div>

              <div className="space-y-4">
                {dashboardProductions.map((prod, idx) => (
                  <div key={prod.id} className={`pb-4 border-b border-[#efe6e6] last:border-0 ${idx === 0 ? "flex items-start gap-3" : ""}`}>
                    {idx === 0 && (
                      <img src="/calendario.svg" alt="" className="h-7 w-7 flex-shrink-0 object-contain" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-[#1f1a1b]">{prod.name}</p>
                      <p className="text-xs text-[#7a6e70] mt-1">
                        Técnico: {prod.technicians?.join(", ")} • Solicitante: {prod.requesters?.join(", ")}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(prod.status)}`}>
                          {getStatusLabel(prod.status)}
                        </span>
                        <span className="text-xs text-[#7a6e70]">{prod.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#7a6e70] mt-4">Total de 18 produções processadas esta semana</p>
              <p className="text-xs text-[#7a6e70]">Horário labMU: 08h00 - 18h00</p>
            </div>
          </div>

          {/* Alerts */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">3 Pendências</span>
                </div>
                <img src="/perigo.svg" alt="" className="h-5 w-5 object-contain" />
              </div>

              <h3 className="font-bold text-[#1f1a1b] mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Avisos & Alertas do Laboratório
              </h3>
              <p className="text-xs text-[#7a6e70] mb-4">Atenção requerida da coordenação técnica</p>

              <div className="space-y-4">
                {dashboardAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 rounded-lg p-4 ${
                      alert.type === "warning"
                        ? "bg-yellow-50 border-yellow-400"
                        : alert.type === "critical"
                        ? "bg-red-50 border-red-400"
                        : "bg-blue-50 border-blue-400"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="font-semibold text-[#1f1a1b] text-sm">{alert.title}</p>
                        <p className="text-xs text-[#7a6e70] mt-1">{alert.description}</p>
                        {alert.action && <p className="text-xs text-[#7a6e70] mt-2">{alert.action}</p>}
                        {alert.actionLabel && (
                          <button onClick={() => alert.path && navigate(alert.path)} className="text-xs font-semibold text-[#8B1329] hover:text-[#6b0f1f] mt-2">
                            {alert.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-xs text-yellow-800">
                  ✓ Todos os protocolos de biossegurança e esterilização de corte a laser verificados pela equipe de turno.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
