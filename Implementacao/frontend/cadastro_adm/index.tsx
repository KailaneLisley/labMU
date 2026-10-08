import { FormEvent, useState } from "react";
import icon from "./icon.svg";
import icon2 from "./icon-2.svg";
import icon3 from "./icon-3.svg";
import icon4 from "./icon-4.svg";
import icon5 from "./icon-5.svg";
import icon6 from "./icon-6.svg";
import icon7 from "./icon-7.svg";
import icon8 from "./icon-8.svg";
import icon9 from "./icon-9.svg";
import image from "./image.svg";
import termsAndBiosafetyBox from "./terms-and-biosafety-box.svg";

type FieldConfig = {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "password";
  icon: string;
  iconClassName: string;
  wide?: boolean;
  toggle?: boolean;
};

const fields: FieldConfig[] = [
  {
    id: "fullName",
    label: "Nome Completo",
    placeholder: "Ex.: Profa. Dra. Mariana Cavalcanti",
    type: "text",
    icon,
    iconClassName: "absolute top-4 left-4 w-[17px] h-[17px]",
    wide: true,
  },
  {
    id: "email",
    label: "E-mail Institucional",
    placeholder: "mariana.cavalcanti@unicap.br",
    type: "email",
    icon: image,
    iconClassName: "absolute top-4 left-4 w-[17px] h-[17px]",
  },
  {
    id: "registration",
    label: "Matrícula Institucional / RA",
    placeholder: "Ex.: 00000123456",
    type: "text",
    icon: icon2,
    iconClassName: "absolute top-[15px] left-4 w-[15px] h-[17px]",
  },
  {
    id: "password",
    label: "Senha de Acesso",
    placeholder: "Mínimo 8 caracteres",
    type: "password",
    icon: icon3,
    iconClassName: "absolute top-[15px] left-[17px] w-[13px] h-[18px]",
    toggle: true,
  },
  {
    id: "confirmPassword",
    label: "Confirmar Senha",
    placeholder: "Repita sua senha",
    type: "password",
    icon: icon5,
    iconClassName: "absolute top-[15px] left-[17px] w-4 h-[18px]",
    toggle: true,
  },
];

const rowGroups = [
  fields.filter((field) => field.wide),
  fields.filter((field) => !field.wide).slice(0, 2),
  fields.filter((field) => !field.wide).slice(2, 4),
];

