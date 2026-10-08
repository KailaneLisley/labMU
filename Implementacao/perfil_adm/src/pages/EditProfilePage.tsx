import { useState, FormEvent, ChangeEvent } from "react";
import { ChevronLeft, Lock, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfileStorageKey, getSession, saveSession } from "../lib/session";
import { readJsonFromStorage } from "../lib/storage";

interface FormData {
  name: string;
  email: string;
  phone: string;
  photoFile: File | null;
  photoPreview: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  photo?: string;
}

const mockUserData = {
  name: "Lucas Andrade",
  email: "lucas.andrade@unicap.br",
  phone: "(81) 98877-6655",
  avatar: "",
  role: "Administrador de Laboratório",
  location: "LAB • MUSARQ UNICAP",
  enrollment: "00000123456",
};

export const EditProfilePage = (): JSX.Element => {
  const navigate = useNavigate();
  const session = getSession();
  const [formData, setFormData] = useState<FormData>(() => {
    const profile = session
      ? readJsonFromStorage<Partial<FormData>>(getProfileStorageKey(session.user.email))
      : null;
    return {
      name: profile?.name ?? session?.user.name ?? mockUserData.name,
      email: profile?.email ?? session?.user.email ?? mockUserData.email,
      phone: profile?.phone ?? mockUserData.phone,
      photoFile: null,
      photoPreview: profile?.photoPreview ?? mockUserData.avatar,
    };
  });

  const [originalData] = useState<FormData>(formData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true; // optional
    return /^[\d\s\-\(\)]+$/.test(phone) && phone.replace(/\D/g, "").length >= 10;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome completo é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail institucional é obrigatório";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Telefone inválido (mínimo 10 dígitos)";
    }

    if (formData.photoFile) {
      if (formData.photoFile.size > 2 * 1024 * 1024) {
        newErrors.photo = "Arquivo maior que 2MB";
      }
      if (!["image/jpeg", "image/png"].includes(formData.photoFile.type)) {
        newErrors.photo = "Apenas JPG e PNG são aceitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Arquivo maior que 2MB" }));
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: "Apenas JPG e PNG são aceitos" }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        photoFile: file,
        photoPreview: reader.result as string,
      }));
      setErrors((prev) => ({ ...prev, photo: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoFile: null,
      photoPreview: mockUserData.avatar,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (session) {
        const previousKey = getProfileStorageKey(session.user.email);
        const nextKey = getProfileStorageKey(formData.email);
        localStorage.setItem(
          nextKey,
          JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            photoPreview: formData.photoPreview,
            lastUpdated: new Date().toLocaleString("pt-BR"),
          }),
        );
        if (previousKey !== nextKey) localStorage.removeItem(previousKey);
        const remembered = Boolean(localStorage.getItem("labmu:session"));
        saveSession({
          ...session,
          user: { ...session.user, name: formData.name.trim(), email: formData.email.trim() },
        }, remembered);
        if (remembered) {
          localStorage.setItem("labmu:remember", JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            role: session.user.role,
          }));
        }
      }

      setSubmitMessage({
        type: "success",
        text: "Perfil atualizado com sucesso!",
      });

      setTimeout(() => {
        navigate("/perfil");
      }, 2000);
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Erro ao salvar perfil. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (JSON.stringify(formData) !== JSON.stringify(originalData)) {
      setConfirmDiscard(true);
    } else {
      navigate("/perfil");
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6]">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#efe6e6]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            className="inline-flex items-center gap-2 text-[#8B1329] hover:text-[#6b0f1f] transition-colors font-medium text-sm"
            onClick={() => navigate("/perfil")}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Perfil
          </button>
        </div>
        {confirmDiscard && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="discard-title">
            <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
              <h2 id="discard-title" className="text-xl font-bold text-[#8B1329]">Descartar alterações?</h2>
              <p>As mudanças que você fez não serão salvas.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDiscard(false)} className="rounded-lg border border-[#efe6e6] px-4 py-2">Continuar editando</button>
                <button onClick={() => navigate("/perfil")} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">Descartar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#8B1329] mb-2">Editar Perfil</h1>
            <p className="text-sm text-[#7a6e70] mb-4">
              Gerencie suas informações cadastrais e credenciais no laboratório.
            </p>
          </div>

          {/* Warning Alert */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              Você está no modo de edição. Modifique seus dados de contato e salve ao terminar.
            </p>
          </div>

          {/* Success/Error Message */}
          {submitMessage && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                submitMessage.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {submitMessage.type === "success" ? (
                <svg
                  className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p
                className={`text-sm ${
                  submitMessage.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {submitMessage.text}
              </p>
            </div>
          )}

          {/* Photo Section */}
          <div className="bg-gradient-to-br from-[#fdeaea] to-white rounded-2xl p-6 mb-8 border border-[#f4c542]/20">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                {formData.photoPreview.startsWith("data:image/") ? (
                  <img
                    src={formData.photoPreview}
                    alt={`Foto de ${formData.name}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#8B1329]/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8B1329] to-[#d4944f] flex items-center justify-center text-white text-2xl font-bold">
                    {formData.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#1f1a1b] mb-1">
                  {formData.name}
                </h2>
                <p className="text-sm text-[#7a6e70] mb-4">
                  {mockUserData.role} • {mockUserData.location}
                </p>

                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1329] text-white rounded-lg font-semibold text-sm hover:bg-[#6b0f1f] transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Alterar Foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>

                  {formData.photoPreview !== mockUserData.avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Remover
                    </button>
                  )}
                </div>

                {errors.photo && (
                  <p className="text-xs text-red-600 mt-2">{errors.photo}</p>
                )}

                <p className="text-xs text-[#7a6e70] mt-3">
                  Formatos aceitos: JPG ou PNG (máx. 2MB)
                </p>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <form onSubmit={handleSubmit}>
            {/* Section 1: Personal Data */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#8B1329] mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-[#8B1329] rounded-full"></span>
                1. Dados Pessoais e de Contato
              </h3>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-[#7a6e70] mb-2">
                    Nome Completo <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg font-semibold transition-colors ${
                      errors.name
                        ? "border-red-500 bg-red-50"
                        : "border-[#efe6e6] bg-[#f7f0f0]"
                    } focus:outline-none focus:border-[#8B1329] focus:bg-white`}
                    placeholder="Seu nome completo"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                  )}
                  <p className="text-xs text-[#7a6e70] mt-1">
                    Nome de artículo nas ordens de serviço e relatórios
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-[#7a6e70] mb-2">
                    E-mail Institucional <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg font-semibold transition-colors ${
                      errors.email
                        ? "border-red-500 bg-red-50"
                        : "border-[#efe6e6] bg-[#f7f0f0]"
                    } focus:outline-none focus:border-[#8B1329] focus:bg-white`}
                    placeholder="seu.email@unicap.br"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                  <p className="text-xs text-[#7a6e70] mt-1">
                    Utilizado para notificações e autenticação acadêmica
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-[#7a6e70] mb-2">
                    Telefone / Ramal <span className="text-gray-400">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg font-semibold transition-colors ${
                      errors.phone
                        ? "border-red-500 bg-red-50"
                        : "border-[#efe6e6] bg-[#f7f0f0]"
                    } focus:outline-none focus:border-[#8B1329] focus:bg-white`}
                    placeholder="(81) 98877-6655"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                  <p className="text-xs text-[#7a6e70] mt-1">
                    Ex.: (81) 98877-6655 ou Ramal 2145
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Institutional Data (Read-only) */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-[#8B1329] mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-[#8B1329] rounded-full"></span>
                2. Dados Institucionais e Funcionais
              </h3>

              <div className="space-y-4">
                {/* Role - Read Only */}
                <div>
                  <label className="block text-sm font-semibold text-[#7a6e70] mb-2">
                    Cargo / Função Técnica{" "}
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </span>
                  </label>
                  <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    <p className="flex-1 font-semibold text-[#1f1a1b]">
                      {mockUserData.role}
                    </p>
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-[#7a6e70] mt-1">
                    Permissões de acesso vinculadas ao nível funcional
                  </p>
                </div>

                {/* Enrollment - Read Only */}
                <div>
                  <label className="block text-sm font-semibold text-[#7a6e70] mb-2">
                    Matrícula Funcional{" "}
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </span>
                  </label>
                  <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    <p className="flex-1 font-semibold text-[#1f1a1b] font-mono">
                      {mockUserData.enrollment}
                    </p>
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-[#7a6e70] mt-1">
                    Identificador único registrado nos Recursos Humanos
                  </p>
                </div>

                {/* Location - Read Only */}
                <div>
                  <label className="block text-sm font-semibold text-[#7a6e70] mb-2">
                    Lotação / Vínculo Departamental{" "}
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </span>
                  </label>
                  <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    <p className="flex-1 font-semibold text-[#1f1a1b]">
                      {mockUserData.location} (Laboratório)
                    </p>
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-[#7a6e70] mt-1">
                    Departamento ou unidade onde você trabalha
                  </p>
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs text-orange-800">
                  Precisa atualizar cargo, matrícula ou lotação? Solicite a alteração diretamente à
                  coordenação pelo e-mail{" "}
                  <a href="mailto:musarq@unicap.br" className="font-semibold underline">
                    musarq@unicap.br
                  </a>
                </p>
              </div>
            </div>

            {/* Audit Info */}
            <div className="mb-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Auditoria:</strong> Todas as alterações são registradas na auditoria
                interna do labMU.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-6 py-2 bg-white text-[#c0182f] border-2 border-[#c0182f] rounded-lg font-semibold hover:bg-[#c0182f]/5 transition-colors"
              >
                Descartar Alterações
              </button>
              <button
                type="submit"
                disabled={!hasChanges || isSubmitting}
                className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                  !hasChanges || isSubmitting
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-[#8B1329] text-white hover:bg-[#6b0f1f]"
                }`}
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>
                )}
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
