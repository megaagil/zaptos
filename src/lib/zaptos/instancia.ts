import { CONTA_FACHINE, CONTA_INICIAL, sessaoAtual } from "./conta";
import { COLUNAS_PADRAO } from "./meta";
import type { Cliente, Coluna, Conversa, Negocio, Ordem, Snapshot, Tecnico } from "./types";

export type Fatia = {
  seeded: boolean;
  negocio: Negocio;
  colunas: Coluna[];
  clientes: Cliente[];
  tecnicos: Tecnico[];
  ordens: Ordem[];
  conversas: Conversa[];
  exibirConcluidas: boolean;
  diasPipeline: number;
  duracaoPadrao: number;
};

export const VAZIO: Snapshot = {
  seeded: false,
  negocio: {
    nome: "",
    segmento: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    whatsapp: "",
    wabaId: "",
    phoneNumberId: "",
    token: "",
    webhookToken: "",
    vinculado: false,
  },
  colunas: COLUNAS_PADRAO,
  clientes: [],
  tecnicos: [],
  ordens: [],
  conversas: [],
};

const CHAVE_MAPA = "zaptos-instancias-v1";
const CHAVE_MIGRADO = "zaptos-instancias-migrado";
const CHAVE_LEGADA = "zaptos-operacao-v2";

export function lerMapa(): Record<string, Partial<Fatia>> {
  if (typeof window === "undefined") return {};
  try {
    const cru = window.localStorage.getItem(CHAVE_MAPA);
    if (!cru) return {};
    const dado = JSON.parse(cru) as Record<string, Partial<Fatia>>;
    return dado && typeof dado === "object" ? dado : {};
  } catch {
    return {};
  }
}

export function fatiaDe(salvo: Partial<Fatia> | undefined, email = ""): Fatia {
  const negocio = { ...VAZIO.negocio, ...(salvo?.negocio ?? {}) };
  if (!salvo && email === CONTA_FACHINE.email.toLowerCase()) {
    negocio.nome = CONTA_FACHINE.nome;
    negocio.segmento = CONTA_FACHINE.segmento;
  }
  return {
    seeded: Boolean(salvo?.seeded),
    negocio,
    colunas: salvo?.colunas?.length ? salvo.colunas : COLUNAS_PADRAO,
    clientes: salvo?.clientes ?? [],
    tecnicos: salvo?.tecnicos ?? [],
    ordens: salvo?.ordens ?? [],
    conversas: salvo?.conversas ?? [],
    exibirConcluidas: salvo?.exibirConcluidas ?? true,
    diasPipeline: salvo?.diasPipeline ?? 30,
    duracaoPadrao: salvo?.duracaoPadrao ?? 60,
  };
}

export function migrarInstancias() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(CHAVE_MIGRADO) === "1") return;
  const mapa = lerMapa();
  const ana = CONTA_INICIAL.email.toLowerCase();
  if (!mapa[ana]) {
    const cru = window.localStorage.getItem(CHAVE_LEGADA);
    if (cru) {
      try {
        const parsed = JSON.parse(cru) as { state?: Partial<Fatia> } & Partial<Fatia>;
        const state = parsed.state ?? parsed;
        const negocio = { ...VAZIO.negocio, ...(state.negocio ?? {}) };
        if (negocio.nome === CONTA_FACHINE.nome) {
          negocio.nome = "";
          if (negocio.segmento === CONTA_FACHINE.segmento) negocio.segmento = "";
        }
        mapa[ana] = { ...state, negocio };
      } catch {
        mapa[ana] = fatiaDe(undefined);
      }
    }
  }
  const fachine = CONTA_FACHINE.email.toLowerCase();
  if (!mapa[fachine]) mapa[fachine] = fatiaDe(undefined, fachine);
  window.localStorage.setItem(CHAVE_MAPA, JSON.stringify(mapa));
  window.localStorage.setItem(CHAVE_MIGRADO, "1");
}

export const armazenamentoDaConta = {
  getItem: () => {
    migrarInstancias();
    const email = sessaoAtual()?.email?.toLowerCase();
    if (!email) return null;
    const salvo = lerMapa()[email];
    if (!salvo) return null;
    return JSON.stringify({ state: fatiaDe(salvo, email), version: 3 });
  },
  setItem: (_nome: string, valor: string) => {
    const email = sessaoAtual()?.email?.toLowerCase();
    if (!email || typeof window === "undefined") return;
    try {
      const parsed = JSON.parse(valor) as { state?: Partial<Fatia> };
      if (!parsed.state) return;
      const mapa = lerMapa();
      mapa[email] = parsed.state;
      window.localStorage.setItem(CHAVE_MAPA, JSON.stringify(mapa));
    } catch {
      /* ignora gravação inválida */
    }
  },
  removeItem: () => {},
};

