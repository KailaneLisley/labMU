import { FormEvent, useState, useMemo } from "react";
import { Plus, Edit2, MoreVertical, Search } from "lucide-react";
import { usePersistentState } from "../hooks/usePersistentState";

type MachineType = "printer_3d_fdm" | "printer_3d_resin" | "scanner";
type MachineTypeFilter = MachineType | "3d" | "all";
type MachineStatus = "ativa" | "manutencao" | "inativa";

interface Machine {
  id: string;
  name: string;
  tag: string;
  type: MachineType;
  dimensions?: string;
  location: {
    bench: string;
    room: string;
  };
  status: MachineStatus;
  lastMaintenance?: Date;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mockMachines: Machine[] = [
  {
    id: "1",
    name: "Creality K1 Max",
    tag: "TAG #N01",
    type: "printer_3d_fdm",
    dimensions: "380x380mm",
    location: { bench: "Bancada 01", room: "Oficina Principal" },
    status: "ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Bambu Lab X1-Carbon",
    tag: "TAG #N02",
    type: "printer_3d_fdm",
    dimensions: "AMS 4-cores",
    location: { bench: "Bancada 01", room: "Ala Precisão" },
    status: "ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Creality Ender 3 S1",
    tag: "TAG #N03",
    type: "printer_3d_fdm",
    dimensions: "220x220mm",
    location: { bench: "Bancada 02", room: "Oficina Principal" },
    status: "ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Elegoo Saturn 3 12K",
    tag: "TAG #N04",
    type: "printer_3d_resin",
    dimensions: "Resina 405nm",
    location: { bench: "Bancada Química", room: "Estação Isolada" },
    status: "ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    name: "Creality Ender 3 v2",
    tag: "TAG #N05",
    type: "printer_3d_fdm",
    dimensions: "Nivelamento manual",
    location: { bench: "Bancada 02", room: "Mesa de Ajuste" },
    status: "manutencao",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    name: "EinScan Pro HD",
    tag: "TAG #S01",
    type: "scanner",
    dimensions: "Luz Estruturada",
    location: { bench: "Sala de Captura", room: "Mesa Giratória" },
    status: "ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "7",
    name: "Creality CR-Scan Ferret",
    tag: "TAG #S02",
    type: "scanner",
    dimensions: "Portátil: b.jff",
    location: { bench: "Sala de Captura", room: "Uso Externo/Móvel" },
    status: "ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const MachinesPage = (): JSX.Element => {
  const [machines, setMachines] = usePersistentState<Machine[]>("labmu:machines", mockMachines);
  const [selectedType, setSelectedType] = useState<MachineTypeFilter>("all");
  const [selectedStatus, setSelectedStatus] = useState<MachineStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    type: "printer_3d_fdm" as MachineType,
    dimensions: "",
    bench: "",
    room: "",
    status: "ativa" as MachineStatus,
  });

  // Filtrado e buscado
  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const typeMatch =
        selectedType === "all" ||
        machine.type === selectedType ||
        (selectedType === "3d" && machine.type !== "scanner");
      const statusMatch = selectedStatus === "all" || machine.status === selectedStatus;
      const searchMatch =
        searchQuery === "" ||
        machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.tag.toLowerCase().includes(searchQuery.toLowerCase());

