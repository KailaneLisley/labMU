import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, HelpCircle, KeyRound, Mail, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ACCOUNTS_STORAGE_KEY, RegisteredAccount } from "../../lib/accounts";
import { readJsonFromStorage } from "../../lib/storage";
import { api } from "../../services/api";

type Step = "EMAIL" | "QUESTION" | "NEW_PASSWORD" | "SUCCESS";

export const ForgotPasswordPage = (): JSX.Element => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState(false);

  const inputClass =
    "w-full h-11 pl-11 pr-4 py-3 bg-[#f7f0f0] rounded-[10px] border-2 border-transparent outline-none transition-colors font-medium text-sm text-[#1f1a1b] placeholder:text-[#a79b9d] focus:border-[#8B1329] focus:bg-white";

  // Passo 1: Verificar se o e-mail existe e se é técnico
  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setAdminNotice(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Informe seu e-mail institucional.");
      return;
    }

    if (!cleanEmail.endsWith("@unicap.br")) {
      setError("Use seu e-mail institucional (@unicap.br).");
      return;
    }

    setLoading(true);
    try {
      try {
        const res = await api.verifyForgotEmail(cleanEmail);
        setQuestion(res.question);
        setStep("QUESTION");
        setLoading(false);
        return;
      } catch (apiErr: any) {
        // Se for erro específico do backend (ex: Administrador restrito ou email não encontrado)
        if (!apiErr?.message?.includes("Não foi possível conectar ao servidor")) {
          if (apiErr.message.includes("Administrador")) {
            setAdminNotice(true);
          } else {
            setError(apiErr.message);
          }
          setLoading(false);
          return;
        }
      }

      // Fallback local (caso backend offline)
      if (cleanEmail === "admin.musarq@unicap.br") {
        setAdminNotice(true);
        setLoading(false);
        return;
      }

      const localAccounts = readJsonFromStorage<RegisteredAccount[]>(ACCOUNTS_STORAGE_KEY) ?? [];
      const account = localAccounts.find((a) => a.email.toLowerCase() === cleanEmail);

      if (cleanEmail === "tecnico.musarq@unicap.br") {
        setQuestion("Qual o nome do seu primeiro animal de estimação?");
        setStep("QUESTION");
      } else if (account) {
        if (account.role === "administrador") {
          setAdminNotice(true);
        } else if (account.securityQuestion) {
          setQuestion(account.securityQuestion);
          setStep("QUESTION");
        } else {
          setError("Esta conta não possui uma pergunta de segurança cadastrada. Fale com a coordenação.");
        }
      } else {
        setError("E-mail não encontrado no sistema. Verifique os dados digitados.");
      }
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao verificar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Validar a resposta da pergunta secreta
  const handleVerifyAnswer = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAnswer = answer.trim();
    if (!cleanAnswer) {
      setError("Informe a resposta da pergunta de segurança.");
      return;
    }

    setLoading(true);
    try {
      try {
        const res = await api.verifyForgotAnswer(email.trim().toLowerCase(), cleanAnswer);
        setResetToken(res.resetToken);
        setStep("NEW_PASSWORD");
        setLoading(false);
        return;
      } catch (apiErr: any) {
        if (!apiErr?.message?.includes("Não foi possível conectar ao servidor")) {
          setError(apiErr.message);
          setLoading(false);
          return;
        }
      }

      // Fallback local
      const cleanEmail = email.trim().toLowerCase();
      const localAccounts = readJsonFromStorage<RegisteredAccount[]>(ACCOUNTS_STORAGE_KEY) ?? [];
      const account = localAccounts.find((a) => a.email.toLowerCase() === cleanEmail);

      const expectedAnswer =
        cleanEmail === "tecnico.musarq@unicap.br" ? "rex" : (account?.securityAnswer || "").trim().toLowerCase();

      if (cleanAnswer.toLowerCase() === expectedAnswer) {
        setResetToken("mock-reset-token");
        setStep("NEW_PASSWORD");
      } else {
        setError("Resposta incorreta. Tente novamente.");
      }
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao validar a resposta.");
    } finally {
      setLoading(false);
    }
  };

  // Passo 3: Salvar nova senha
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("A senha deve conter ao menos 8 caracteres.");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("A senha deve conter ao menos uma letra e um número.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      try {
        await api.resetPassword({
          email: cleanEmail,
          resetToken,
          newPassword,
        });
        setStep("SUCCESS");
        setLoading(false);
        return;
      } catch (apiErr: any) {
        if (!apiErr?.message?.includes("Não foi possível conectar ao servidor")) {
          setError(apiErr.message);
          setLoading(false);
          return;
        }
      }

      // Fallback local
      const localAccounts = readJsonFromStorage<RegisteredAccount[]>(ACCOUNTS_STORAGE_KEY) ?? [];
      const updatedAccounts = localAccounts.map((a) =>
        a.email.toLowerCase() === cleanEmail ? { ...a, password: newPassword } : a
      );
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));

      setStep("SUCCESS");
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#fff9f6] via-white to-[#fff9f6] flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(circle at 0% 0%, rgba(255, 205, 205, 0.55) 0, transparent 38%),
          radial-gradient(circle at 100% 100%, rgba(255, 220, 185, 0.65) 0, transparent 40%)
        `,
      }}
    >
      <div className="w-full max-w-[460px] bg-white rounded-[20px] shadow-[0_10px_40px_rgba(139,19,41,0.08),0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-10">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#8B1329] hover:text-[#6b0f1f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="brand__logo flex items-center justify-center flex-shrink-0">
            <img src="/Logo-unicap.png" alt="logo-unicap" className="h-10 w-auto max-w-[120px] object-contain" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-medium text-[#1f1a1b]">
              lab<strong className="text-[#8B1329]">MU</strong>
            </span>
            <span className="text-xs font-semibold text-[#7a6e70] tracking-widest">MUSARQ • UNICAP</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#8B1329] mb-1">Recuperar Senha</h1>
        <p className="text-center text-sm text-[#7a6e70] mb-6">
          {step === "EMAIL" && "Etapa 1 de 3: Identificação do Técnico"}
          {step === "QUESTION" && "Etapa 2 de 3: Validação de Segurança"}
          {step === "NEW_PASSWORD" && "Etapa 3 de 3: Definição da Nova Senha"}
          {step === "SUCCESS" && "Recuperação Concluída"}
        </p>

        {/* Alerta de Administrador Restrito */}
        {adminNotice && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-[12px] text-xs leading-relaxed bg-[#fff1f3] border border-[#f6c4cb] text-[#901328]"
          >
            <div className="flex items-center gap-2 mb-2 font-bold text-sm text-[#c0182f]">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              Recuperação Restrita para Administradores
            </div>
            <p className="mb-2">
              Contas de Administrador possuem privilégios de gestão total do sistema e, por motivos de segurança, não
              podem redefinir senha por perguntas automáticas.
            </p>
            <p>
              Para redefinir seu acesso gestor, entre em contato com a equipe de desenvolvimento/administração do labMU
              pelo e-mail:{" "}
              <a
                href="mailto:musarq@unicap.br?subject=Solicita%C3%A7%C3%A3o%20de%20Redefini%C3%A7%C3%A3o%20de%20Senha%20Administrador%20labMU"
                className="font-bold underline text-[#8B1329]"
              >
                musarq@unicap.br
              </a>
            </p>
          </div>
        )}

        {/* Mensagem de Erro Geral */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-[10px] text-sm bg-[#fff1f3] border border-[#f6c4cb] text-[#c0182f]"
          >
            {error}
          </div>
        )}

        {/* ETAPA 1: E-mail */}
        {step === "EMAIL" && (
          <form onSubmit={handleVerifyEmail} className="space-y-4" noValidate>
            <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="forgot-email">
              E-mail Institucional do Técnico
              <div className="relative mt-2">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#4a4244]" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tecnico.musarq@unicap.br"
                  className={inputClass}
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#8B1329] text-white font-semibold rounded-[10px] shadow-[0_6px_14px_rgba(139,19,41,0.28)] hover:bg-[#6b0f1f] transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando e-mail..." : "Continuar"}
            </button>
          </form>
        )}

        {/* ETAPA 2: Pergunta Secreta */}
        {step === "QUESTION" && (
          <form onSubmit={handleVerifyAnswer} className="space-y-4" noValidate>
            <div className="rounded-[10px] border border-[#efe6e6] bg-[#fff9f6] p-3 text-xs text-[#7a6e70]">
              <span className="font-semibold text-[#1f1a1b]">Técnico:</span> {email}
            </div>

            <div className="p-3.5 bg-[#fef8f8] rounded-[10px] border border-[#f3d9dc]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B1329] mb-1">
                <HelpCircle className="h-4 w-4" />
                Pergunta de Segurança Cadastrada:
              </div>
              <p className="text-sm font-semibold text-[#1f1a1b]">{question}</p>
            </div>

            <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="forgot-answer">
              Sua Resposta
              <div className="relative mt-2">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#4a4244]" />
                <input
                  id="forgot-answer"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Digite a resposta correta"
                  className={inputClass}
                  autoFocus
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#8B1329] text-white font-semibold rounded-[10px] shadow-[0_6px_14px_rgba(139,19,41,0.28)] hover:bg-[#6b0f1f] transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Validando resposta..." : "Confirmar Resposta"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("EMAIL");
                setAnswer("");
                setError(null);
              }}
              className="w-full text-center text-xs text-[#7a6e70] hover:underline pt-1"
            >
              Utilizar outro e-mail
            </button>
          </form>
        )}

        {/* ETAPA 3: Nova Senha */}
        {step === "NEW_PASSWORD" && (
          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            <div className="rounded-[10px] border border-[#bfe5cd] bg-[#effaf3] p-3 text-xs text-[#1b7a43] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Identidade validada com sucesso! Defina sua nova senha.
            </div>

            <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="new-password">
              Nova Senha
              <div className="relative mt-2">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#4a4244]" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres (letras e números)"
                  className={`${inputClass} pr-12`}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-[#4a4244]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block text-xs font-semibold text-[#7a6e70]" htmlFor="confirm-new-password">
              Confirmar Nova Senha
              <div className="relative mt-2">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#4a4244]" />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={`${inputClass} pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-[#4a4244]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#8B1329] text-white font-semibold rounded-[10px] shadow-[0_6px_14px_rgba(139,19,41,0.28)] hover:bg-[#6b0f1f] transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Redefinindo senha..." : "Salvar Nova Senha"}
            </button>
          </form>
        )}

        {/* SUCESSO */}
        {step === "SUCCESS" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-[#effaf3] text-[#1b7a43] rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-[#1f1a1b]">Senha Redefinida!</h2>
            <p className="text-xs text-[#7a6e70] leading-relaxed">
              Sua senha de Técnico foi atualizada com sucesso. Agora você já pode acessar o sistema com as novas
              credenciais.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true, state: { registeredEmail: email } })}
              className="w-full h-12 bg-[#8B1329] text-white font-semibold rounded-[10px] shadow-[0_6px_14px_rgba(139,19,41,0.28)] hover:bg-[#6b0f1f] transition-colors flex items-center justify-center"
            >
              Ir para o Login
            </button>
          </div>
        )}
      </div>

      <footer className="mt-6 text-xs text-[#a58f93] text-center">
        MUSARQ • Universidade Católica de Pernambuco
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;

