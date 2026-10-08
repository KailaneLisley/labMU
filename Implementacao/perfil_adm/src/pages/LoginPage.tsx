import { FormEvent, useState, useEffect } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSession, saveSession as persistSession, UserRole } from "../lib/session";

interface MockUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

const MOCK_USERS: MockUser[] = [
  { email: "admin.musarq@unicap.br", password: "Admin@123", role: "administrador", name: "Administrador MUSARQ" },
  { email: "tecnico.musarq@unicap.br", password: "Tecnico@123", role: "tecnico", name: "Técnico MUSARQ" },
];

const CONFIG = {
  USE_MOCK: true,
  EMAIL_DOMAIN: "@unicap.br",
  MIN_PASSWORD_LENGTH: 6,
  ROUTES: {
    administrador: "/dashboard",
    tecnico: "/dashboard",
  },
};

const REMEMBER_KEY = "labmu:remember";

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("tecnico");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Validação
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, email: "Informe seu e-mail institucional." }));
      return false;
    }
    const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicPattern.test(value)) {
      setErrors((prev) => ({ ...prev, email: "Digite um e-mail válido." }));
      return false;
    }
    if (!value.toLowerCase().endsWith(CONFIG.EMAIL_DOMAIN)) {
      setErrors((prev) => ({ ...prev, email: `Use seu e-mail institucional (${CONFIG.EMAIL_DOMAIN}).` }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: undefined }));
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setErrors((prev) => ({ ...prev, password: "Informe sua senha." }));
      return false;
    }
    if (value.length < CONFIG.MIN_PASSWORD_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        password: `A senha deve ter ao menos ${CONFIG.MIN_PASSWORD_LENGTH} caracteres.`,
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: undefined }));
    return true;
  };

  const saveRememberedData = (email: string, role: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, role }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  };

  // Autenticação
  const authenticate = async (payload: { email: string; password: string; role: string }) => {
    if (CONFIG.USE_MOCK) {
      await sleep(900);
      const user = MOCK_USERS.find((u) => u.email === payload.email && u.password === payload.password);
      if (!user) {
        throw new Error("E-mail ou senha incorretos.");
      }
      if (user.role !== payload.role) {
        throw new Error(
          `Este usuário não possui o perfil de ${payload.role === "administrador" ? "Administrador" : "Técnico"}.`
        );
      }
      return { token: "mock-token", user: { name: user.name, email: user.email, role: user.role } };
    }

    // Real API integration would go here
    throw new Error("API não disponível em mock mode");
  };

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);
    if (!emailOk || !passwordOk) return;

    const payload = {
      email: email.trim().toLowerCase(),
      password,
      role,
    };

    setLoading(true);
    try {
      const data = await authenticate(payload);
      persistSession(data, remember);
      saveRememberedData(payload.email, payload.role, remember);

      setAlert({ type: "success", message: "Login realizado com sucesso! Redirecionando..." });
      await sleep(600);
      navigate(CONFIG.ROUTES[data.user.role] || CONFIG.ROUTES[payload.role as keyof typeof CONFIG.ROUTES]);
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Erro inesperado. Tente novamente.",
      });
      setPassword("");
      setLoading(false);
    }
  };

  // Restaurar dados salvos
  useEffect(() => {
    if (getSession()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const rawRemember = localStorage.getItem(REMEMBER_KEY);
    if (rawRemember) {
      try {
        const { email: savedEmail, role: savedRole } = JSON.parse(rawRemember);
        if (savedEmail) setEmail(savedEmail);
        if (savedRole === "administrador" || savedRole === "tecnico") setRole(savedRole);
        setRemember(true);
      } catch {
        localStorage.removeItem(REMEMBER_KEY);
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6] flex flex-col items-center justify-center p-4" style={{
      backgroundImage: `
        radial-gradient(circle at 0% 0%, rgba(255, 205, 205, 0.55) 0, transparent 38%),
        radial-gradient(circle at 100% 100%, rgba(255, 220, 185, 0.65) 0, transparent 40%)
      `
    }}>
      {/* Card */}
      <div className="w-full max-w-[430px] bg-white rounded-[20px] shadow-[0_10px_40px_rgba(139,19,41,0.08),0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <svg width="40" height="44" viewBox="0 0 40 44" fill="none">
            <path d="M20 1.5 37 11v22L20 42.5 3 33V11L20 1.5Z" fill="#8B1329" />
            <path d="M20 6 33 13.4v17.2L20 38 7 30.6V13.4L20 6Z" fill="none" stroke="#B8334A" strokeWidth="1" />
            <circle cx="20" cy="21" r="6" fill="#F4C542" />
            <circle cx="20" cy="21" r="2.4" fill="#8B1329" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-medium text-[#1f1a1b]">
              lab<strong className="text-[#8B1329]">MU</strong>
            </span>
            <span className="text-xs font-semibold text-[#7a6e70] tracking-widest">MUSARQ • UNICAP</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#8B1329] mb-1">Entrar no labMU</h1>
        <p className="text-center text-sm text-[#7a6e70] mb-7">Credenciais institucionais UNICAP</p>

        {/* Alert */}
        {alert && (
          <div
            role="alert"
            className={`mb-4 p-3 rounded-[10px] text-sm border ${
              alert.type === "error"
                ? "bg-[#fff1f3] border-[#f6c4cb] text-[#c0182f]"
                : "bg-[#effaf3] border-[#bfe5cd] text-[#1b7a43]"
            }`}
          >
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-xs font-semibold text-[#7a6e70] mb-2">
              E-mail Institucional
            </label>
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#4a4244]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="16" rx="2.5" />
                <circle cx="9" cy="11" r="2" />
                <path d="M5.8 16.5c.6-1.6 1.8-2.5 3.2-2.5s2.6.9 3.2 2.5" />
                <path d="M15 9.5h3.5M15 13h3.5" />
              </svg>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) validateEmail(e.target.value);
                }}
                onBlur={() => email && validateEmail(email)}
                placeholder="tecnico.musarq@unicap.br"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full h-11 pl-11 pr-4 py-3 bg-[#f7f0f0] rounded-[10px] border-2 border-transparent outline-none transition-colors font-medium text-sm ${
                  errors.email ? "border-[#c0182f] bg-[#fff7f8]" : "focus:border-[#8B1329] focus:bg-white"
                }`}
                required
              />
            </div>
            {errors.email && <p id="email-error" className="text-xs text-[#c0182f] mt-1.5">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="password" className="block text-xs font-semibold text-[#7a6e70]">
                Chave de Segurança / Senha
              </label>
              <a href="mailto:musarq@unicap.br?subject=Recuperar%20acesso%20ao%20labMU" className="text-xs font-medium text-[#6b0f1f] hover:underline">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#4a4244]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
                <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) validatePassword(e.target.value);
                }}
                placeholder="••••••••••••"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`w-full h-11 pl-11 pr-12 py-3 bg-[#f7f0f0] rounded-[10px] border-2 border-transparent outline-none transition-colors font-medium text-sm ${
                  errors.password ? "border-[#c0182f] bg-[#fff7f8]" : "focus:border-[#8B1329] focus:bg-white"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#4a4244] hover:bg-[rgba(139,19,41,0.08)] rounded-lg transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p id="password-error" className="text-xs text-[#c0182f] mt-1.5">{errors.password}</p>}
          </div>

          {/* Role Selection */}
          <fieldset className="mb-4">
            <legend className="sr-only">Perfil de acesso</legend>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#f7f0f0] rounded-[12px]">
              <label className="relative flex items-center justify-center h-9 rounded-[9px] cursor-pointer transition-all hover:bg-[rgba(139,19,41,0.05)]">
                <input
                  type="radio"
                  name="role"
                  value="tecnico"
                  checked={role === "tecnico"}
                  onChange={() => setRole("tecnico")}
                  className="absolute opacity-0 pointer-events-none"
                />
                <span
                  className={`absolute inset-0 rounded-[9px] transition-colors ${
                    role === "tecnico" ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : ""
                  }`}
                />
                <span className="relative text-xs font-semibold text-[#1f1a1b]">Técnico</span>
              </label>
              <label className="relative flex items-center justify-center h-9 rounded-[9px] cursor-pointer transition-all hover:bg-[rgba(139,19,41,0.05)]">
                <input
                  type="radio"
                  name="role"
                  value="administrador"
                  checked={role === "administrador"}
                  onChange={() => setRole("administrador")}
                  className="absolute opacity-0 pointer-events-none"
                />
                <span
                  className={`absolute inset-0 rounded-[9px] transition-colors ${
                    role === "administrador" ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : ""
                  }`}
                />
                <span className="relative text-xs font-semibold text-[#1f1a1b]">Administrador</span>
              </label>
            </div>
          </fieldset>
          <p className="text-center text-xs text-[#7a6e70] mb-6">Acesso exclusivo a técnicos e administradores credenciados.</p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2.5 bg-[#8B1329] text-white font-semibold rounded-[10px] shadow-[0_6px_14px_rgba(139,19,41,0.28)] hover:bg-[#6b0f1f] active:translate-y-0.5 active:shadow-[0_3px_8px_rgba(139,19,41,0.28)] disabled:opacity-80 disabled:cursor-progress transition-all"
          >
            {!loading && <LogIn className="w-[18px] h-[18px]" />}
            {loading && <span className="inline-block w-4 h-4 border-2 border-[rgba(255,255,255,0.4)] border-t-white rounded-full animate-spin" />}
            <span>{loading ? "Entrando..." : "Entrar no Sistema"}</span>
          </button>

          {/* Remember me */}
          <label className="flex items-center gap-2 mt-4 text-xs text-[#3b3335] cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="absolute opacity-0 pointer-events-none"
            />
            <span
              className={`w-4 h-4 border-2 border-[#8B1329] rounded-[3px] flex items-center justify-center transition-colors ${
                remember ? "bg-[#8B1329]" : "bg-white"
              }`}
            >
              {remember && <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="3.5"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
            </span>
            <span>Lembrar de mim</span>
          </label>
        </form>

        {/* Divider */}
        <hr className="my-6 border-0 border-t border-[#efe6e6]" />

        {/* First Access Link */}
        <p className="text-center text-xs text-[#3b3335] flex flex-wrap items-center justify-center gap-1.5">
          Primeiro acesso como gestor?
          <a href="mailto:musarq@unicap.br?subject=Solicitar%20acesso%20administrativo%20labMU" className="text-xs font-bold text-[#6b0f1f] inline-flex items-center gap-1 hover:underline">
            Criar conta de Administrador
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-xs text-[#a58f93] text-center">
        MUSARQ • Universidade Católica de Pernambuco
      </footer>
    </div>
  );
};

export default LoginPage;
