const CHAVE = "zaptos-conta-v1";

export const CONTA_INICIAL = {
  nome: "Ana Ribeiro",
  email: "ana@lumeassistencia.com.br",
  senha: "lume1234",
};

export const CONTA_FACHINE = {
  nome: "Clínica Odontológica Fachine",
  email: "contato@clinicafachine.com.br",
  senha: "fachine123",
  segmento: "Odontologia",
};

const EXEMPLOS = [CONTA_INICIAL, CONTA_FACHINE];

export type Via = "senha" | "google" | "microsoft" | "icloud";

export type Sessao = {
  nome: string;
  email: string;
  via: Via;
};

type Conta = {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  telefoneVerificado: boolean;
};

type Gravado = {
  contas: Conta[];
  sessao: Sessao | null;
};

type TokenPendente = {
  telefone: string;
  codigo: string;
  expira: number;
};

const CHAVE_TOKEN = "zaptos-token";
const CHAVE_LIBERADO = "zaptos-telefone-ok";

function padrao(): Gravado {
  return { contas: EXEMPLOS.map(contaDe), sessao: null };
}

function contaDe(conta: { nome: string; email: string; senha: string }): Conta {
  return {
    nome: conta.nome,
    email: conta.email,
    senha: conta.senha,
    telefone: "",
    telefoneVerificado: true,
  };
}

function digitos(telefone: string) {
  return telefone.replace(/\D/g, "");
}

function juntarExemplos(contas: Conta[]) {
  const porEmail = new Map(contas.map((c) => [c.email.toLowerCase(), c]));
  for (const exemplo of EXEMPLOS) {
    if (!porEmail.has(exemplo.email.toLowerCase())) porEmail.set(exemplo.email.toLowerCase(), contaDe(exemplo));
  }
  return [...porEmail.values()];
}

function normalizarConta(conta: Partial<Conta>): Conta | null {
  if (!conta.email || !conta.senha || !conta.nome) return null;
  const exemplo = EXEMPLOS.some((item) => item.email.toLowerCase() === conta.email!.toLowerCase());
  return {
    nome: conta.nome,
    email: conta.email,
    senha: conta.senha,
    telefone: conta.telefone ?? "",
    telefoneVerificado: conta.telefoneVerificado ?? exemplo,
  };
}

function ler(): Gravado {
  if (typeof window === "undefined") return padrao();
  try {
    const cru = window.localStorage.getItem(CHAVE);
    if (!cru) return padrao();
    const dado = JSON.parse(cru) as Partial<Gravado> & Partial<Conta & { sessao: Sessao | null }>;
    if (Array.isArray(dado.contas)) {
      const contas = dado.contas.map((c) => normalizarConta(c)).filter((c): c is Conta => Boolean(c));
      return { contas: juntarExemplos(contas), sessao: dado.sessao ?? null };
    }
    if (dado.email && dado.senha && dado.nome) {
      const unica = normalizarConta(dado);
      return {
        contas: juntarExemplos(unica ? [unica] : []),
        sessao: dado.sessao ?? null,
      };
    }
    return padrao();
  } catch {
    return padrao();
  }
}

function gravar(dado: Gravado) {
  window.localStorage.setItem(CHAVE, JSON.stringify(dado));
}

