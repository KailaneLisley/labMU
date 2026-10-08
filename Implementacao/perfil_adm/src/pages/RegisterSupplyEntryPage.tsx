import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { usePersistentState } from "../hooks/usePersistentState";
import { initialSupplies, Supply, SupplyEntry, SUPPLIES_STORAGE_KEY } from "../data/supplies";

const guidelines = [
  "Pesar cada carretel individualmente antes de registrar para descontar a tara plástica (aprox. 200g por carretel padrão).",
  "Identificar a cor da bobina com câmera permanente de oficina.",
  "Em caso de lote de doação acadêmica, vincular a rúbrica no campo 'Lote ou Origem'.",
];

export const RegisterSupplyEntryPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [supplies, setSupplies] = usePersistentState<Supply[]>(SUPPLIES_STORAGE_KEY, initialSupplies);
  const [recentEntries, setRecentEntries] = usePersistentState<SupplyEntry[]>("labmu:supply-entries", []);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [units, setUnits] = useState<string>("");
  const [lot, setLot] = useState<string>("");
  const [observations, setObservations] = useState<string>("");
  const [showNewSupply, setShowNewSupply] = useState(false);
  const [newSupplyName, setNewSupplyName] = useState("");
  const [newSupplyType, setNewSupplyType] = useState("");
  const [newSupplyColor, setNewSupplyColor] = useState("");
  const [formError, setFormError] = useState("");

  const selectedSupply = supplies.find((s) => s.id === selectedSupplyId);

  const quantityNum = Number(quantity) || 0;
  const newBalance = (selectedSupply?.balance || 0) + quantityNum;
  const isValidBalance = Number.isFinite(quantityNum) && quantityNum > 0;

  const quickAddQuantity = (amount: number) => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + amount).toFixed(1));
  };

  const handleCreateSupply = () => {
    if (!newSupplyName.trim() || !newSupplyType.trim()) {
      setFormError("Informe o nome e o tipo do insumo.");
      return;
    }
    setFormError("");
    const newSupply: Supply = {
      id: `${Date.now()}`,
      name: newSupplyName.trim(),
      type: newSupplyType.trim(),
      color: newSupplyColor.trim() || "Não informado",
      balance: 0,
      status: "critico",
    };
    setSupplies((current) => [...current, newSupply]);
    setSelectedSupplyId(newSupply.id);
    setNewSupplyName("");
    setNewSupplyType("");
    setNewSupplyColor("");
    setShowNewSupply(false);
  };

  const handleConfirm = () => {
    if (!selectedSupply || !isValidBalance) {
      setFormError("Selecione um suprimento e informe uma quantidade positiva válida.");
      return;
    }
    setFormError("");
    setSupplies((current) =>
      current.map((supply) =>
        supply.id === selectedSupply.id
          ? {
              ...supply,
              balance: newBalance,
              status: newBalance < 0.5 ? "critico" : newBalance < 2 ? "abaixo" : "regular",
            }
          : supply,
      ),
    );
    setRecentEntries((current) => [
      {
        id: `${Date.now()}`,
        name: selectedSupply.name,
        quantity: quantityNum,
        date: new Date().toLocaleDateString("pt-BR"),
        units: units.trim(),
        lot: lot.trim(),
        observations: observations.trim(),
      },
      ...current,
    ]);
    navigate("/estoque");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#efe6e6] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate("/estoque")}
            className="inline-flex items-center gap-1 text-[#8B1329] hover:text-[#6b0f1f]"
          >
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
                  <button
                    type="button"
                    onClick={() => setShowNewSupply((visible) => !visible)}
                    aria-expanded={showNewSupply}
                    className="inline-flex items-center gap-1 text-xs text-[#8B1329] hover:text-[#6b0f1f] font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    {showNewSupply ? "Cancelar cadastro" : "Cadastrar Novo Insumo"}
                  </button>
                </div>
                {showNewSupply && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-4 bg-[#fff9f6] border border-[#efe6e6] rounded-lg">
                    <input
                      value={newSupplyName}
                      onChange={(event) => setNewSupplyName(event.target.value)}
                      placeholder="Nome do insumo"
                      aria-label="Nome do novo insumo"
                      className="px-3 py-2 border border-[#efe6e6] rounded-lg bg-white"
                    />
                    <input
                      value={newSupplyType}
                      onChange={(event) => setNewSupplyType(event.target.value)}
                      placeholder="Tipo"
                      aria-label="Tipo do novo insumo"
                      className="px-3 py-2 border border-[#efe6e6] rounded-lg bg-white"
                    />
                    <input
                      value={newSupplyColor}
                      onChange={(event) => setNewSupplyColor(event.target.value)}
                      placeholder="Cor (opcional)"
                      aria-label="Cor do novo insumo"
                      className="px-3 py-2 border border-[#efe6e6] rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSupply}
                      className="px-3 py-2 bg-[#8B1329] text-white rounded-lg font-semibold"
                    >
                      Adicionar à lista
                    </button>
                  </div>
                )}
                <select
                  value={selectedSupplyId}
                  onChange={(e) => setSelectedSupplyId(e.target.value)}
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white"
                >
                  <option value="">Selecione o insumo cadastrado na oficina...</option>
                  {supplies.map((supply) => (
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
                      min="0.1"
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
                        type="button"
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
                      min="1"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      placeholder="Ex.: 2 cartéis de 1kg"
                      className="flex-1 px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                    />
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
                          <span className="font-semibold text-[#1f1a1b]">{selectedSupply.balance.toFixed(1)} kg</span>
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
              {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate("/estoque")}
                  className="flex-1 px-6 py-3 border border-[#efe6e6] rounded-lg font-semibold text-[#1f1a1b] hover:bg-[#f7f0f0] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSupply || !isValidBalance}
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
                <span className="text-xs text-[#7a6e70] font-semibold">RECENTES</span>
              </div>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="pb-3 border-b border-[#efe6e6] last:border-0">
                    <p className="font-semibold text-[#1f1a1b] text-sm">{entry.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-[#7a6e70]">
                        {entry.date}{entry.units ? ` • ${entry.units} unidade(s)` : ""}{entry.lot ? ` • Lote: ${entry.lot}` : ""}
                      </p>
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
