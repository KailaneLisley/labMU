import { FormEvent, useState } from "react";
import backgroundBlur from "./background-blur.svg";
import icon from "./icon.svg";
import icon2 from "./icon-2.svg";
import icon3 from "./icon-3.svg";
import icon4 from "./icon-4.svg";
import image from "./image.svg";
import input from "./input.svg";

type UserRole = "tecnico" | "administrador";

export const LabmuAutenticao = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("administrador");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex h-[762px] items-center justify-center px-0 py-[31.92px] relative bg-[linear-gradient(0deg,rgba(254,248,247,1)_0%,rgba(254,248,247,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] w-full min-w-[1280px]">
      <div className="flex flex-col items-start relative flex-1 grow mt-[-35.50px] mb-[-35.50px]">
        <section
          aria-label="Autenticação labMU"
          className="flex flex-col min-h-[734.16px] items-center justify-center px-8 py-[39.58px] relative self-stretch w-full flex-[0_0_auto] overflow-hidden"
        >
          <div className="absolute w-full h-full top-0 left-0 [background:radial-gradient(50%_50%_at_50%_50%,rgba(223,191,191,1)_6%,rgba(223,191,191,0)_6%)] opacity-40" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffdada] rounded-full blur-[32px] opacity-30" />
          <img
            className="absolute right-0 bottom-0 w-80 h-[329px]"
            alt=""
            aria-hidden="true"
            src={backgroundBlur}
          />
          <div className="flex flex-col max-w-[520px] w-[520px] items-center relative flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-6 p-12 relative self-stretch w-full flex-[0_0_auto] bg-white rounded-2xl">
              <div className="absolute w-full h-full top-0 left-0 bg-[#ffffff01] rounded-2xl shadow-[0px_8px_10px_-6px_#e7e1e166,0px_20px_25px_-5px_#e7e1e166]" />
              <header className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex flex-col items-start pt-0 pb-6 px-0 relative flex-[0_0_auto]">
                  <div className="inline-flex items-center justify-center relative flex-[0_0_auto]">
                    <div
                      className="relative max-w-48 w-[138px] max-h-[66.78px] h-12 aspect-[2.88] bg-[url(/labmu-MUSARQ-UNICAP.png)] bg-cover bg-[50%_50%]"
                      role="img"
                      aria-label="labMU MUSARQ Universidade Católica de Pernambuco"
                    />
                  </div>
                </div>
                <h1 className="relative flex items-center justify-center w-fit [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#8b142a] text-2xl text-center tracking-[-0.60px] leading-8 whitespace-nowrap">
                  Entrar no labMU
                </h1>
                <div className="pt-1.5 pb-0 px-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
                  <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                    <p className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#584142] text-xs text-center tracking-[0.12px] leading-[18px] whitespace-nowrap">
                      Credenciais institucionais UNICAP
                    </p>
                  </div>
                </div>
              </header>
              <form
                className="relative self-stretch w-full h-[306px]"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="flex flex-col w-full items-start gap-1.5 absolute top-2 left-0">
                  <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                    <label
                      htmlFor="institutional-email"
                      className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#1d1b1b] text-xs tracking-[0.36px] leading-4"
                    >
                      E-mail Institucional
                    </label>
                  </div>
                  <div className="flex items-center justify-center relative self-stretch w-full flex-[0_0_auto]">
                    <img
                      className="relative flex-1 grow object-cover"
                      alt=""
                      aria-hidden="true"
                      src={input}
                    />
                    <img
                      className="absolute top-[15px] left-4 w-[17px] h-[17px]"
                      alt=""
                      aria-hidden="true"
                      src={icon}
                    />
                    <input
                      id="institutional-email"
                      name="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="absolute left-11 right-4 top-0 h-full border-[none] [background:none] [font-family:'Inter-Regular',Helvetica] font-normal text-[#8b7171b2] text-sm tracking-[0.07px] leading-[normal] p-0"
                      placeholder="tecnico.musarq@unicap.br"
                      type="email"
                      autoComplete="username"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>
                <div className="flex flex-col w-full items-start gap-1.5 absolute top-24 left-0">
                  <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                    <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                      <label
                        htmlFor="institutional-password"
                        className="text-[#1d1b1b] text-xs tracking-[0.36px] leading-4 relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal whitespace-nowrap"
                      >
                        Chave de Segurança / Senha
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-[#670018] text-xs tracking-[0.12px] leading-[18px] relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal whitespace-nowrap"
                      onClick={() => setSubmitted(false)}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="flex items-center justify-center relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-start pt-3.5 pb-[15px] px-11 relative flex-1 grow bg-[#f8f2f2] rounded-xl overflow-hidden">
                      <input
                        id="institutional-password"
                        name="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="relative self-stretch w-full border-[none] [background:none] mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#8b7171b2] text-sm tracking-[0.07px] leading-[normal] p-0"
                        placeholder="••••••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        aria-required="true"
                      />
                    </div>
                    <img
                      className="absolute top-3.5 left-[17px] w-[13px] h-[18px]"
                      alt=""
                      aria-hidden="true"
                      src={image}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-0.5 absolute top-[11px] right-3.5"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      aria-pressed={showPassword}
                    >
                      <span className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                        <img
                          className="relative w-[18.33px] h-[12.5px]"
                          alt=""
                          aria-hidden="true"
                          src={icon2}
                        />
                      </span>
                    </button>
                  </div>
                </div>
                <fieldset className="flex w-full h-12 items-center justify-center gap-2 px-2 py-1 absolute top-[186px] left-0 bg-[#f8f2f2] rounded-xl">
                  <legend className="sr-only">Tipo de usuário</legend>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 relative flex-1 grow rounded-lg cursor-pointer">
                    <input
                      className="sr-only"
                      type="radio"
                      name="role"
                      value="tecnico"
                      checked={role === "tecnico"}
                      onChange={() => setRole("tecnico")}
                    />
                    <span
                      className={`relative w-3.5 h-3.5 bg-white rounded-[50px] border border-solid ${
                        role === "tecnico"
                          ? "border-[#8b142a]"
                          : "border-[#767676]"
                      }`}
                    >
                      {role === "tecnico" && (
                        <span className="absolute left-[2.1px] top-[2.1px] w-[8.4px] h-[8.4px] bg-[#8b142a] rounded-[50px]" />
                      )}
                    </span>
                    <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#1d1b1b] text-xs text-center tracking-[0.36px] leading-4 whitespace-nowrap">
                      Técnico
                    </span>
                  </label>
                  <label className="flex w-[204px] items-center justify-center gap-2 px-3 py-2 relative bg-white rounded-lg shadow-[0px_1px_2px_#0000000d] cursor-pointer">
                    <input
                      className="sr-only"
                      type="radio"
                      name="role"
                      value="administrador"
                      checked={role === "administrador"}
                      onChange={() => setRole("administrador")}
                    />
                    <span className="flex flex-col w-3.5 h-3.5 items-center justify-center relative bg-white rounded-[50px] border border-solid border-[#8b142a]">
                      {role === "administrador" && (
                        <span className="relative w-[8.4px] h-[8.4px] bg-[#8b142a] rounded-[50px]" />
                      )}
                    </span>
                    <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#1d1b1b] text-xs text-center tracking-[0.36px] leading-4 whitespace-nowrap">
                      Administrador
                    </span>
                  </label>
                </fieldset>
                <div className="flex flex-col w-[424px] items-center absolute top-60 -left-1">
                  <p className="relative flex items-center justify-center w-[358px] mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#8b7171] text-xs text-center tracking-[0.12px] leading-[18px]">
                    Acesso exclusivo a técnicos e administradores credenciados.
                  </p>
                </div>
                <button
                  type="submit"
                  className="all-unset box-border flex w-full items-center justify-center gap-2 px-6 py-3.5 absolute top-[268px] left-0 bg-[#8b142a] rounded-xl"
                >
                  <span className="absolute w-full h-full top-0 left-0 bg-[#ffffff01] rounded-xl shadow-[0px_2px_4px_-2px_#8b142a40,0px_4px_6px_-1px_#8b142a40]" />
                  <span className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                    <img
                      className="relative w-[15px] h-[15px]"
                      alt=""
                      aria-hidden="true"
                      src={icon3}
                    />
                  </span>
                  <span className="justify-center text-white text-sm text-center tracking-[0.35px] leading-5 relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal whitespace-nowrap">
                    Entrar no Sistema
                  </span>
                </button>
              </form>
              <label className="inline-flex items-center gap-2 relative flex-[0_0_auto] cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="sr-only"
                />
                <span className="relative w-4 h-4 bg-[#8b142a] rounded-[2.5px]">
                  {rememberMe && (
                    <span className="absolute left-[4px] top-[1px] h-[9px] w-[5px] rotate-45 border-b-2 border-r-2 border-white" />
                  )}
                </span>
                <span className="text-[#584142] text-[13px] tracking-[0.07px] leading-[22px] relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal whitespace-nowrap">
                  Lembrar de mim
                </span>
              </label>
              <div className="flex flex-col h-6 items-center justify-center pt-4 pb-0 px-0 relative self-stretch w-full border-t [border-top-style:solid] border-[#ede7e699]">
                <div className="relative self-stretch w-full h-8 mt-[-11.50px] mb-[-12.50px]">
                  <p className="absolute top-4 left-[calc(50.00%_-_197px)] h-[22px] flex items-center justify-center [font-family:'Inter-Regular',Helvetica] font-normal text-[#584142] text-sm text-center tracking-[0.07px] leading-[22px] whitespace-nowrap">
                    Primeiro acesso como gestor?
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-[1.99px] absolute top-5 left-[223px]"
                  >
                    <span className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                      <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#670018] text-xs text-center tracking-[0.36px] leading-4 whitespace-nowrap">
                        Criar conta de Administrador
                      </span>
                    </span>
                    <span className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                      <img
                        className="relative w-[4.93px] h-2"
                        alt=""
                        aria-hidden="true"
                        src={icon4}
                      />
                    </span>
                  </button>
                </div>
              </div>
              {submitted && (
                <p className="sr-only" role="status">
                  Formulário enviado.
                </p>
              )}
            </div>
            <footer className="pt-6 pb-0 px-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
              <p className="justify-center text-[#8b7171cc] text-xs text-center tracking-[0.12px] leading-[18px] relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal whitespace-nowrap">
                MUSARQ • Universidade Católica de Pernambuco
              </p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
};