function lerToken(): TokenPendente | null {
  if (typeof window === "undefined") return null;
  try {
    const cru = window.sessionStorage.getItem(CHAVE_TOKEN);
    if (!cru) return null;
    const dado = JSON.parse(cru) as TokenPendente;
    if (!dado.codigo || !dado.telefone || !dado.expira) return null;
    return dado;
  } catch {
    return null;
  }
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export function mensagemEmail(email: string) {
  const valor = email.trim();
  if (!valor) return "Informe o e-mail.";
  if (!emailValido(valor)) return "E-mail inválido. Use o formato nome@empresa.com.";
  if (emailDaConta(valor)) return "Este e-mail já está cadastrado.";
  return "";
}

export function celularValido(telefone: string) {
  const d = digitos(telefone);
  return d.length === 11 && d[2] === "9";
}

export function mensagemCelular(telefone: string) {
  const d = digitos(telefone);
  if (!d) return "Informe o celular com DDD.";
  if (d.length < 11) return "O celular precisa ter DDD e 9 dígitos.";
  if (d[2] !== "9") return "Celular inválido. Depois do DDD, o número começa com 9.";
  return "";
}

export function criteriosSenha(senha: string, email = "") {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  return [
    { id: "tamanho", texto: "No mínimo 8 caracteres", ok: senha.length >= 8 },
    { id: "maiuscula", texto: "Uma letra maiúscula", ok: /[A-Z]/.test(senha) },
    { id: "minuscula", texto: "Uma letra minúscula", ok: /[a-z]/.test(senha) },
    { id: "numero", texto: "Um número", ok: /\d/.test(senha) },
    { id: "especial", texto: "Um caractere especial", ok: /[^A-Za-z0-9]/.test(senha) },
    {
      id: "email",
      texto: "Não repete o e-mail",
      ok: senha.length > 0 && (!local || !senha.toLowerCase().includes(local)),
    },
  ];
}

export function senhaForte(senha: string, email = "") {
  return criteriosSenha(senha, email).every((item) => item.ok);
}

export function sessaoAtual(): Sessao | null {
  return ler().sessao;
}

export function contaAtual() {
  const dado = ler();
  return dado.contas[0] ?? contaDe(CONTA_INICIAL);
}

export function contasDemonstracao() {
  const salvas = ler().contas;
  return EXEMPLOS.filter((exemplo) => {
    const salva = salvas.find((c) => c.email.toLowerCase() === exemplo.email.toLowerCase());
    return !salva || salva.senha === exemplo.senha;
  }).map(contaDe);
}

export function contaPorEmail(email: string) {
  const informado = email.trim().toLowerCase();
  const conta = ler().contas.find((c) => c.email.toLowerCase() === informado);
  if (!conta) return null;
  return { nome: conta.nome, telefone: conta.telefone, telefoneVerificado: conta.telefoneVerificado };
}

export function emailDaConta(email: string) {
  const informado = email.trim().toLowerCase();
  return ler().contas.some((c) => c.email.toLowerCase() === informado);
}

export function entrarComSenha(email: string, senha: string): { ok: true; sessao: Sessao } | { ok: false; erro: string } {
  const dado = ler();
  const informado = email.trim().toLowerCase();
  const conta = dado.contas.find((c) => c.email.toLowerCase() === informado && c.senha === senha);
  if (!conta) return { ok: false, erro: "E-mail ou senha não conferem." };
  const sessao: Sessao = { nome: conta.nome, email: conta.email, via: "senha" };
  gravar({ ...dado, sessao });
  return { ok: true, sessao };
}

export function enviarToken(telefone: string): { ok: true; codigoDemo: string } | { ok: false; erro: string } {
  if (!celularValido(telefone)) return { ok: false, erro: "Informe um celular com DDD." };
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const pendente: TokenPendente = {
    telefone: digitos(telefone),
    codigo,
    expira: Date.now() + 5 * 60 * 1000,
  };
  window.sessionStorage.setItem(CHAVE_TOKEN, JSON.stringify(pendente));
  return { ok: true, codigoDemo: codigo };
}

export function confirmarToken(telefone: string, codigo: string): { ok: true } | { ok: false; erro: string } {
  const pendente = lerToken();
  if (!pendente) return { ok: false, erro: "Peça um código novo para este celular." };
  if (pendente.expira < Date.now()) return { ok: false, erro: "O código expirou. Peça outro." };
  if (pendente.telefone !== digitos(telefone)) return { ok: false, erro: "Esse código não é deste celular." };
  if (pendente.codigo !== codigo.trim()) return { ok: false, erro: "Código incorreto." };
  window.sessionStorage.removeItem(CHAVE_TOKEN);
  window.sessionStorage.setItem(
    CHAVE_LIBERADO,
    JSON.stringify({ telefone: pendente.telefone, expira: Date.now() + 10 * 60 * 1000 }),
  );
  return { ok: true };
}

function consumirTelefoneLiberado(telefone: string) {
  if (typeof window === "undefined") return false;
  try {
    const cru = window.sessionStorage.getItem(CHAVE_LIBERADO);
    if (!cru) return false;
    const dado = JSON.parse(cru) as { telefone?: string; expira?: number };
    window.sessionStorage.removeItem(CHAVE_LIBERADO);
    return dado.telefone === digitos(telefone) && (dado.expira ?? 0) >= Date.now();
  } catch {
    return false;
  }
}

export function cadastrar(input: {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}): { ok: true; sessao: Sessao } | { ok: false; erro: string } {
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();
  if (nome.length < 2) return { ok: false, erro: "Informe o nome de quem vai usar a conta." };
  if (!emailValido(email)) return { ok: false, erro: "Informe um e-mail válido." };
  if (emailDaConta(email)) return { ok: false, erro: "Este e-mail já está cadastrado." };
  if (!celularValido(input.telefone)) return { ok: false, erro: "Informe um celular com DDD." };
  if (!senhaForte(input.senha, email)) return { ok: false, erro: "A senha não atende aos critérios de segurança." };
  if (!consumirTelefoneLiberado(input.telefone)) {
    return { ok: false, erro: "Confirme o celular com o código antes de criar a conta." };
  }
  const dado = ler();
  const conta: Conta = {
    nome,
    email,
    senha: input.senha,
    telefone: input.telefone,
    telefoneVerificado: true,
  };
  const sessao: Sessao = { nome, email, via: "senha" };
  gravar({ contas: [conta, ...dado.contas], sessao });
  return { ok: true, sessao };
}

export function concluirSso(
  via: Exclude<Via, "senha">,
  input: { nome: string; email: string; telefone: string },
): { ok: true; sessao: Sessao } | { ok: false; erro: string } {
  const email = input.email.trim().toLowerCase();
  const nome = input.nome.trim();
  if (!emailValido(email)) return { ok: false, erro: "Informe um e-mail válido." };
  if (!celularValido(input.telefone)) return { ok: false, erro: "Informe um celular com DDD." };
  const dado = ler();
  const existente = dado.contas.find((c) => c.email.toLowerCase() === email);
  if (existente && (!existente.telefoneVerificado || digitos(existente.telefone) !== digitos(input.telefone))) {
    return { ok: false, erro: "Este e-mail já possui conta. Entre com a senha ou use o celular cadastrado." };
  }
  if (!existente && nome.length < 2) return { ok: false, erro: "Informe o nome de quem vai usar a conta." };
  if (!consumirTelefoneLiberado(input.telefone)) {
    return { ok: false, erro: "Confirme o celular com o código antes de entrar." };
  }
  if (existente) {
    const sessao: Sessao = { nome: existente.nome, email: existente.email, via };
    gravar({ ...dado, sessao });
    return { ok: true, sessao };
  }
  const conta: Conta = {
    nome,
    email,
    senha: `Sso#${Math.random().toString(36).slice(2)}A1`,
    telefone: input.telefone,
    telefoneVerificado: true,
  };
  const sessao: Sessao = { nome, email, via };
  gravar({ contas: [conta, ...dado.contas], sessao });
  return { ok: true, sessao };
}

export function redefinirSenha(email: string, senha: string): { ok: true } | { ok: false; erro: string } {
  if (!emailDaConta(email)) return { ok: false, erro: "Não achamos esse e-mail na operação." };
  if (!senhaForte(senha, email)) return { ok: false, erro: "A senha não atende aos critérios de segurança." };
  const dado = ler();
  const informado = email.trim().toLowerCase();
  gravar({
    ...dado,
    sessao: null,
    contas: dado.contas.map((c) => (c.email.toLowerCase() === informado ? { ...c, senha } : c)),
  });
  return { ok: true };
}

export function sair() {
  const dado = ler();
  gravar({ ...dado, sessao: null });
}
