(() => {
  "use strict";

  /* ==========================================================
     CONFIGURAÇÃO
     - USE_MOCK = true  → autentica com usuários de teste locais
     - USE_MOCK = false → envia para a API real (API_URL)
     - AUTO_REDIRECT = false → ao abrir o login, a sessão anterior
       é encerrada (ideal para testar vários perfis em sequência)
     - AUTO_REDIRECT = true  → se já houver sessão, vai direto
       para o painel do perfil logado
     ========================================================== */
  const CONFIG = {
    USE_MOCK: false,
    AUTO_REDIRECT: false,
    API_URL: "http://localhost:3001/api/auth/login",
    EMAIL_DOMAIN: "@unicap.br",
    MIN_PASSWORD_LENGTH: 6,
    ROUTES: {
      administrador: "dashboard-admin.html",
      tecnico: "dashboard-tecnico.html",
    },
  };

  // Usuários de teste (APENAS para desenvolvimento; remover ao integrar o back-end)
  const MOCK_USERS = [
    { email: "admin.musarq@unicap.br", password: "Admin@123", role: "administrador", name: "Administrador MUSARQ" },
    { email: "tecnico.musarq@unicap.br", password: "Tecnico@123", role: "tecnico", name: "Técnico MUSARQ" },
  ];

  const STORAGE = {
    REMEMBER: "labmu:remember",
    SESSION: "labmu:session",
  };

  /* ---------- Elementos ---------- */
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberInput = document.getElementById("remember");
  const roleInputs = form.querySelectorAll('input[name="role"]');
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const formAlert = document.getElementById("form-alert");
  const submitBtn = document.getElementById("submit-btn");
  const btnIcon = submitBtn.querySelector(".btn__icon");
  const btnLabel = submitBtn.querySelector(".btn__label");
  const btnSpinner = submitBtn.querySelector(".btn__spinner");
  const toggleBtn = document.getElementById("toggle-password");
  const iconEye = document.getElementById("icon-eye");
  const iconEyeOff = document.getElementById("icon-eye-off");

  /* ---------- Utilidades ---------- */
  const getRole = () => form.querySelector('input[name="role"]:checked').value;

  const setRole = (role) => {
    roleInputs.forEach((input) => {
      input.checked = input.value === role;
    });
    updatePlaceholder();
  };

  // Ajusta o exemplo do placeholder conforme o perfil selecionado
  function updatePlaceholder() {
    emailInput.placeholder =
      getRole() === "administrador" ? "admin.musarq@unicap.br" : "tecnico.musarq@unicap.br";
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function showAlert(message, type = "error") {
    formAlert.textContent = message;
    formAlert.className = `alert alert--${type}`;
    formAlert.hidden = false;
  }

  function clearAlert() {
    formAlert.hidden = true;
    formAlert.textContent = "";
  }

  function setFieldError(input, errorEl, message) {
    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", errorEl.id);
    } else {
      errorEl.hidden = true;
      errorEl.textContent = "";
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnSpinner.hidden = !isLoading;
    btnIcon.hidden = isLoading;
    btnLabel.textContent = isLoading ? "Entrando..." : "Entrar no Sistema";
  }

  /* ---------- Sessão ---------- */
  function readSession() {
    const raw = localStorage.getItem(STORAGE.SESSION) || sessionStorage.getItem(STORAGE.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE.SESSION);
    sessionStorage.removeItem(STORAGE.SESSION);
  }

  function saveSession(data, persist) {
    clearSession();
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem(STORAGE.SESSION, JSON.stringify(data));
  }

  function saveRememberedData(email, role, remember) {
    if (remember) {
      localStorage.setItem(STORAGE.REMEMBER, JSON.stringify({ email, role }));
    } else {
      localStorage.removeItem(STORAGE.REMEMBER);
    }
  }

  /* ---------- Validação ---------- */
  function validateEmail() {
    const value = emailInput.value.trim().toLowerCase();
    if (!value) {
      setFieldError(emailInput, emailError, "Informe seu e-mail institucional.");
      return false;
    }
    const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicPattern.test(value)) {
      setFieldError(emailInput, emailError, "Digite um e-mail válido.");
      return false;
    }
    if (!value.endsWith(CONFIG.EMAIL_DOMAIN)) {
      setFieldError(emailInput, emailError, `Use seu e-mail institucional (${CONFIG.EMAIL_DOMAIN}).`);
      return false;
    }
    setFieldError(emailInput, emailError, "");
    return true;
  }

  function validatePassword() {
    const value = passwordInput.value;
    if (!value) {
      setFieldError(passwordInput, passwordError, "Informe sua senha.");
      return false;
    }
    if (value.length < CONFIG.MIN_PASSWORD_LENGTH) {
      setFieldError(
        passwordInput,
        passwordError,
        `A senha deve ter ao menos ${CONFIG.MIN_PASSWORD_LENGTH} caracteres.`
      );
      return false;
    }
    setFieldError(passwordInput, passwordError, "");
    return true;
  }

  /* ---------- Autenticação ---------- */
  async function authenticate({ email, password, role }) {
    if (CONFIG.USE_MOCK) {
      await sleep(900); // simula latência de rede
      const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
      if (!user) {
        throw new Error("E-mail ou senha incorretos.");
      }
      if (user.role !== role) {
        throw new Error(
          `Este usuário não possui o perfil de ${role === "administrador" ? "Administrador" : "Técnico"}.`
        );
      }
      return { token: "mock-token", user: { name: user.name, email: user.email, role: user.role } };
    }

    // Integração real com o back-end
    let response;
    try {
      response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
    } catch {
      throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
    }

    if (!response.ok) {
      let data = await response.json().catch(() => null);
      let message = data?.error?.message || "Não foi possível realizar o login.";
      if (!data?.error?.message) {
        if (response.status === 401) message = "E-mail ou senha incorretos.";
        if (response.status === 403) message = "Seu perfil não tem permissão de acesso.";
      }
      throw new Error(message);
    }
    return response.json(); // esperado: { token, user: { name, email, role } }
  }

  /* ---------- Eventos ---------- */
  toggleBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    iconEye.hidden = isHidden;
    iconEyeOff.hidden = !isHidden;
    toggleBtn.setAttribute("aria-pressed", String(isHidden));
    toggleBtn.setAttribute("aria-label", isHidden ? "Ocultar senha" : "Mostrar senha");
    passwordInput.focus();
  });

  roleInputs.forEach((input) =>
    input.addEventListener("change", () => {
      updatePlaceholder();
      clearAlert();
    })
  );

  emailInput.addEventListener("blur", () => emailInput.value && validateEmail());
  emailInput.addEventListener("input", () => emailInput.hasAttribute("aria-invalid") && validateEmail());
  passwordInput.addEventListener("input", () => passwordInput.hasAttribute("aria-invalid") && validatePassword());

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert();

    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk) return emailInput.focus();
    if (!passwordOk) return passwordInput.focus();

    const payload = {
      email: emailInput.value.trim().toLowerCase(),
      password: passwordInput.value,
      role: getRole(),
    };

    setLoading(true);
    try {
      const data = await authenticate(payload);
      saveSession(data, rememberInput.checked);
      saveRememberedData(payload.email, payload.role, rememberInput.checked);

      showAlert("Login realizado com sucesso! Redirecionando...", "success");
      await sleep(600);
      window.location.href = CONFIG.ROUTES[data.user.role] || CONFIG.ROUTES[payload.role];
    } catch (error) {
      showAlert(error.message || "Erro inesperado. Tente novamente.");
      passwordInput.value = "";
      passwordInput.focus();
      setLoading(false);
    }
  });

  /* ---------- Inicialização ---------- */
  function init() {
    const params = new URLSearchParams(window.location.search);
    const forceLogout = params.has("logout");

    // Logout explícito (?logout=1) ou modo de teste (AUTO_REDIRECT desligado):
    // encerra qualquer sessão anterior e mostra a tela de login normalmente.
    if (forceLogout || !CONFIG.AUTO_REDIRECT) {
      clearSession();
      if (forceLogout) {
        // Limpa o parâmetro da URL sem recarregar a página
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else {
      // Se já existe sessão ativa, vai direto para o painel do perfil logado
      const session = readSession();
      if (session && session.user && CONFIG.ROUTES[session.user.role]) {
        window.location.replace(CONFIG.ROUTES[session.user.role]);
        return;
      }
    }

    // Restaura e-mail e perfil lembrados (somente se "Lembrar de mim" foi marcado)
    const rawRemember = localStorage.getItem(STORAGE.REMEMBER);
    if (rawRemember) {
      try {
        const { email, role } = JSON.parse(rawRemember);
        if (email) emailInput.value = email;
        if (role) setRole(role);
        rememberInput.checked = true;
      } catch {
        localStorage.removeItem(STORAGE.REMEMBER);
      }
    }
    updatePlaceholder();
  }

  init();
})();