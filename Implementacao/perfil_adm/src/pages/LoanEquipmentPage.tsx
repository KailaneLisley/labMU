import { FormEvent, useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePersistentState } from "../hooks/usePersistentState";
import { Equipment, initialEquipment, LoanStatus, LOANS_STORAGE_KEY } from "../data/loans";

const getStatusColor = (status: LoanStatus) => {
  switch (status) {
    case "em_campo":
      return "bg-purple-100 text-purple-700";
    case "atrasado":
      return "bg-orange-100 text-orange-700";
    case "devolucao_hoje":
      return "bg-yellow-100 text-yellow-700";
    case "disponivel":
      return "bg-green-100 text-green-700";
    case "devolvido":
      return "bg-gray-100 text-gray-700";
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
    case "disponivel":
      return "Disponível";
    case "devolvido":
      return "Devolvido";
  }
};

export const LoanEquipmentPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = usePersistentState<Equipment[]>(LOANS_STORAGE_KEY, initialEquipment);
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | "todos" | "ativos">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const activeCount = equipment.filter((item) => !["disponivel", "devolvido"].includes(item.status)).length;
  const [loanTarget, setLoanTarget] = useState<Equipment | null>(null);
  const [returnTarget, setReturnTarget] = useState<Equipment | null>(null);
  const [borrower, setBorrower] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      const statusMatch =
        selectedStatus === "todos" ||
        (selectedStatus === "ativos"
          ? ["em_campo", "atrasado", "devolucao_hoje"].includes(item.status)
          : item.status === selectedStatus);
      const searchMatch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.responsible.toLowerCase().includes(searchQuery.toLowerCase());

      return statusMatch && searchMatch;
    });
  }, [equipment, selectedStatus, searchQuery]);

  const statusCounts = {
    todos: equipment.length,
    em_campo: equipment.filter((e) => e.status === "em_campo").length,
    atrasado: equipment.filter((e) => e.status === "atrasado").length,
    devolucao_hoje: equipment.filter((e) => e.status === "devolucao_hoje").length,
    disponivel: equipment.filter((e) => e.status === "disponivel").length,
    devolvido: equipment.filter((e) => e.status === "devolvido").length,
  };

  const handleAction = (item: Equipment) => {
    if (item.status === "disponivel") {
      setBorrower("");
      setDueDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
      setLoanTarget(item);
      return;
    }

    if (item.status !== "devolvido") {
      setReturnTarget(item);
    }
  };

  const handleBorrow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loanTarget) return;
    setEquipment((current) =>
      current.map((item) =>
        item.id === loanTarget.id
          ? {
              ...item,
              responsible: borrower.trim(),
              dueDate: new Date(`${dueDate}T12:00:00`).toLocaleDateString("pt-BR"),
              status: "em_campo",
            }
          : item,
      ),
    );
    setLoanTarget(null);
  };

  const confirmReturn = () => {
    if (!returnTarget) return;
    setEquipment((current) =>
      current.map((item) =>
        item.id === returnTarget.id
          ? { ...item, responsible: "—", dueDate: "Devolvido", status: "devolvido" }
          : item,
      ),
    );
    setReturnTarget(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#1f1a1b]">Empréstimos de Equipamentos</h1>
          <button onClick={() => navigate("/emprestimo/registrar")} className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors">
            <Plus className="w-4 h-4" />
            + Novo Equipamento
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Ativos</p>
            <p className="text-5xl font-bold text-[#1f1a1b]">{activeCount}</p>
            <p className="text-xs text-[#7a6e70] mt-1">equipamentos em campo</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Devoluções Hoje</p>
            <p className="text-5xl font-bold text-[#8B1329]">{statusCounts.devolucao_hoje}</p>
            <p className="text-xs text-[#7a6e70] mt-1">devoluções previstas</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-3">Em Atraso</p>
            <p className="text-5xl font-bold text-yellow-600">{statusCounts.atrasado}</p>
            <p className="text-xs text-[#7a6e70] mt-1">equipamento atrasado</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-[#efe6e6] overflow-x-auto">
          {([
            { key: "todos", label: "Todos", count: statusCounts.todos },
            { key: "ativos", label: "Ativos", count: activeCount },
            { key: "atrasado", label: "Atrasados", count: statusCounts.atrasado },
            { key: "devolucao_hoje", label: "Devolução hoje", count: statusCounts.devolucao_hoje },
            { key: "disponivel", label: "Disponíveis", count: statusCounts.disponivel },
            { key: "devolvido", label: "Devolvidos", count: statusCounts.devolvido },
          ] as { key: LoanStatus | "todos" | "ativos"; label: string; count: number }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
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
        {loanTarget && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleBorrow} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-[#8B1329]">Registrar empréstimo</h2>
              <p className="text-sm text-[#7a6e70]">{loanTarget.name} • {loanTarget.code}</p>
              <label className="block text-sm font-semibold">
                Responsável
                <input required value={borrower} onChange={(event) => setBorrower(event.target.value)} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Data prevista para devolução
                <input required type="date" min={new Date().toISOString().slice(0, 10)} value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setLoanTarget(null)} className="rounded-lg border border-[#efe6e6] px-4 py-2">Cancelar</button>
                <button type="submit" className="rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Confirmar empréstimo</button>
              </div>
            </form>
          </div>
        )}
        {returnTarget && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="return-title">
            <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
              <h2 id="return-title" className="text-xl font-bold text-[#8B1329]">Confirmar devolução</h2>
              <p>Registrar a devolução de <strong>{returnTarget.name}</strong>?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setReturnTarget(null)} className="rounded-lg border border-[#efe6e6] px-4 py-2">Cancelar</button>
                <button onClick={confirmReturn} className="rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Confirmar devolução</button>
              </div>
            </div>
          </div>
        )}

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
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[760px]">
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
                    <button
                      onClick={() => handleAction(item)}
                      disabled={item.status === "devolvido"}
                      className="text-sm font-semibold text-[#8B1329] hover:text-[#6b0f1f] disabled:text-gray-400"
                    >
                      {item.status === "disponivel" ? "Registrar empréstimo" : item.status === "devolvido" ? "Devolvido" : "Registrar Devolução"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEquipment.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#7a6e70]">
                    Nenhum equipamento encontrado neste filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm text-[#7a6e70]">
          Mostrando {filteredEquipment.length} de {equipment.length} equipamentos.
        </p>
      </div>
    </div>
  );
};

export default LoanEquipmentPage;
