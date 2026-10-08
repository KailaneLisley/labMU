import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Wrench, Package, FileDown, Clock, AlertCircle, CheckCircle2, AlertTriangle, Clock3 } from "lucide-react";

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
  { id: "1", label: "Novo Cliente", icon: "👤", path: "/usuarios" },
  { id: "2", label: "Novo Técnico", icon: "👥", path: "/usuarios" },
  { id: "3", label: "Cadastrar Máquina", icon: "⚙️", path: "/maquinas" },
  { id: "4", label: "Novo Suprimento", icon: "📦", path: "/estoque/registrar-entrada" },
  { id: "5", label: "Exportar Relatório", icon: "📥", path: "/relatorios" },
];

const kpis = [
  {
    title: "USUÁRIOS CADASTRADOS",
    value: "48",
    unit: "ativos",
    details: ["12 Técnicos", "36 Clientes"],
    icon: "👥",
  },
  {
    title: "MÁQUINAS OPERANTES",
    value: "6/8",
    unit: "ativas",
    details: ["2 em manutenção preventiva"],
    icon: "⚙️",
  },
  {
    title: "EMPRÉSTIMOS ATIVOS",
    value: "9",
    unit: "equipamentos em campo",
    details: ["1 devolução prevista para hoje"],
    icon: "📦",
  },
  {
    title: "FILAMENTO DISPONÍVEL",
    value: "14.5",
    unit: "kg",
    details: ["Estoque total de insumos labMU"],
    icon: "📊",
  },
];

const productions: Production[] = [
  {
    id: "1",
    name: "Maquete Topográfica Bloco G",
    technicians: ["Rafael Mendes"],
    requesters: ["Profa. Clarice Leão"],
    status: "em_impressao",
    time: "Hoje, 14:20",
  },
  {
    id: "2",
    name: "Painel Acrílico Perfurado 3mm",
    technicians: ["Mariana Fontes"],
    requesters: ["Lucas Siqueira (Arq 8º)"],
    status: "concluido",
    time: "Hoje, 11:45",
  },
  {
    id: "3",
    name: "Estrutura Treliçada Bambu/MDF",
    technicians: ["Mariana Fontes"],
    requesters: ["Lab. Conforto Ambiental"],
    status: "fila_laser",
    time: "Ontem, 16:30",
  },
  {
    id: "4",
    name: "Protótipo de Junção Hidráulica 1:1",
    technicians: ["Lucas Barreira"],
    requesters: ["Núcleo MUSARQ"],
    status: "concluido",
    time: "Ontem, 09:15",
  },
];

const alerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    title: "Manutenção Preventiva",
    description: "Impressora 3D Creality K1 (M02)",
    action: "Gerada há máquina",
    actionLabel: "Agendada",
    path: "/manutencao",
  },
  {
    id: "2",
    type: "critical",
    title: "Estoque Baixo de Insumo",
    description: "Filamento PLA Cinza 1.75mm (1kg)",
    action: "Apenas 1 carretel lacrado restante. Demanda alta para projetos do Ateli 4.",
    actionLabel: "Emitir requisição",
    path: "/estoque",
  },
  {
    id: "3",
    type: "info",
    title: "Empréstimo em Devolução",
    description: "Scanner 3D Portátil EinScan Pro",
    action: "Sob responsabilidade de Beatriz Alencar (TCC Arquitetura e Urbanismo).",
    actionLabel: "Notificar devolução",
    path: "/emprestimo",
  },
];

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

const getAlertBgColor = (type: Alert["type"]) => {
  switch (type) {
    case "warning":
      return "bg-yellow-50 border-yellow-200";
    case "critical":
      return "bg-red-50 border-red-200";
    case "info":
      return "bg-blue-50 border-blue-200";
  }
};

export const DashboardPage = (): JSX.Element => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-[#8B1329] mb-2">Dashboard do Administrador</h1>
        <p className="text-sm text-[#7a6e70]">
          Visão geral das operações, equipamentos e usuários do labMU
        </p>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
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
              <div className="text-4xl">{action.icon}</div>
              <p className="text-sm font-semibold text-[#1f1a1b]">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{kpi.icon}</span>
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
                  <span className="text-lg">📋</span>
                  <div>
                    <h3 className="font-bold text-[#1f1a1b]">Últimas Produções Registradas</h3>
                    <p className="text-xs text-[#7a6e70]">Atividades de usinagem, corte e impressão no parque</p>
                  </div>
                </div>
                <button onClick={() => navigate("/relatorios")} className="text-sm font-semibold text-[#8B1329] hover:text-[#6b0f1f]">Ver todas →</button>
              </div>

              <div className="space-y-4">
                {productions.map((prod, idx) => (
                  <div key={prod.id} className={`pb-4 border-b border-[#efe6e6] last:border-0 ${idx === 0 ? "flex items-start gap-3" : ""}`}>
                    {idx === 0 && <span className="text-2xl flex-shrink-0">🖨️</span>}
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
                <span className="text-lg">⚠️</span>
              </div>

              <h3 className="font-bold text-[#1f1a1b] mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Avisos & Alertas do Laboratório
              </h3>
              <p className="text-xs text-[#7a6e70] mb-4">Atenção requerida da coordenação técnica</p>

              <div className="space-y-4">
                {alerts.map((alert) => (
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
