import { useState, useMemo } from "react";
import { Plus, ArrowLeft, Copy } from "lucide-react";

interface Supply {
  id: string;
  name: string;
  type: string;
  color?: string;
  currentBalance: number;
  unit: string;
}

interface RecentEntry {
  id: string;
  name: string;
  quantity: number;
  date: Date;
}

const mockSupplies: Supply[] = [
  { id: "1", name: "PLA Branco Gesso", type: "Filamento FDM", color: "Branco", currentBalance: 3.0, unit: "kg" },
  { id: "2", name: "Resina SLA 405nm", type: "Resina", color: "Transparente", currentBalance: 1.0, unit: "kg" },
  { id: "3", name: "Acetona", type: "Solvente", color: "Incolor", currentBalance: 2.5, unit: "kg" },
  { id: "4", name: "ABS Preto", type: "Filamento FDM", color: "Preto", currentBalance: 0.8, unit: "kg" },
];

const recentEntries: RecentEntry[] = [
  { id: "1", name: "PLA Branco Gesso", quantity: 3.0, date: new Date("2024-10-06") },
  { id: "2", name: "Resina SLA 405nm", quantity: 1.0, date: new Date("2024-10-05") },
];

const guidelines = [
  "Pesar cada carretel individualmente antes de registrar para descontar a tara plástica (aprox. 200g por carretel padrão).",
  "Identificar a cor da bobina com câmera permanente de oficina.",
  "Em caso de lote de doação acadêmica, vincular a rúbrica no campo 'Lote ou Origem'.",
];

