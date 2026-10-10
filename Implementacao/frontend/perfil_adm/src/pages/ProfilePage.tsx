import { useState } from "react";
import { ChevronLeft, Edit2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearSession, getProfileStorageKey, getSession } from "../lib/session";
import { readJsonFromStorage } from "../lib/storage";

interface UserProfile {
  name: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  enrollment: string;
  avatar?: string;
  lastUpdated: string;
}

type StoredProfile = Partial<UserProfile> & { photoPreview?: string };

const mockUserProfile: UserProfile = {
  name: "Lucas Andrade",
  role: "Administrador de Laboratório",
  location: "LAB • MUSARQ UNICAP",
  email: "lucas.andrade@unicap.br",
  phone: "(81) 98877-6655",
  enrollment: "00000123456",
  lastUpdated: "12/03/2025 às 09:42",
};

export const ProfilePage = (): JSX.Element => {
  const navigate = useNavigate();
  const session = getSession();
  const [profile] = useState<UserProfile>(() => {
    if (!session) return mockUserProfile;
    const savedProfile = readJsonFromStorage<StoredProfile>(getProfileStorageKey(session.user.email));
    return savedProfile
      ? { ...mockUserProfile, ...savedProfile, avatar: savedProfile.photoPreview ?? savedProfile.avatar, role: session.user.role === "administrador" ? "Administrador de Laboratório" : "Técnico de Bancada" }
      : { ...mockUserProfile, name: session.user.name, email: session.user.email, role: session.user.role === "administrador" ? "Administrador de Laboratório" : "Técnico de Bancada" };
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    clearSession();
    navigate("/login", { replace: true });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#efe6e6]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            className="inline-flex items-center gap-2 text-[#8B1329] hover:text-[#6b0f1f] transition-colors font-medium text-sm"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          {/* Title and Last Update */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#8B1329] mb-2">Meu Perfil</h1>
            <p className="text-sm text-[#7a6e70]">
              Visualização dos dados cadastrais básicos vinculados ao laboratório MUSARQ UNICAP.
              Informações de identificação institucional e contato funcional.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="w-full h-1.5 bg-gradient-to-r from-[#8B1329] via-[#d4944f] to-[#F4C542] rounded-full" />
              <div className="ml-4 text-xs text-[#7a6e70] whitespace-nowrap">
                ⏱ Última atualização: {profile.lastUpdated}
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-[#fdeaea] to-white rounded-2xl p-6 mb-8 border border-[#f4c542]/20">
            <div className="flex gap-6 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.avatar?.startsWith("data:image/") ? (
                  <img src={profile.avatar} alt={`Foto de ${profile.name}`} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8B1329] to-[#d4944f] flex items-center justify-center text-white text-3xl font-bold">
                    {profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#1f1a1b] mb-1">{profile.name}</h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-[#8B1329]/10 text-[#8B1329] rounded-full text-xs font-semibold">
                    {profile.role}
                  </span>
                </div>
                <p className="text-sm text-[#7a6e70] mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {profile.location}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 ml-4">
                <button
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold text-sm hover:bg-[#6b0f1f] transition-colors shadow-md"
                  onClick={() => navigate("/editar-perfil")}
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Perfil
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#c0182f] border-2 border-[#c0182f] rounded-lg font-semibold text-sm hover:bg-[#c0182f]/5 transition-colors"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4" />
                  {isLoading ? "Encerrando..." : "Encerrar Sessão"}
                </button>
              </div>
            </div>
          </div>

          {/* Basic Data Section */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-[#8B1329] mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-[#8B1329] rounded-full"></span>
              Dados Básicos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="bg-[#f7f0f0] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#7a6e70] uppercase tracking-wide mb-2">
                  NOME COMPLETO
                </p>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[#8B1329]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="font-semibold text-[#1f1a1b]">{profile.name}</p>
                </div>
              </div>

              {/* Institutional Email */}
              <div className="bg-[#f7f0f0] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#7a6e70] uppercase tracking-wide mb-2">
                  E-MAIL INSTITUCIONAL
                </p>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[#8B1329]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="font-semibold text-[#1f1a1b]">{profile.email}</p>
                </div>
              </div>

              {/* Position/Role */}
              <div className="bg-[#f7f0f0] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#7a6e70] uppercase tracking-wide mb-2">
                  CARGO / FUNÇÃO
                </p>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[#8B1329]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4m0 2a2 2 0 11-4 0m4 0a2 2 0 014 0m-11 8a2 2 0 11-4 0m4 0a2 2 0 014 0m-11 0a9 9 0 0118 0m-9 0a9 9 0 008.949 8.061"
                    />
                  </svg>
                  <p className="font-semibold text-[#1f1a1b]">{profile.role}</p>
                </div>
              </div>

              {/* Phone/Ramal */}
              <div className="bg-[#f7f0f0] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#7a6e70] uppercase tracking-wide mb-2">
                  TELEFONE / RAMAL
                </p>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[#8B1329]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <p className="font-semibold text-[#1f1a1b]">{profile.phone}</p>
                </div>
              </div>

              {/* Enrollment/Matricula */}
              <div className="bg-[#f7f0f0] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#7a6e70] uppercase tracking-wide mb-2">
                  MATRÍCULA
                </p>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[#8B1329]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M10 6H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5m-4 0V5a2 2 0 10-4 0v1m4 0a2 2 0 104 0m0 0H9m4 0h4"
                    />
                  </svg>
                  <p className="font-semibold text-[#1f1a1b] font-mono">{profile.enrollment}</p>
                </div>
              </div>

              {/* Location/Vínculo */}
              <div className="bg-[#f7f0f0] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#7a6e70] uppercase tracking-wide mb-2">
                  LOTAÇÃO / VÍNCULO
                </p>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[#8B1329]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.581m0 0H9m5.581 0cm0 1.552-.89 2.898-2.25 3.623m0 0c-1.574.724-3.331.723-4.906-.001m2.656-3.622c1.36 0 2.573.456 3.423 1.228m0 0c-.955.732-2.343 1.295-3.99 1.295"
                    />
                  </svg>
                  <p className="font-semibold text-[#1f1a1b]">{profile.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-8 p-4 bg-[#fdeaea]/50 border border-[#f4c542]/30 rounded-lg">
            <p className="text-xs text-[#7a6e70]">
              <strong>Nota:</strong> Para editar informações do seu perfil, clique em "Editar
              Perfil". Algumas informações podem estar vinculadas ao sistema institucional e
              requerer autorização do administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
