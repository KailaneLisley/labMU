import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, Phone, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { initialUsers, User, USERS_STORAGE_KEY } from "../data/users";
import { ACCOUNTS_STORAGE_KEY, RegisteredAccount } from "../lib/accounts";
import { readJsonFromStorage } from "../lib/storage";
import { api } from "../services/api";

interface RegistrationForm {
  name: string;
  email: string;
  registration: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const DEMO_EMAILS = ["admin.musarq@unicap.br", "tecnico.musarq@unicap.br"];

export const RegisterPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationForm>({
    name: "",
    email: "",
    registration: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const updateField = (field: keyof RegistrationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const name = form.name.trim().replace(/\s+/g, " ");
    const email = form.email.trim().toLowerCase();
    const registration = form.registration.trim();
    const phone = form.phone.trim();

    if (name.length < 3) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!/^[^\s@]+@unicap\.br$/i.test(email)) {
      setError("Use um e-mail institucional no formato nome@unicap.br.");
      return;
    }
    if (registration.length < 3) {
      setError("Informe uma matrícula válida.");
      return;
    }
    if (phone && (!/^[\d\s()+-]+$/.test(phone) || phone.replace(/\D/g, "").length < 10)) {
      setError("Informe um telefone válido ou deixe o campo em branco.");
      return;
    }
    if (form.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError("A senha deve conter pelo menos uma letra e um número.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Tenta cadastrar no backend via API
      try {
        await api.register({
          name,
          email,
          registration,
          phone,
          password: form.password,
        });

        navigate("/login", {
          replace: true,
          state: { registeredEmail: email },
        });
        return;
      } catch (apiErr: any) {
        if (!apiErr?.message?.includes("Não foi possível conectar ao servidor")) {
          // Erro retornado pela API do backend (ex: email duplicado, validação)
          setError(apiErr.message);
          setIsSubmitting(false);
          return;
        }
        // Se o servidor estiver indisponível, segue para o fallback local
        console.warn("Backend offline, persistindo cadastro localmente...");
      }

      const users = readJsonFromStorage<User[]>(USERS_STORAGE_KEY) ?? initialUsers;
      const accounts = readJsonFromStorage<RegisteredAccount[]>(ACCOUNTS_STORAGE_KEY) ?? [];
      const emailExists =
        users.some((user) => user.email.toLowerCase() === email) ||
        accounts.some((account) => account.email.toLowerCase() === email) ||
        DEMO_EMAILS.includes(email);
      if (emailExists) {
        setError("Este e-mail já possui um cadastro. Acesse sua conta ou solicite ajuda à coordenação.");
        setIsSubmitting(false);
        return;
      }
      if (users.some((user) => user.registration.trim() === registration)) {
        setError("Esta matrícula já está vinculada a outro usuário.");
        setIsSubmitting(false);
        return;
      }

      const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
      const newUser: User = {
        id: `cadastro-${Date.now()}`,
        name,
        email,
        role: "tecnico",
        registration,
        phone: phone || "Não informado",
        status: "ativo",
        initials,
        avatarColor: "bg-[#fdeaea]",
      };
      const newAccount: RegisteredAccount = { email, password: form.password, name };
      const previousUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const previousAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);

      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([...accounts, newAccount]));
      } catch (storageError) {
        if (previousUsers === null) localStorage.removeItem(USERS_STORAGE_KEY);
        else localStorage.setItem(USERS_STORAGE_KEY, previousUsers);
        if (previousAccounts === null) localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
        else localStorage.setItem(ACCOUNTS_STORAGE_KEY, previousAccounts);
        throw storageError;
      }

      navigate("/login", {
        replace: true,
        state: { registeredEmail: email },
      });
    } catch (storageError) {
      console.error("Não foi possível salvar o cadastro no navegador.", storageError);
      setError("Não foi possível salvar o cadastro neste navegador. Verifique o espaço disponível e tente novamente.");
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-[10px] border-2 border-transparent bg-[#f7f0f0] py-3 pl-11 pr-4 text-sm font-medium outline-none transition-colors focus:border-[#8B1329] focus:bg-white";

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6] p-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 0% 0%, rgba(255, 205, 205, 0.55) 0, transparent 38%), radial-gradient(circle at 100% 100%, rgba(255, 220, 185, 0.65) 0, transparent 40%)",
      }}
    >
      <div className="my-6 w-full max-w-[520px] rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(139,19,41,0.08),0_2px_8px_rgba(0,0,0,0.04)] sm:p-10">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#8B1329] hover:text-[#6b0f1f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para entrar
        </Link>

        <div className="mb-6 flex items-center justify-center gap-2.5">
          <svg width="40" height="44" viewBox="0 0 40 44" fill="none" aria-hidden="true">
            <path d="M20 1.5 37 11v22L20 42.5 3 33V11L20 1.5Z" fill="#8B1329" />
            <path d="M20 6 33 13.4v17.2L20 38 7 30.6V13.4L20 6Z" fill="none" stroke="#B8334A" />
            <circle cx="20" cy="21" r="6" fill="#F4C542" />
            <circle cx="20" cy="21" r="2.4" fill="#8B1329" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-medium text-[#1f1a1b]">
              lab<strong className="text-[#8B1329]">MU</strong>
            </span>
            <span className="text-xs font-semibold tracking-widest text-[#7a6e70]">MUSARQ • UNICAP</span>
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-[#8B1329]">Criar conta de Técnico</h1>
        <p className="mb-6 mt-1 text-center text-sm text-[#7a6e70]">
          Preencha seus dados institucionais para acessar o labMU.
        </p>

        {error && (
          <div role="alert" className="mb-5 rounded-[10px] border border-[#f6c4cb] bg-[#fff1f3] p-3 text-sm text-[#c0182f]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="register-name">
            Nome completo
            <span className="relative mt-2 block">
              <UserIcon className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#4a4244]" />
              <input
                id="register-name"
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Seu nome e sobrenome"
                className={inputClass}
                required
              />
            </span>
          </label>

          <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="register-email">
            E-mail institucional
            <span className="relative mt-2 block">
              <Mail className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#4a4244]" />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="nome@unicap.br"
                className={inputClass}
                required
              />
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="register-id">
              Matrícula
              <input
                id="register-id"
                autoComplete="off"
                value={form.registration}
                onChange={(event) => updateField("registration", event.target.value)}
                placeholder="Sua matrícula"
                className="mt-2 w-full rounded-[10px] border-2 border-transparent bg-[#f7f0f0] px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-[#8B1329] focus:bg-white"
                required
              />
            </label>

            <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="register-phone">
              Telefone <span className="font-normal">(opcional)</span>
              <span className="relative mt-2 block">
                <Phone className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#4a4244]" />
                <input
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(81) 99999-9999"
                  className={inputClass}
                />
              </span>
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="register-password">
            Senha <span className="font-normal">(mínimo 8 caracteres, com letra e número)</span>
            <span className="relative mt-2 block">
              <KeyRound className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#4a4244]" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className={`${inputClass} pr-12`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#4a4244] hover:bg-[rgba(139,19,41,0.08)]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
          </label>

          <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="register-confirm-password">
            Confirmar senha
            <span className="relative mt-2 block">
              <KeyRound className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#4a4244]" />
              <input
                id="register-confirm-password"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                className={`${inputClass} pr-12`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((visible) => !visible)}
                aria-label={showConfirmation ? "Ocultar confirmação da senha" : "Mostrar confirmação da senha"}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#4a4244] hover:bg-[rgba(139,19,41,0.08)]"
              >
                {showConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
          </label>

          <div className="rounded-[10px] border border-[#efe6e6] bg-[#fff9f6] p-3 text-xs leading-relaxed text-[#7a6e70]">
            O cadastro demonstrativo cria uma conta de Técnico e a inclui na lista de usuários.
            Administradores são cadastrados pela coordenação.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#8B1329] font-semibold text-white shadow-[0_6px_14px_rgba(139,19,41,0.28)] transition-colors hover:bg-[#6b0f1f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Criando conta..." : "Criar minha conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7a6e70]">
          Já tem cadastro?{" "}
          <Link to="/login" className="font-bold text-[#6b0f1f] hover:underline">
            Entrar no sistema
          </Link>
        </p>
      </div>
      <p className="mb-4 text-center text-xs text-[#7a6e70]">
        Modo de demonstração: dados e senha ficam armazenados neste navegador.
      </p>
    </main>
  );
};

export default RegisterPage;
