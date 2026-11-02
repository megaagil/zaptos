import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { maskPhone } from "@/lib/zaptos/format";
import {
  cadastrar,
  celularValido,
  concluirSso,
  confirmarToken,
  contaPorEmail,
  contasDemonstracao,
  contaAtual,
  emailDaConta,
  emailValido,
  entrarComSenha,
  enviarToken,
  mensagemCelular,
  mensagemEmail,
  redefinirSenha,
  senhaForte,
  type Sessao,
} from "@/lib/zaptos/conta";
import { Btn, Field, fieldClass } from "../ui";
import { CampoValidado, ListaSenha, ProvedorIcone, type Provedor } from "./campos";

type Passo = "entrar" | "esqueci" | "nova" | "cadastro" | "sso" | "token";
type OrigemToken = "cadastro" | "sso";

const PROVEDORES: { id: Provedor; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "microsoft", label: "Microsoft" },
  { id: "icloud", label: "iCloud" },
];

export function Login({ onEntrou }: { onEntrou: (sessao: Sessao) => void }) {
  const conta = contaAtual();
  const demonstracao = contasDemonstracao();
  const [passo, setPasso] = useState<Passo>("entrar");
  const [origemToken, setOrigemToken] = useState<OrigemToken>("cadastro");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(conta.email);
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoDemo, setCodigoDemo] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [provedor, setProvedor] = useState<Provedor | null>(null);
  const [viaSso, setViaSso] = useState<Provedor>("google");
  const [tocouEmail, setTocouEmail] = useState(false);
  const [tocouTelefone, setTocouTelefone] = useState(false);
  const [tentouCadastro, setTentouCadastro] = useState(false);

  function limpar() {
    setErro("");
    setAviso("");
  }

  function entrar(e: FormEvent) {
    e.preventDefault();
    limpar();
    const resultado = entrarComSenha(email, senha);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    onEntrou(resultado.sessao);
  }

  function pedirSenha(e: FormEvent) {
    e.preventDefault();
    limpar();
    if (!email.includes("@") || email.trim().length < 5) {
      setErro("Informe o e-mail da conta.");
      return;
    }
    if (!emailDaConta(email)) {
      setErro("Não achamos esse e-mail na operação.");
      return;
    }
    setPasso("nova");
    setSenha("");
    setSenha2("");
  }

  function salvarSenha(e: FormEvent) {
    e.preventDefault();
    limpar();
    if (senha !== senha2) {
      setErro("As senhas não são iguais.");
      return;
    }
    if (!senhaForte(senha, email)) {
      setErro("A senha não atende aos critérios de segurança.");
      return;
    }
    const resultado = redefinirSenha(email, senha);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setSenha("");
    setSenha2("");
    setPasso("entrar");
    setAviso("Senha redefinida. Entre com a nova senha.");
  }

  function social(id: Provedor) {
    if (provedor) return;
    limpar();
    setProvedor(id);
    setViaSso(id);
    window.setTimeout(() => {
      setProvedor(null);
      setNome("");
      setEmail("");
      setTelefone("");
      setCodigo("");
      setPasso("sso");
    }, 700);
  }

  function pedirCodigo(origem: OrigemToken) {
    limpar();
    if (origem === "cadastro") {
      setTentouCadastro(true);
      const falhaEmail = mensagemEmail(email);
      const falhaCelular = mensagemCelular(telefone);
      if (nome.trim().length < 2) {
        setErro("Informe o nome de quem vai usar a conta.");
        return;
      }
      if (falhaEmail) {
        setErro(falhaEmail);
        return;
      }
      if (falhaCelular) {
        setErro(falhaCelular);
        return;
      }
      if (!senhaForte(senha, email)) {
        setErro("A senha não atende aos critérios de segurança.");
        return;
      }
      if (senha !== senha2) {
        setErro("As senhas não são iguais.");
        return;
      }
    } else if (!emailValido(email)) {
      setErro("Informe um e-mail válido.");
      return;
    } else if (!emailDaConta(email) && nome.trim().length < 2) {
      setErro("Informe o nome de quem vai usar a conta.");
      return;
    } else {
      const existente = contaPorEmail(email);
      if (existente && (!existente.telefoneVerificado || existente.telefone.replace(/\D/g, "") !== telefone.replace(/\D/g, ""))) {
        setErro("Este e-mail já possui conta. Entre com a senha ou use o celular cadastrado.");
        return;
      }
    }
    if (!celularValido(telefone)) {
      setErro(mensagemCelular(telefone) || "Informe um celular com DDD.");
      return;
    }
    const envio = enviarToken(telefone);
    if (!envio.ok) {
      setErro(envio.erro);
      return;
    }
    setOrigemToken(origem);
    setCodigo("");
    setCodigoDemo(envio.codigoDemo);
    setPasso("token");
  }

  function confirmar(e: FormEvent) {
    e.preventDefault();
    limpar();
    const conferido = confirmarToken(telefone, codigo);
    if (!conferido.ok) {
      setErro(conferido.erro);
      return;
    }
    const resultado =
      origemToken === "cadastro"
        ? cadastrar({ nome, email, telefone, senha })
        : concluirSso(viaSso, { nome, email, telefone });
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    onEntrou(resultado.sessao);
  }

  return (
    <main className="h-dvh overflow-y-auto bg-paper">
      <div className="mx-auto grid min-h-full max-w-5xl lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-ink px-10 py-12 text-paper lg:flex">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="size-14" />
            <p className="text-2xl font-extrabold tracking-tight">
              Zapt<span className="text-lime">OS</span>
            </p>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold leading-tight">Agenda e ordem de serviço no WhatsApp.</h1>
            <p className="mt-4 max-w-sm text-base text-lime-soft">
              Painel do dia, agenda, quadro de OS e a caixa de conversas.
            </p>
          </div>
          <p className="text-sm text-lime-soft">Um negócio. Uma equipe. O cliente responde no Zap.</p>
        </aside>

        <section className="flex flex-col justify-center px-5 py-8 sm:px-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="" className="size-12" />
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-ink">
                Zapt<span className="text-lime-deep">OS</span>
              </p>
              <p className="text-sm text-muted">Agenda e OS no WhatsApp</p>
            </div>
          </div>

          <div className="w-full max-w-md">
            {passo === "entrar" && (
              <>
                <h2 className="text-2xl font-extrabold text-ink">Iniciar Sessão</h2>
                <p className="mt-1 text-sm text-muted">Use a conta da equipe ou um acesso social.</p>

                <form className="mt-6 flex flex-col gap-3" onSubmit={entrar}>
                  <Field label="E-mail">
                    <input
                      className={fieldClass}
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Senha">
                    <span className="relative block">
                      <input
                        className={fieldClass + " pr-12"}
                        type={mostrar ? "text" : "password"}
                        autoComplete="current-password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted"
                        aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setMostrar((v) => !v)}
                      >
                        {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </span>
                  </Field>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm font-semibold text-lime-deep"
                      onClick={() => {
                        limpar();
                        setPasso("esqueci");
                      }}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
                  {aviso && <p className="text-sm font-semibold text-lime-deep">{aviso}</p>}
                  <Btn type="submit" className="w-full" disabled={provedor !== null}>
                    Entrar
                  </Btn>
                </form>
                {demonstracao.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1 text-xs text-muted">
                    {demonstracao.map((item) => (
                      <p key={item.email}>
                        Conta de demonstração: {item.email} · senha {item.senha}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="mt-4 text-sm font-semibold text-lime-deep"
                  onClick={() => {
                    limpar();
                    setNome("");
                    setEmail("");
                    setTelefone("");
                    setSenha("");
                    setSenha2("");
                    setTocouEmail(false);
                    setTocouTelefone(false);
                    setTentouCadastro(false);
                    setPasso("cadastro");
                  }}
                >
                  Criar conta
                </button>

                <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted">
                  <span className="h-px flex-1 bg-line" />
                  ou continue com
                  <span className="h-px flex-1 bg-line" />
                </div>

                <div className="flex flex-col gap-2">
                  {PROVEDORES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={provedor !== null}
                      onClick={() => social(item.id)}
                      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 text-sm font-semibold text-ink hover:bg-lime-soft disabled:opacity-60"
                    >
                      <ProvedorIcone id={item.id} />
                      {provedor === item.id ? `Conectando com ${item.label}…` : `Continuar com ${item.label}`}
                    </button>
                  ))}
                </div>
              </>
            )}

            {passo === "esqueci" && (
              <>
                <h2 className="text-2xl font-extrabold text-ink">Esqueci minha senha</h2>
                <p className="mt-1 text-sm text-muted">Informe o e-mail da equipe para definir uma senha nova.</p>
                <form className="mt-6 flex flex-col gap-3" onSubmit={pedirSenha}>
                  <Field label="E-mail">
                    <input
                      className={fieldClass}
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
                  <Btn type="submit" className="w-full">
                    Continuar
                  </Btn>
                  <Btn
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      limpar();
                      setPasso("entrar");
                    }}
                  >
                    Voltar ao login
                  </Btn>
                </form>
              </>
            )}

            {passo === "nova" && (
              <>
                <h2 className="text-2xl font-extrabold text-ink">Nova senha</h2>
                <p className="mt-1 text-sm text-muted">Vale para {email.trim()} neste navegador.</p>
                <form className="mt-6 flex flex-col gap-3" onSubmit={salvarSenha}>
                  <Field label="Senha nova">
                    <input
                      className={fieldClass}
                      type={mostrar ? "text" : "password"}
                      autoComplete="new-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Confirmar senha">
                    <input
                      className={fieldClass}
                      type={mostrar ? "text" : "password"}
                      autoComplete="new-password"
                      value={senha2}
                      onChange={(e) => setSenha2(e.target.value)}
                      required
                    />
                  </Field>
                  <ListaSenha senha={senha} email={email} />
                  <button
                    type="button"
                    className="self-start text-sm font-semibold text-muted"
                    onClick={() => setMostrar((v) => !v)}
                  >
                    {mostrar ? "Ocultar senhas" : "Mostrar senhas"}
                  </button>
                  {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
                  <Btn type="submit" className="w-full">
                    Redefinir senha
                  </Btn>
                  <Btn
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      limpar();
                      setPasso("entrar");
                    }}
                  >
                    Voltar ao login
                  </Btn>
                </form>
              </>
            )}

            {passo === "cadastro" && (
              <>
                <h2 className="text-2xl font-extrabold text-ink">Cadastro</h2>
                <p className="mt-1 text-sm text-muted">Cada conta abre uma operação vazia, só sua. O e-mail e o celular são conferidos antes de continuar.</p>
                <form
                  className="mt-6 flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    pedirCodigo("cadastro");
                  }}
                >
                  <Field label="Nome">
                    <input className={fieldClass} value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </Field>
                  <CampoValidado
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    value={email}
                    mostrar={tocouEmail || tentouCadastro}
                    mensagem={mensagemEmail(email)}
                    ok="E-mail disponível."
                    onChange={(valor) => setEmail(valor)}
                    onBlur={() => setTocouEmail(true)}
                  />
                  <CampoValidado
                    label="Celular"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="(11) 90000-0000"
                    value={telefone}
                    mostrar={tocouTelefone || tentouCadastro}
                    mensagem={mensagemCelular(telefone)}
                    ok="Celular válido."
                    onChange={(valor) => setTelefone(maskPhone(valor))}
                    onBlur={() => setTocouTelefone(true)}
                  />
                  <Field label="Senha">
                    <input
                      className={fieldClass}
                      type={mostrar ? "text" : "password"}
                      autoComplete="new-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                    />
                  </Field>
                  <ListaSenha senha={senha} email={email} />
                  <Field label="Confirmar senha">
                    <input
                      className={fieldClass}
                      type={mostrar ? "text" : "password"}
                      autoComplete="new-password"
                      value={senha2}
                      onChange={(e) => setSenha2(e.target.value)}
                      required
                    />
                  </Field>
                  {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
                  <Btn type="submit" className="w-full">
                    Enviar código
                  </Btn>
                  <Btn
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      limpar();
                      setPasso("entrar");
                    }}
                  >
                    Voltar ao login
                  </Btn>
                </form>
              </>
            )}

            {passo === "sso" && (
              <>
                <h2 className="text-2xl font-extrabold text-ink">Confirme seu celular</h2>
                <p className="mt-1 text-sm text-muted">
                  O acesso por {viaSso === "google" ? "Google" : viaSso === "microsoft" ? "Microsoft" : "iCloud"} só
                  entra depois do código no celular. Uma conta nova nasce vazia.
                </p>
                <form
                  className="mt-6 flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    pedirCodigo("sso");
                  }}
                >
                  <Field label="Nome">
                    <input className={fieldClass} value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </Field>
                  <Field label="E-mail">
                    <input
                      className={fieldClass}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Celular">
                    <input
                      className={fieldClass}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 90000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(maskPhone(e.target.value))}
                      required
                    />
                  </Field>
                  {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
                  <Btn type="submit" className="w-full">
                    Enviar código
                  </Btn>
                  <Btn
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      limpar();
                      setPasso("entrar");
                    }}
                  >
                    Voltar ao login
                  </Btn>
                </form>
              </>
            )}

            {passo === "token" && (
              <>
                <h2 className="text-2xl font-extrabold text-ink">Código do celular</h2>
                <p className="mt-1 text-sm text-muted">Enviamos um código de 6 dígitos para {telefone}. Ele vale por 5 minutos.</p>
                <form className="mt-6 flex flex-col gap-3" onSubmit={confirmar}>
                  <Field label="Código">
                    <input
                      className={fieldClass}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                    />
                  </Field>
                  <p className="rounded-xl bg-paper px-3 py-2 text-sm text-muted">
                    Demonstração: o SMS não sai para a operadora. Use o código{" "}
                    <span className="font-semibold text-ink">{codigoDemo}</span>.
                  </p>
                  {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
                  <Btn type="submit" className="w-full">
                    Confirmar celular
                  </Btn>
                  <Btn variant="ghost" className="w-full" onClick={() => pedirCodigo(origemToken)}>
                    Enviar outro código
                  </Btn>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