export const LabmuCadastroDe = (): JSX.Element => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateValue = (id: string, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [id]: value,
    }));
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((currentVisibility) => ({
      ...currentVisibility,
      [id]: !currentVisibility[id],
    }));
  };

  const clearFields = () => {
    setValues({});
    setAcceptedTerms(false);
    setSubmitted(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  const renderField = (field: FieldConfig) => {
    const isPassword = field.type === "password";
    const inputType =
      isPassword && visiblePasswords[field.id] ? "text" : field.type;

    return (
      <div
        key={field.id}
        className="flex flex-col items-start gap-1.5 relative flex-1 grow"
      >
        <label
          htmlFor={field.id}
          className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]"
        >
          <span className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-medium text-[#1d1b1b] text-xs tracking-[0.36px] leading-4">
            {field.label}
          </span>
        </label>
        <div className="flex items-center justify-center relative self-stretch w-full flex-[0_0_auto]">
          <div
            className={`flex flex-col h-12 items-start ${
              isPassword ? "pl-11 pr-10" : "pl-11 pr-4"
            } py-[15.5px] relative flex-1 grow bg-[#f8f2f2] rounded-xl overflow-hidden`}
          >
            <input
              id={field.id}
              name={field.id}
              type={inputType}
              value={values[field.id] || ""}
              onChange={(event) => updateValue(field.id, event.target.value)}
              placeholder={field.placeholder}
              required
              minLength={isPassword ? 8 : undefined}
              autoComplete={
                field.id === "email"
                  ? "email"
                  : field.id === "password"
                    ? "new-password"
                    : field.id === "confirmPassword"
                      ? "new-password"
                      : "off"
              }
              className="relative self-stretch w-full border-[none] [background:none] mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#584142] text-sm tracking-[0.07px] leading-[normal] p-0 placeholder:text-[#8b7171]"
            />
          </div>
          <img
            className={field.iconClassName}
            alt=""
            aria-hidden="true"
            src={field.icon}
          />
          {field.toggle && (
            <button
              type="button"
              aria-label={
                visiblePasswords[field.id]
                  ? `Ocultar ${field.label}`
                  : `Mostrar ${field.label}`
              }
              onClick={() => togglePasswordVisibility(field.id)}
              className="inline-flex items-center p-1 absolute top-[11px] right-3"
            >
              <img
                className="relative w-[16.5px] h-[14.85px]"
                alt=""
                aria-hidden="true"
                src={field.id === "password" ? icon4 : icon6}
              />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-col h-[978px] items-start justify-around relative bg-[linear-gradient(0deg,rgba(254,248,247,1)_0%,rgba(254,248,247,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] overflow-y-scroll">
      <div className="flex flex-col max-w-[1440px] items-start px-6 py-[50px] relative w-full flex-[0_0_auto] bg-[#fef8f7]">
        <section className="flex flex-col items-center justify-center p-6 relative self-stretch w-full flex-[0_0_auto] overflow-hidden">
          <div className="flex flex-col max-w-2xl w-[672px] h-[836px] items-center justify-center gap-[35px] px-0 py-4 relative z-[2]">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col max-w-2xl h-[762px] items-center gap-8 pt-12 pb-0 px-12 relative w-full mt-[-5.50px] bg-white rounded-2xl"
            >
              <div className="absolute w-full h-full top-0 left-0 bg-[#ffffff01] rounded-2xl shadow-[0px_4px_20px_-2px_#1c1a1a08,0px_20px_50px_-15px_#1c1a1a0f]" />
              <div className="inline-flex items-center justify-center relative flex-[0_0_auto]">
                <div
                  role="img"
                  aria-label="labMU MUSARQ UNICAP"
                  className="relative max-w-48 w-[138px] max-h-[66.78px] h-12 aspect-[2.88] bg-[url(/labmu-MUSARQ-UNICAP.png)] bg-cover bg-[50%_50%]"
                />
              </div>
              <header className="flex flex-col items-center justify-center relative self-stretch w-full flex-[0_0_auto]">
                <div className="pt-0 pb-3 px-0 inline-flex flex-col items-start relative flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 flex-[0_0_auto] bg-[#f8f2f2] relative rounded-full">
                    <div className="w-1.5 h-1.5 bg-[#8b142a] relative rounded-full" />
                    <span className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#584142] text-[11px] text-center tracking-[0.55px] leading-[14px] whitespace-nowrap">
                      MUSARQ • UNICAP
                    </span>
                    <span className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#8b7171] text-[11px] text-center tracking-[0.55px] leading-[14px]">
                      •
                    </span>
                    <span className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#670018] text-[11px] text-center tracking-[0.55px] leading-[14px] whitespace-nowrap">
                      ACESSO ADMINISTRATIVO
                    </span>
                  </div>
                </div>
                <h1 className="relative flex items-center justify-center w-fit [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#8b142a] text-[32px] text-center tracking-[-0.64px] leading-10 whitespace-nowrap">
                  Cadastro de Administrador
                </h1>
                <p className="max-w-md pt-2 [font-family:'Inter-Regular',Helvetica] font-normal text-[#584142] text-sm text-center tracking-[0.07px] leading-[22px]">
                  Acesso para coordenação e gestão do labMU MUSARQ.
                </p>
              </header>
              <div className="relative self-stretch w-full h-[463px]">
                <div className="flex flex-col w-full items-start gap-4 absolute top-0 left-0">
                  {rowGroups.map((group, groupIndex) => (
                    <div
                      key={`field-row-${groupIndex}`}
                      className={
                        group.length === 1
                          ? "flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]"
                          : "flex items-start justify-center gap-4 relative self-stretch w-full flex-[0_0_auto]"
                      }
                    >
                      {group.map(renderField)}
                    </div>
                  ))}
                </div>
                <div className="absolute w-full top-[266px] left-0 h-[93px]">
                  <img
                    className="absolute inset-0 w-full h-full object-cover"
                    alt=""
                    aria-hidden="true"
                    src={termsAndBiosafetyBox}
                  />
                  <label className="absolute inset-0 flex items-start gap-2 px-3 py-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) =>
                        setAcceptedTerms(event.target.checked)
                      }
                      className="mt-1 w-4 h-4 shrink-0 appearance-none rounded border border-[#e7b7bd] bg-white checked:bg-[#8b142a] checked:border-[#8b142a]"
                      aria-label="Aceito os termos de biossegurança"
                    />
                    <span className="sr-only">
                      Declaro estar ciente e de acordo com as normas de
                      biossegurança, uso de EPIs obrigatórios e regulamento de
                      atendimento de máquinas e corte a laser do MUSARQ UNICAP.
                    </span>
                  </label>
                </div>
                <div className="flex flex-col w-full items-start gap-3 pt-1 pb-0 px-0 absolute top-[383px] left-0">
                  <button
                    type="submit"
                    className="all-unset box-border flex h-12 justify-center gap-2 self-stretch w-full bg-[#8b142a] rounded-xl shadow-[0px_8px_20px_#8b142a38] items-center relative"
                  >
                    <span className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-white text-sm text-center tracking-[0.14px] leading-5 whitespace-nowrap">
                      Finalizar Cadastro de Administrador
                    </span>
                    <img
                      className="relative w-3 h-3"
                      alt=""
                      aria-hidden="true"
                      src={icon7}
                    />
                  </button>
                  {submitted && !acceptedTerms && (
                    <p className="absolute top-[55px] left-0 text-xs text-[#8b142a]">
                      Aceite os termos para finalizar o cadastro.
                    </p>
                  )}
                  <div className="flex items-center justify-between px-1 py-0 relative self-stretch w-full flex-[0_0_auto]">
                    <button
                      type="button"
                      onClick={clearFields}
                      className="all-unset box-border inline-flex gap-1 flex-[0_0_auto] items-center relative"
                    >
                      <img
                        className="relative w-[10.67px] h-[12.3px]"
                        alt=""
                        aria-hidden="true"
                        src={icon8}
                      />
                      <span className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#8b7171] text-[11px] text-center tracking-[0.55px] leading-[14px] whitespace-nowrap">
                        Limpar campos
                      </span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 relative flex-[0_0_auto]"
                    >
                      <span className="[font-family:'Inter-Bold',Helvetica] font-bold text-[#670018] text-xs tracking-[0.36px] leading-4 whitespace-nowrap">
                        Já possui acesso? Entrar
                      </span>
                      <img
                        className="relative w-[4.93px] h-2"
                        alt=""
                        aria-hidden="true"
                        src={icon9}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <p className="relative flex items-center justify-center w-72 mb-[-4.50px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#8b7171cc] text-xs text-center tracking-[0.12px] leading-[18px]">
              MUSARQ • Universidade Católica de Pernambuco
            </p>
          </div>
          <div className="absolute -right-32 -bottom-32 w-96 h-96 z-[1] bg-[#ffddb740] rounded-full blur-[32px]" />
          <div className="absolute -top-32 -left-32 w-96 h-96 z-0 bg-[#ffdada33] rounded-full blur-[32px]" />
        </section>
      </div>
    </main>
  );
};

export default LabmuCadastroDe;
