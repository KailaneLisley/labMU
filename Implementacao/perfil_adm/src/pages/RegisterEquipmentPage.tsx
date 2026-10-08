import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { usePersistentState } from "../hooks/usePersistentState";
import { Equipment, initialEquipment, LOANS_STORAGE_KEY } from "../data/loans";

type ConservationState = "novo" | "excelente" | "calibracao";

export const RegisterEquipmentPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = usePersistentState<Equipment[]>(LOANS_STORAGE_KEY, initialEquipment);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    tag: "",
    serialNumber: "",
    location: "",
    conservation: "novo" as ConservationState,
    accessories: "",
  });
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConservationChange = (state: ConservationState) => {
    setFormData((prev) => ({ ...prev, conservation: state }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.category || !formData.tag.trim() || !formData.location.trim()) {
      setSubmitError("Preencha todos os campos obrigatórios.");
      return;
    }
    if (equipment.some((item) => item.code.toLowerCase() === formData.tag.trim().toLowerCase())) {
      setSubmitError("Já existe um equipamento cadastrado com este código.");
      return;
    }
    setSubmitError("");
    setEquipment((current) => [
      ...current,
      {
        id: `${Date.now()}`,
        name: formData.name.trim(),
        code: formData.tag.trim(),
        responsible: "—",
        dueDate: "Disponível",
        status: "disponivel",
      },
    ]);
    navigate("/emprestimo");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/emprestimo")}
          className="inline-flex items-center gap-1 text-[#8B1329] hover:text-[#6b0f1f] mb-6 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Equipamentos
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-[#1f1a1b]">Registrar Equipamento</h1>
            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded">
              ⚡ Equipamento Portátil
            </span>
          </div>
          <p className="text-sm text-[#7a6e70]">
            Inclusão de ferramentas manuais, instrumentos de medição e equipamentos portáteis elegíveis para
            empréstimo e circulação acadêmica.
          </p>
          <div className="text-xs text-[#7a6e70] mt-4">
            <span className="font-semibold">ACERVO DO LABORATÓRIO</span>
            <span className="mx-2">/</span>
            <span className="text-[#8B1329] font-semibold">REGISTRAR EQUIPAMENTO</span>
          </div>
        </div>

        {submitError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          {/* Identificação do Equipamento */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">📋</span>
              <h2 className="text-xl font-bold text-[#1f1a1b]">Identificação do Equipamento</h2>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                  Nome / Descrição do Equipamento <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Paquímetro Digital Mitutoyo 150mm"
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white"
                />
                <p className="text-xs text-[#7a6e70] mt-1">
                  Ex: Scanner 3D Portátil, Paquímetro Digital
                </p>
              </div>

              {/* Categoria e Tag */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                    Categoria <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white"
                  >
                    <option value="">Selecione uma categoria técnica</option>
                    <option value="scanner">Scanner 3D</option>
                    <option value="medicao">Instrumentos de Medição</option>
                    <option value="ferramentas">Ferramentas Manuais</option>
                    <option value="camera">Câmeras e Fotografia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                    Código de Patrimônio / Tag ID <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="tag"
                      required
                      value={formData.tag}
                      onChange={handleInputChange}
                      placeholder="MUSARQ-EQ-3041"
                      className="flex-1 px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                    />
                    <button
                      type="button"
                      aria-label="Gerar código do equipamento"
                      title="Gerar um código de patrimônio"
                      onClick={() => setFormData((current) => ({
                        ...current,
                        tag: `MUSARQ-EQ-${String(Date.now()).slice(-4)}`,
                      }))}
                      className="p-3 border border-[#efe6e6] rounded-lg hover:bg-[#f7f0f0]"
                    >
                      <Sparkles className="w-4 h-4 text-[#7a6e70]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Número de Série */}
              <div>
                <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                  Número de Série do Fabricante <span className="text-[#7a6e70] text-xs ml-1">Opcional</span>
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  placeholder="ex: SN-MITU-8849204-B"
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                />
              </div>
            </div>
          </div>

          {/* Localização e Condição */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">📍</span>
              <h2 className="text-xl font-bold text-[#1f1a1b]">Localização e Condição</h2>
            </div>

            <div className="space-y-4">
              {/* Local de Guarda */}
              <div>
                <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                  Local de Guarda na Oficina <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="ex: Armário 01 — Maleta A, Gaveta 2, Prateleira C"
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                />
              </div>

              {/* Estado de Conservação */}
              <div>
                <label className="block text-sm font-semibold text-[#1f1a1b] mb-3">
                  Estado de Conservação no Ingresso <span className="text-red-600">*</span>
                </label>
                <div className="space-y-3">
                  {[
                    {
                      value: "novo",
                      label: "Novo / Lacrado",
                      description: "Sem uso prévio",
                    },
                    {
                      value: "excelente",
                      label: "Excelente",
                      description: "Totalmente operacional",
                    },
                    {
                      value: "calibracao",
                      label: "Requer Calibração",
                      description: "Revisão necessária",
                    },
                  ].map((option) => (
                    <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="conservation"
                        value={option.value}
                        checked={formData.conservation === option.value}
                        onChange={() => handleConservationChange(option.value as ConservationState)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1f1a1b]">{option.label}</p>
                        <p className="text-xs text-[#7a6e70]">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Acessórios */}
              <div>
                <label className="block text-sm font-semibold text-[#1f1a1b] mb-2">
                  Acessórios Inclusos & Componentes da Maleta{" "}
                  <span className="text-[#7a6e70] text-xs ml-1">Opcional</span>
                </label>
                <textarea
                  name="accessories"
                  value={formData.accessories}
                  onChange={handleInputChange}
                  placeholder="ex: Maleta rígida antichoque, cabo USB 3.0, pontas de prova adicionais, bateria sobressalente, chave Allen de ajuste."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329]"
                />
              </div>
            </div>
          </div>

          {/* Diretriz */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-[#1f1a1b] mb-2">
              📋 Diretriz Operacional do MUSARQ:
            </p>
            <p className="text-xs text-[#7a6e70]">
              Apenas equipamentos portáteis podem ser cadastrados para empréstimo externo. Máquinas fixas de
              prototipagem (impressoras 3D e cortadoras a laser) são de uso restrito à bancada do laboratório.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/emprestimo")}
              className="flex-1 px-6 py-3 border border-[#efe6e6] rounded-lg font-semibold text-[#1f1a1b] hover:bg-[#f7f0f0] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors inline-flex items-center justify-center gap-2"
            >
              ✓ Confirmar Registro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterEquipmentPage;