      return typeMatch && statusMatch && searchMatch;
    });
  }, [machines, selectedType, selectedStatus, searchQuery]);

  // Contagens
  const typeCounts = {
    all: machines.length,
    printer_3d_fdm: machines.filter((m) => m.type === "printer_3d_fdm").length,
    printer_3d_resin: machines.filter((m) => m.type === "printer_3d_resin").length,
    scanner: machines.filter((m) => m.type === "scanner").length,
  };

  const activeCount = machines.filter((m) => m.status === "ativa").length;
  const maintenanceCount = machines.filter((m) => m.status === "manutencao").length;
  const availabilityPercent = machines.length ? Math.round((activeCount / machines.length) * 100) : 0;

  const openEditor = (machine?: Machine) => {
    setEditingMachineId(machine?.id ?? null);
    setFormData({
      name: machine?.name ?? "",
      tag: machine?.tag ?? "",
      type: machine?.type ?? "printer_3d_fdm",
      dimensions: machine?.dimensions ?? "",
      bench: machine?.location.bench ?? "",
      room: machine?.location.room ?? "",
      status: machine?.status ?? "ativa",
    });
    setMenuOpen(null);
    setEditorError("");
    setEditorOpen(true);
  };

  const handleSaveMachine = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const duplicateTag = machines.some(
      (machine) =>
        machine.tag.toLowerCase() === formData.tag.trim().toLowerCase() &&
        machine.id !== editingMachineId,
    );
    if (duplicateTag) {
      setEditorError("Já existe uma máquina cadastrada com esta TAG.");
      return;
    }
    const now = new Date();
    setMachines((current) => {
      if (editingMachineId) {
        return current.map((machine) =>
          machine.id === editingMachineId
            ? {
                ...machine,
                ...formData,
                location: { bench: formData.bench, room: formData.room },
                updatedAt: now,
              }
            : machine,
        );
      }
      return [
        ...current,
        {
          id: `${Date.now()}`,
          ...formData,
          location: { bench: formData.bench, room: formData.room },
          createdAt: now,
          updatedAt: now,
        },
      ];
    });
    setEditorOpen(false);
    setEditorError("");
  };

  const setMachineStatus = (id: string, status: MachineStatus) => {
    setMachines((current) =>
      current.map((machine) => (machine.id === id ? { ...machine, status, updatedAt: new Date() } : machine)),
    );
    setMenuOpen(null);
  };

  const deleteMachine = (machine: Machine) => {
    setMachineToDelete(machine);
    setMenuOpen(null);
  };

  const confirmDeleteMachine = () => {
    if (!machineToDelete) return;
    const id = machineToDelete.id;
    setMachines((current) => current.filter((item) => item.id !== id));
    setMachineToDelete(null);
  };

  const getTypeIcon = (type: MachineType) => {
    switch (type) {
      case "printer_3d_fdm":
      case "printer_3d_resin":
        return "🔴";
      case "scanner":
        return "🔵";
    }
  };

  const getTypeLabel = (type: MachineType) => {
    switch (type) {
      case "printer_3d_fdm":
        return "Impressora 3D FDM";
      case "printer_3d_resin":
        return "Impressora 3D Resina";
      case "scanner":
        return "Scanner Óptico";
    }
  };

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case "ativa":
        return "bg-green-100 text-green-800";
      case "manutencao":
        return "bg-orange-100 text-orange-800";
      case "inativa":
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: MachineStatus) => {
    switch (status) {
      case "ativa":
        return "✅ Ativa";
      case "manutencao":
        return "🟠 Em Manutenção";
      case "inativa":
        return "❌ Inativa";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#8B1329] mb-2">
              Máquinas & Equipamentos
            </h1>
            <p className="text-sm text-[#7a6e70]">
              Parque de impressoras 3D e scanners do MUSARQ
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold hover:bg-[#6b0f1f] transition-colors"
            onClick={() => openEditor()}
          >
            <Plus className="w-4 h-4" />
            Nova Máquina
          </button>
        </div>

        {editorOpen && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSaveMachine} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-[#8B1329]">{editingMachineId ? "Editar máquina" : "Nova máquina"}</h2>
              {editorError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{editorError}</p>}
              <label className="block text-sm font-semibold">
                Nome / Modelo
                <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  TAG
                  <input required value={formData.tag} onChange={(event) => setFormData({ ...formData, tag: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
                </label>
                <label className="block text-sm font-semibold">
                  Tipo
                  <select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value as MachineType })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2">
                    <option value="printer_3d_fdm">Impressora FDM</option>
                    <option value="printer_3d_resin">Impressora Resina</option>
                    <option value="scanner">Scanner</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  Bancada
                  <input required value={formData.bench} onChange={(event) => setFormData({ ...formData, bench: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
                </label>
                <label className="block text-sm font-semibold">
                  Sala / Local
                  <input required value={formData.room} onChange={(event) => setFormData({ ...formData, room: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Descrição técnica
                <input value={formData.dimensions} onChange={(event) => setFormData({ ...formData, dimensions: event.target.value })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Status
                <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as MachineStatus })} className="mt-1 w-full rounded-lg border border-[#efe6e6] px-3 py-2">
                  <option value="ativa">Ativa</option>
                  <option value="manutencao">Em manutenção</option>
                  <option value="inativa">Inativa</option>
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditorOpen(false)} className="rounded-lg border border-[#efe6e6] px-4 py-2">Cancelar</button>
                <button type="submit" className="rounded-lg bg-[#8B1329] px-4 py-2 font-semibold text-white">Salvar</button>
              </div>
            </form>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#8B1329]">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">
              Total de Máquinas
            </p>
            <p className="text-3xl font-bold text-[#1f1a1b] mb-1">{machines.length}</p>
            <p className="text-xs text-[#7a6e70]">cadastradas</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">
              Disponibilidade
            </p>
            <p className="text-3xl font-bold text-[#1f1a1b] mb-1">{availabilityPercent}%</p>
            <p className="text-xs text-[#7a6e70]">em operação</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-xs font-semibold text-[#7a6e70] uppercase mb-2">
              Em Manutenção
            </p>
            <p className="text-3xl font-bold text-[#1f1a1b] mb-1">{maintenanceCount}</p>
            <p className="text-xs text-[#7a6e70]">máquina</p>
          </div>
        </div>
        {machineToDelete && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-machine-title">
            <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
              <h2 id="delete-machine-title" className="text-xl font-bold text-[#8B1329]">Remover máquina</h2>
              <p>Remover <strong>{machineToDelete.name}</strong> do cadastro?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setMachineToDelete(null)} className="rounded-lg border border-[#efe6e6] px-4 py-2">Cancelar</button>
                <button onClick={confirmDeleteMachine} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">Remover</button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#efe6e6]">
          <button
            onClick={() => {
              setSelectedType("all");
              setSelectedStatus("all");
            }}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
              selectedType === "all" && selectedStatus === "all"
                ? "border-[#8B1329] text-[#8B1329]"
                : "border-transparent text-[#7a6e70] hover:text-[#1f1a1b]"
            }`}
          >
            Todas ({typeCounts.all})
          </button>
          <button
            onClick={() => {
              setSelectedType("3d");
              setSelectedStatus("all");
            }}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
              selectedType === "3d"
                ? "border-[#8B1329] text-[#8B1329]"
                : "border-transparent text-[#7a6e70] hover:text-[#1f1a1b]"
            }`}
          >
            Impressoras 3D ({typeCounts.printer_3d_fdm + typeCounts.printer_3d_resin})
          </button>
          <button
            onClick={() => {
              setSelectedType("scanner");
              setSelectedStatus("all");
            }}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
              selectedType === "scanner"
                ? "border-[#8B1329] text-[#8B1329]"
                : "border-transparent text-[#7a6e70] hover:text-[#1f1a1b]"
            }`}
          >
            Scanners ({typeCounts.scanner})
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex gap-4 mb-6 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7a6e70]" />
            <input
              type="text"
              placeholder="Buscar por código ou modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] focus:bg-white transition-colors"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as MachineStatus | "all")}
            className="px-4 py-2 border border-[#efe6e6] rounded-lg bg-[#f7f0f0] focus:outline-none focus:border-[#8B1329] text-sm font-medium"
          >
            <option value="all">Todos os status</option>
            <option value="ativa">Ativa</option>
            <option value="manutencao">Em Manutenção</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {filteredMachines.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#7a6e70] font-medium mb-2">Nenhuma máquina encontrada</p>
              <p className="text-sm text-[#a79b9d]">Tente ajustar seus filtros ou criar uma nova</p>
            </div>
          ) : (
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-[#f3f4f6] border-b border-[#efe6e6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">
                    Máquina / Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">
                    Bancada / Local
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a6e70] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#7a6e70] uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMachines.map((machine, index) => (
                  <tr
                    key={machine.id}
                    className={`border-b border-[#efe6e6] hover:bg-[#fef3c7]/30 transition-colors ${
                      index % 2 === 0 ? "" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <span className="text-xl mt-1">{getTypeIcon(machine.type)}</span>
                        <div>
                          <p className="font-semibold text-[#1f1a1b]">{machine.name}</p>
                          <p className="text-xs text-[#7a6e70] mt-1">
                            {machine.tag} • {machine.dimensions}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#1f1a1b]">
                        {getTypeLabel(machine.type)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#1f1a1b]">{machine.location.bench}</p>
                        <p className="text-xs text-[#7a6e70]">{machine.location.room}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(machine.status)}`}>
                        {getStatusLabel(machine.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 hover:bg-[#f7f0f0] rounded-lg transition-colors"
                          onClick={() => openEditor(machine)}
                          aria-label={`Editar ${machine.name}`}
                        >
                          <Edit2 className="w-4 h-4 text-[#8B1329]" />
                        </button>
                        <div className="relative">
                          <button
                            className="p-2 hover:bg-[#f7f0f0] rounded-lg transition-colors"
                            onClick={() => setMenuOpen(menuOpen === machine.id ? null : machine.id)}
                            aria-label={`Mais ações para ${machine.name}`}
                          >
                            <MoreVertical className="w-4 h-4 text-[#7a6e70]" />
                          </button>
                          {menuOpen === machine.id && (
                            <div className="absolute right-0 mt-1 bg-white border border-[#efe6e6] rounded-lg shadow-lg z-10 min-w-[150px]">
                              <button onClick={() => openEditor(machine)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f7f0f0] transition-colors">
                                Editar
                              </button>
                              <button onClick={() => setMachineStatus(machine.id, "manutencao")} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f7f0f0] transition-colors">
                                Marcar em manutenção
                              </button>
                              <button onClick={() => setMachineStatus(machine.id, "ativa")} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f7f0f0] transition-colors">
                                Marcar como ativa
                              </button>
                              <button onClick={() => deleteMachine(machine)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                Remover
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between text-sm text-[#7a6e70]">
          <p>Mostrando {filteredMachines.length} de {machines.length} máquinas cadastradas</p>
          <p>Página 1 de 1</p>
        </div>
      </div>
    </div>
  );
};

export default MachinesPage;