export const RegisterSupplyEntryPage = (): JSX.Element => {
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [units, setUnits] = useState<string>("");
  const [lot, setLot] = useState<string>("");
  const [observations, setObservations] = useState<string>("");

  const selectedSupply = mockSupplies.find((s) => s.id === selectedSupplyId);

  const quantityNum = parseFloat(quantity) || 0;
  const newBalance = (selectedSupply?.currentBalance || 0) + quantityNum;
  const isValidBalance = newBalance >= 0;

  const quickAddQuantity = (amount: number) => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + amount).toFixed(1));
  };

  const handleConfirm = () => {
    if (!selectedSupply || quantityNum === 0) {
      alert("Selecione um suprimento e adicione uma quantidade");
      return;
    }
    alert(`Entrada confirmada: ${selectedSupply.name} + ${quantityNum}kg\nNovo saldo: ${newBalance.toFixed(1)}kg`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#efe6e6] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <button className="inline-flex items-center gap-1 text-[#8B1329] hover:text-[#6b0f1f]">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Estoque & Suprimentos
          </button>
          <span className="text-[#7a6e70]">•</span>
          <span className="text-[#7a6e70]">MÓDULO DE SUPRIMENTOS</span>
          <span className="text-[#7a6e70]">•</span>
          <span className="font-semibold text-[#8B1329]">REGISTRAR ENTRADA</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded mb-4">
            🟡 Terminal de Balança Bancada 01
          </div>
          <h1 className="text-3xl font-bold text-[#8B1329] mb-2">
            ⊞ Registrar Entrada de Suprimento
          </h1>
          <p className="text-sm text-[#7a6e70]">
            Lançamento de aquisição ou reposição de insumos em quilogramas (kg) no estoque ativo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8 space-y-6">
              {/* Suprimento / Material */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-[#1f1a1b]">
                    Suprimento / Material <span className="text-red-600">*</span>
                  </label>
                  <button className="inline-flex items-center gap-1 text-xs text-[#8B1329] hover:text-[#6b0f1f] font-semibold">
                    <Plus className="w-4 h-4" />
                    Cadastrar Novo Insumo
                  </button>
                </div>
                <select
                  value={selectedSupplyId}
                  onChange={(e) => setSelectedSupplyId(e.target.value)}
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white"
                >
                  <option value="">Selecione o insumo cadastrado na oficina...</option>
                  {mockSupplies.map((supply) => (
                    <option key={supply.id} value={supply.id}>
                      {supply.name} ({supply.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantidade Adicionada */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                    Quantidade Adicionada <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Ex.: 2.0"
                      className="flex-1 px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                    />
                    <div className="flex items-end">
                      <span className="text-sm font-semibold text-[#7a6e70]">KG</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[1.0, 2.0, 5.0].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => quickAddQuantity(amount)}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold border border-[#efe6e6] rounded hover:bg-[#fdeaea] transition-colors"
                      >
                        +{amount} kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* Número de Unidades */}
                <div>
                  <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                    Número de Unidades / Embalagens
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      placeholder="Ex.: 2 cartéis de 1kg"
                      className="flex-1 px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                    />
                    <button className="p-3 border border-[#efe6e6] rounded-lg hover:bg-[#f7f0f0]">
                      <Copy className="w-4 h-4 text-[#7a6e70]" />
                    </button>
                  </div>
                  <p className="text-xs text-[#7a6e70] mt-2">Identificação física de prateleira.</p>
                </div>
              </div>

              {/* Lote, NF ou Origem */}
              <div>
                <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                  Lote, NF ou Origem <span className="text-[#7a6e70] text-xs ml-1">Opcional</span>
                </label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  placeholder="Ex.: Lote #2024-B8 / Doação MUSARQ / NF 004812"
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                />
              </div>

              {/* Observações da Carga */}
              <div>
                <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                  Observações da Carga <span className="text-[#7a6e70] text-xs ml-1">Opcional</span>
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Estado do lacre dessecante, inspeção visual do diâmetro, estufa recomendada..."
                  rows={4}
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                />
              </div>

              {/* Impacto no Saldo */}
              {selectedSupply && (
                <div className="bg-[#fdeaea] border border-[#efcccc] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1f1a1b] mb-2">
                        Impacto no Saldo do Insumo <span className="text-red-600">*</span> Cálculo Imediato
                      </p>
                      <p className="text-sm text-[#7a6e70] mb-3">
                        Selecione um insumo e informe a quantidade para visualizar a atualização automática da bancada.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#7a6e70]">Saldo Atual:</span>
                          <span className="font-semibold text-[#1f1a1b]">{selectedSupply.currentBalance.toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#7a6e70]">Quantidade Adicionar:</span>
                          <span className="font-semibold text-[#1f1a1b]">+{quantityNum.toFixed(1)} kg</span>
                        </div>
                        <div className="border-t border-[#efcccc] pt-2 flex justify-between text-sm">
                          <span className="font-semibold text-[#1f1a1b]">Novo Saldo:</span>
                          <span className={`font-bold text-lg ${isValidBalance ? "text-green-600" : "text-red-600"}`}>
                            {newBalance.toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button className="flex-1 px-6 py-3 border border-[#efe6e6] rounded-lg font-semibold text-[#1f1a1b] hover:bg-[#f7f0f0] transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSupply || quantityNum === 0}
                  className="flex-1 px-6 py-3 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  ✓ Confirmar Entrada no Estoque
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Guidelines */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-[#1f1a1b] mb-4">📋 Diretrizes da Oficina</h3>
              <ul className="space-y-3">
                {guidelines.map((guideline, i) => (
                  <li key={i} className="text-sm text-[#7a6e70] flex gap-3">
                    <span className="text-[#8B1329] font-bold flex-shrink-0">•</span>
                    <span>{guideline}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Entries */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1f1a1b]">⏰ ÚLTIMAS ENTRADAS</h3>
                <button className="text-xs text-[#8B1329] hover:text-[#6b0f1f] font-semibold">Hoje</button>
              </div>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="pb-3 border-b border-[#efe6e6] last:border-0">
                    <p className="font-semibold text-[#1f1a1b] text-sm">{entry.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-[#7a6e70]">{entry.quantity}x 1.0kg • Lote #912</p>
                      <span className="text-green-600 font-bold">+{entry.quantity.toFixed(1)} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSupplyEntryPage;
