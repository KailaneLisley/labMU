import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Download } from "lucide-react";

interface Supply {
  id: string;
  name: string;
  type: string;
  color: string;
  balance: number;
  status: "regular" | "abaixo" | "critico";
}

interface AcquisitionRecord {
  id: string;
  date: string;
  supplier: string;
  nf: string;
  material: string;
  quantity: number;
  value: string;
  responsible: string;
  department: string;
}

const mockSupplies: Supply[] = [
  {
    id: "1",
    name: "PLA 1.75mm",
    type: "Termoplástico",
    color: "Marfim",
    balance: 8.5,
    status: "regular",
  },
  {
    id: "2",
    name: "PLA 1.75mm",
    type: "Termoplástico",
    color: "Cinza Arquitetura",
    balance: 0.8,
    status: "abaixo",
  },
  {
    id: "3",
    name: "PETG 1.75mm",
    type: "Termoplástico",
    color: "Translúcido",
    balance: 5.2,
    status: "regular",
  },
  {
    id: "4",
    name: "Resina Standard 405nm",
    type: "Fotopolímero SLA",
    color: "Cinza",
    balance: 9.4,
    status: "regular",
  },
  {
    id: "5",
    name: "Resina Bio Clara",
    type: "Fotopolímero SLA",
    color: "Incolor",
    balance: 4.5,
    status: "regular",
  },
];

const mockAcquisitions: AcquisitionRecord[] = [
  {
    id: "1",
    date: "24/10/2024",
    supplier: "3D Fila Brasil Ltda",
    nf: "NF 004.892.1",
    material: "PLA Premium Marfim (5 carretéis)",
    quantity: 5.0,
    value: "R$ 495,00",
    responsible: "CA",
    department: "Coordenação Arquitetura",
  },
  {
    id: "2",
    date: "18/10/2024",
    supplier: "ResinTech Polímeros",
    nf: "NF 012.301.1",
    material: "Resina Standard Cinza 405nm (6 frascos)",
    quantity: 6.0,
    value: "R$ 1.140,00",
    responsible: "PT",
    department: "Técnico labMU",
  },
  {
    id: "3",
    date: "03/10/2024",
    supplier: "Prototipagem Nordeste Distribuição",
    nf: "NF -",
    material: "PETG Translúcido (4 carretéis)",
    quantity: 4.0,
    value: "R$ 440,00",
    responsible: "CA",
    department: "Coordenação Arquitetura",
  },
];

const getStatusColor = (status: Supply["status"]) => {
  switch (status) {
    case "regular":
      return "text-gray-600";
    case "abaixo":
      return "text-orange-600";
    case "critico":
      return "text-red-600";
  }
};

const getStatusLabel = (status: Supply["status"]) => {
  switch (status) {
    case "regular":
      return "Regular";
    case "abaixo":
      return "Abaixo do Mínimo";
    case "critico":
      return "Crítico";
  }
};

export const StockSupplyPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const totalStock = mockSupplies.reduce((sum, s) => sum + s.balance, 0);
  const criticalItems = mockSupplies.filter((s) => s.status !== "regular").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#8B1329] mb-2">Estoque & Suprimentos</h1>
            <p className="text-sm text-[#7a6e70]">
              Gestão simplificada de insumos e histórico de aquisições do atelier.
            </p>
          </div>
          <button
            onClick={() => navigate("/estoque/registrar-entrada")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Cadastrar Suprimento
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Total em Estoque</p>
                <p className="text-4xl font-bold text-[#1f1a1b]">{totalStock.toFixed(1)}</p>
                <p className="text-xs text-[#7a6e70] mt-1">kg</p>
              </div>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-xs text-[#7a6e70]">Soma de termoplásticos FDM e polímeros SLA ativos</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Insumos Críticos / Atenção</p>
                <p className="text-4xl font-bold text-[#1f1a1b]">0{criticalItems}</p>
                <p className="text-xs text-[#7a6e70] mt-1">Item</p>
              </div>
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                Alerta de Reposição
              </span>
              <span className="text-xs text-[#7a6e70]">PLA Cinza Arquitetura ati</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">Aquisições do Mês</p>
                <p className="text-4xl font-bold text-[#1f1a1b]">15.0</p>
                <p className="text-xs text-[#7a6e70] mt-1">kg</p>
              </div>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-xs text-[#7a6e70]">3 lotes recebidos, inspecionados e tombados no labMU</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7a6e70]" />
            <input
              type="text"
              placeholder="Buscar suprimento por nome, tipo ou cor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1f1a1b]">Inventário de Materiais</h2>
            <span className="text-sm text-[#7a6e70]">{mockSupplies.length} suprimentos ativos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Nome / Insumo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Tipo / Cor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Saldo Atual</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockSupplies.map((supply) => (
                  <tr key={supply.id} className="border-b border-[#efe6e6] hover:bg-[#fef3c7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#1f1a1b]">{supply.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#7a6e70]">
                        {supply.type} • {supply.color}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1f1a1b]">{supply.balance.toFixed(2)} kg</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm font-semibold ${getStatusColor(supply.status)}`}>
                        {getStatusLabel(supply.status)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acquisition History */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1f1a1b] flex items-center gap-2">
                <span>📋</span>
                Histórico de Entradas & Aquisições Recentes
              </h2>
              <p className="text-sm text-[#7a6e70] mt-1">
                Registro rastreável de notas fiscais, pesagens confirmadas e responsáveis técnicos.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-[#efe6e6] rounded-lg font-semibold hover:bg-[#f7f0f0] transition-colors text-sm">
              <Download className="w-4 h-4" />
              Exportar Relatório CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Data da Aquisição</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Fornecedor / NF</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Insumo / Material</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">Responsável labMU</th>
                </tr>
              </thead>
              <tbody>
                {mockAcquisitions.map((record) => (
                  <tr key={record.id} className="border-b border-[#efe6e6] hover:bg-[#fef3c7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1f1a1b]">{record.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1f1a1b] font-semibold">{record.supplier}</p>
                      <p className="text-xs text-[#7a6e70]">{record.nf}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1f1a1b]">{record.material}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1f1a1b]">{record.quantity.toFixed(2)} kg</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1f1a1b]">{record.value}</p>
                      <p className="text-xs text-[#7a6e70]">{(record.quantity * 100).toFixed(0)}/kg</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-8 h-8 rounded-full bg-[#8B1329] text-white text-xs font-bold flex items-center justify-center">
                          {record.responsible}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-[#1f1a1b]">{record.responsible}</p>
                          <p className="text-xs text-[#7a6e70]">{record.department}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockSupplyPage;
