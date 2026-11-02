import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sair } from "./conta";
import { armazenamentoDaConta, fatiaDe, lerMapa, migrarInstancias, VAZIO } from "./instancia";
import { firstName, nowStamp, todayKey, uid } from "./format";
import {
  COLUNAS_PADRAO,
  ORIGEM_META,
  conflitoHorario,
  erroColunas,
  nomeStatus,
  textoConflito,
  textoStatus,
  TIPO_META,
} from "./meta";
import { buildSeed } from "./seed";
import type {
  Cliente,
  Coluna,
  Conversa,
  FiltroOrdens,
  Mensagem,
  Modal,
  Negocio,
  NovaOrdem,
  Ordem,
  Snapshot,
  StatusOS,
  Tecnico,
  TipoAtendimento,
  View,
} from "./types";

export { migrarInstancias };

type AgendaPayload = {
  data: string;
  hora: string;
  duracaoMin: number;
  tipo: TipoAtendimento;
  profissional: string;
  avisar: boolean;
  ignorarConflito?: boolean;
};

type ClienteInput = Omit<Cliente, "id">;

type State = Snapshot & {
  view: View;
  agendaDia: string;
  agendaInicio: string;
  osAbertaId: string | null;
  conversaAtivaId: string | null;
  clienteFocoId: string | null;
  modal: Modal;
  toast: string | null;
  ordensFiltro: FiltroOrdens;
  exibirConcluidas: boolean;
  diasPipeline: number;
  duracaoPadrao: number;
  setView: (view: View) => void;
  setAgendaDia: (dia: string) => void;
  shiftAgenda: (days: number) => void;
  setOs: (id: string | null) => void;
  setConversa: (id: string | null) => void;
  setClienteFoco: (id: string | null) => void;
  abrirModal: (modal: Modal) => void;
  fecharModal: () => void;
  setFiltro: (filtro: FiltroOrdens) => void;
  setExibirConcluidas: (valor: boolean) => void;
  setDiasPipeline: (dias: number) => void;
  irParaOrdens: (filtro: FiltroOrdens) => void;
  setToast: (toast: string | null) => void;
  renomear: (nome: string) => void;
  salvarConfiguracao: (negocio: Negocio, colunas: Coluna[], duracaoPadrao: number) => boolean;
  applySeed: () => void;
  restaurar: () => void;
  focarHoje: () => void;
  criarCliente: (input: ClienteInput) => string;
  atualizarCliente: (id: string, patch: Partial<ClienteInput>) => void;
  criarOrdem: (input: NovaOrdem) => string;
  atualizarOrdem: (id: string, patch: Partial<Ordem>, evento?: string) => void;
  moverStatus: (id: string, status: StatusOS, silent?: boolean) => void;
  agendar: (id: string, payload: AgendaPayload) => void;
  toggleCheck: (ordemId: string, checkId: string) => void;
  addNota: (ordemId: string, texto: string) => void;
  enviarAviso: (ordemId: string) => void;
  enviarMensagem: (conversaId: string, texto: string) => void;
  marcarLidas: (conversaId: string) => void;
  abrirConversaCliente: (clienteId: string) => void;
  simularEntrada: () => void;
};

function touch(o: Ordem, patch: Partial<Ordem>, evento?: string): Ordem {
  const agora = nowStamp();
  return {
    ...o,
    ...patch,
    atualizadoEm: agora,
    timeline: evento
      ? [...o.timeline, { id: uid("ev"), texto: evento, em: agora }]
      : o.timeline,
  };
}

function proximoNumero(ordens: Ordem[]) {
  const nums = ordens
    .map((o) => Number(o.numero.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 2400;
  return `OS-${max + 1}`;
}

function appendMensagem(
  conversas: Conversa[],
  clienteId: string,
  msg: Mensagem,
  naoLidasDelta: number,
) {
  const atual = conversas.find((c) => c.clienteId === clienteId);
  if (!atual) {
    const criada: Conversa = {
      id: uid("cv"),
      clienteId,
      mensagens: [msg],
      naoLidas: Math.max(0, naoLidasDelta),
    };
    return { conversas: [criada, ...conversas], conversaId: criada.id };
  }
  return {
    conversaId: atual.id,
    conversas: conversas.map((c) =>
      c.id === atual.id
        ? {
            ...c,
            mensagens: [...c.mensagens, msg],
            naoLidas: Math.max(0, c.naoLidas + naoLidasDelta),
          }
        : c,
    ),
  };
}

const ROTEIRO: { nome: string; telefone: string; texto: string }[] = [
  {
    nome: "Marina Costa",
    telefone: "(11) 98810-2210",
    texto: "Olá, boa tarde. Queria marcar uma sessão. Você tem horário na quinta, no fim da tarde?",
  },
  {
    nome: "Lucas Andrade",
    telefone: "(11) 99720-4418",
    texto: "Oi. Preciso remarcar a sessão de amanhã. Consigo na terça, no mesmo horário?",
  },
  {
    nome: "Helena Duarte",
    telefone: "(11) 98640-1102",
    texto: "Boa noite. A sessão pode ser online? Esta semana só consigo de casa.",
  },
  {
    nome: "Pedro Almeida",
    telefone: "(11) 99110-7784",
    texto: "Olá. Vim por indicação. Gostaria de uma primeira conversa para conhecer o seu trabalho.",
  },
  {
    nome: "Fernanda Lopes",
    telefone: "(11) 99620-1184",
    texto: "Oi. A sessão de casal pode ser às 19h? Meu marido só consegue depois do trabalho.",
  },
  {
    nome: "Camila Ferreira",
    telefone: "(11) 98821-4402",
    texto: "Confirmo a sessão de sexta às 16h. Vou online, como da última vez.",
  },
];

let roteiroCursor = 0;

function estadoTela() {
  return {
    view: "painel" as const,
    agendaDia: "",
    agendaInicio: "",
    osAbertaId: null,
    conversaAtivaId: null,
    clienteFocoId: null,
    modal: null,
    toast: null,
    ordensFiltro: "todas" as const,
  };
}

export const useZaptos = create<State>()(
  persist(
    (set, get) => ({
      ...VAZIO,
      view: "painel",
      agendaDia: "",
      agendaInicio: "",
      osAbertaId: null,
      conversaAtivaId: null,
      clienteFocoId: null,
      modal: null,
      toast: null,
      ordensFiltro: "todas",
      exibirConcluidas: true,
      diasPipeline: 30,
      duracaoPadrao: 60,

      setView: (view) => set({ view }),
      setAgendaDia: (agendaDia) => set({ agendaDia }),
      shiftAgenda: (days) => {
        const inicio = get().agendaInicio || todayKey();
        const dia = get().agendaDia || inicio;
        const nextInicio = addDays(inicio, days);
        const nextDia = addDays(dia, days);
        set({ agendaInicio: nextInicio, agendaDia: nextDia });
      },
      setOs: (osAbertaId) => set({ osAbertaId }),
      setConversa: (id) => {
        if (!id) {
          set({ conversaAtivaId: null });
          return;
        }
        get().marcarLidas(id);
        set({ conversaAtivaId: id, view: "whatsapp" });
      },
      setClienteFoco: (clienteFocoId) => set({ clienteFocoId, view: clienteFocoId ? "clientes" : get().view }),
      abrirModal: (modal) => set({ modal }),
      fecharModal: () => set({ modal: null }),
      setFiltro: (ordensFiltro) => set({ ordensFiltro }),
      setExibirConcluidas: (exibirConcluidas) => set({ exibirConcluidas }),
      setDiasPipeline: (dias) => {
        const n = Math.floor(Number(dias));
        if (!Number.isFinite(n) || n < 1) return;
        set({ diasPipeline: Math.min(n, 3650) });
      },
      irParaOrdens: (ordensFiltro) => set({ view: "ordens", ordensFiltro }),
      setToast: (toast) => set({ toast }),
      renomear: (nome) => {
        set({ negocio: { ...get().negocio, nome } });
      },
      salvarConfiguracao: (negocio, colunas, duracaoPadrao) => {
        const erro = erroColunas(get().colunas, colunas, get().ordens);
        if (erro) {
          set({ toast: erro });
          return false;
        }
        const minutos = Math.floor(Number(duracaoPadrao));
        set({
          negocio,
          colunas: colunas.map((c) => ({ id: c.id, nome: c.nome.trim() })),
          duracaoPadrao: Number.isFinite(minutos) && minutos >= 5 ? Math.min(minutos, 480) : get().duracaoPadrao,
          toast: negocio.vinculado ? "WhatsApp Business vinculado." : "Configurações salvas.",
        });
        return true;
      },
      applySeed: () => {
        const snap = buildSeed(new Date());
        const hoje = todayKey();
        const primeira = snap.conversas.find((c) => c.naoLidas > 0)?.id ?? null;
        set({
          ...snap,
          view: "painel",
          agendaDia: hoje,
          agendaInicio: hoje,
          osAbertaId: null,
          conversaAtivaId: primeira,
          clienteFocoId: null,
          modal: null,
          ordensFiltro: "todas",
          toast: null,
        });
      },
      restaurar: () => {
        get().applySeed();
        set({ toast: "Demonstração restaurada" });
      },
      focarHoje: () => {
        const hoje = todayKey();
        set({ agendaDia: hoje, agendaInicio: hoje });
      },
      criarCliente: (input) => {
        const cliente: Cliente = { id: uid("c"), ...input };
        set({ clientes: [cliente, ...get().clientes] });
        return cliente.id;
      },
      atualizarCliente: (id, patch) => {
        set({
          clientes: get().clientes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        });
      },
      criarOrdem: (input) => {
        const state = get();
        const agora = nowStamp();
        const duracaoMin = input.duracaoMin > 0 ? input.duracaoMin : state.duracaoPadrao;
        if (input.data && input.hora && !input.ignorarConflito) {
          const ocupado = conflitoHorario(state.ordens, {
            data: input.data,
            hora: input.hora,
            duracaoMin,
            profissional: input.profissional,
          });
          if (ocupado) {
            set({ toast: textoConflito(ocupado) });
            return "";
          }
        }
        const id = uid("os");
        const numero = proximoNumero(state.ordens);
        const ids = new Set(state.colunas.map((c) => c.id));
        const status: StatusOS =
          input.data && input.hora && ids.has("agendada")
            ? "agendada"
            : ids.has("aberta")
              ? "aberta"
              : (state.colunas[0]?.id ?? "aberta");
        const ordem: Ordem = {
          id,
          numero,
          clienteId: input.clienteId,
          tecnicoId: "",
          profissional: input.profissional.trim(),
          titulo: input.titulo.trim(),
          descricao: input.descricao.trim(),
          equipamento: input.equipamento.trim(),
          status,
          prioridade: input.prioridade,
          valor: input.valor,
          tipo: input.tipo,
          origem: input.origem,
          data: input.data,
          hora: input.hora,
          duracaoMin,
          checklist: [],
          timeline: [
            {
              id: uid("ev"),
              texto: `OS aberta via ${ORIGEM_META[input.origem]}.`,
              em: agora,
            },
          ],
          criadoEm: agora,
          atualizadoEm: agora,
        };
        if (input.data && input.hora) {
          ordem.timeline.push({
            id: uid("ev"),
            texto: `Horário marcado: ${input.data.split("-").reverse().join("/")} às ${input.hora} (${duracaoMin} min, ${TIPO_META[input.tipo]}).`,
            em: agora,
          });
        }
        let conversas = state.conversas;
        if (input.avisar) {
          const cliente = state.clientes.find((c) => c.id === input.clienteId);
          if (cliente) {
            const texto = textoStatus(state.negocio.nome, cliente.nome, ordem, state.colunas);
            conversas = appendMensagem(
              conversas,
              cliente.id,
              { id: uid("m"), de: "negocio", texto, em: agora },
              0,
            ).conversas;
          }
        }
        set({
          ordens: [ordem, ...state.ordens],
          conversas,
          osAbertaId: id,
          modal: null,
          toast: input.avisar ? `${numero} criada e avisada no WhatsApp` : `${numero} criada`,
        });
        return id;
      },
      atualizarOrdem: (id, patch, evento) => {
        set({
          ordens: get().ordens.map((o) => (o.id === id ? touch(o, patch, evento) : o)),
        });
      },
      moverStatus: (id, status, silent) => {
        const atual = get().ordens.find((o) => o.id === id);
        if (!atual || atual.status === status) return;
        const nome = nomeStatus(get().colunas, status);
        set({
          ordens: get().ordens.map((o) =>
            o.id === id ? touch(o, { status }, `Status alterado para ${nome}.`) : o,
          ),
          toast: silent ? get().toast : `${atual.numero} → ${nome}`,
        });
      },
      agendar: (id, payload) => {
        const atual = get().ordens.find((o) => o.id === id);
        if (!atual) return;
        const duracaoMin = payload.duracaoMin > 0 ? payload.duracaoMin : get().duracaoPadrao;
        if (!payload.ignorarConflito) {
          const ocupado = conflitoHorario(get().ordens, {
            id,
            data: payload.data,
            hora: payload.hora,
            duracaoMin,
            profissional: payload.profissional,
          });
          if (ocupado) {
            set({ toast: textoConflito(ocupado) });
            return;
          }
        }
        const ids = new Set(get().colunas.map((c) => c.id));
        const status: StatusOS =
          atual.status === "aberta" && ids.has("agendada") ? "agendada" : atual.status;
        const quando = `${payload.data.split("-").reverse().join("/")} às ${payload.hora}`;
        set({
          ordens: get().ordens.map((o) =>
            o.id === id
              ? touch(
                  o,
                  {
                    data: payload.data,
                    hora: payload.hora,
                    duracaoMin,
                    tipo: payload.tipo,
                    profissional: payload.profissional.trim(),
                    status,
                  },
                  `Horário definido: ${quando} (${duracaoMin} min, ${TIPO_META[payload.tipo]}).`,
                )
              : o,
          ),
          modal: null,
          toast: "Horário atualizado",
        });
        if (payload.avisar) get().enviarAviso(id);
      },
      toggleCheck: (ordemId, checkId) => {
        set({
          ordens: get().ordens.map((o) =>
            o.id === ordemId
              ? {
                  ...o,
                  checklist: o.checklist.map((item) =>
                    item.id === checkId ? { ...item, feito: !item.feito } : item,
                  ),
                  atualizadoEm: nowStamp(),
                }
              : o,
          ),
        });
      },
      addNota: (ordemId, texto) => {
        const limpo = texto.trim();
        if (!limpo) return;
        set({
          ordens: get().ordens.map((o) =>
            o.id === ordemId ? touch(o, {}, `Nota: ${limpo}`) : o,
          ),
        });
      },
      enviarAviso: (ordemId) => {
        const state = get();
        const ordem = state.ordens.find((o) => o.id === ordemId);
        const cliente = state.clientes.find((c) => c.id === ordem?.clienteId);
        if (!ordem || !cliente) return;
        const texto = textoStatus(state.negocio.nome, cliente.nome, ordem, state.colunas);
        const appended = appendMensagem(
          state.conversas,
          cliente.id,
          { id: uid("m"), de: "negocio", texto, em: nowStamp() },
          0,
        );
        set({
          conversas: appended.conversas,
          toast: `Aviso enviado para ${firstName(cliente.nome)}`,
        });
      },
      enviarMensagem: (conversaId, texto) => {
        const limpo = texto.trim();
        if (!limpo) return;
        set({
          conversas: get().conversas.map((c) =>
            c.id === conversaId
              ? {
                  ...c,
                  mensagens: [
                    ...c.mensagens,
                    { id: uid("m"), de: "negocio", texto: limpo, em: nowStamp() },
                  ],
                }
              : c,
          ),
        });
      },
      marcarLidas: (conversaId) => {
        set({
          conversas: get().conversas.map((c) =>
            c.id === conversaId ? { ...c, naoLidas: 0 } : c,
          ),
        });
      },
      abrirConversaCliente: (clienteId) => {
        let conversa = get().conversas.find((c) => c.clienteId === clienteId);
        if (!conversa) {
          conversa = { id: uid("cv"), clienteId, mensagens: [], naoLidas: 0 };
          set({ conversas: [conversa, ...get().conversas] });
        }
        set({ conversaAtivaId: conversa.id, view: "whatsapp" });
      },
      simularEntrada: () => {
        const item = ROTEIRO[roteiroCursor % ROTEIRO.length];
        roteiroCursor += 1;
        const state = get();
        let cliente = state.clientes.find((c) => c.telefone === item.telefone);
        let clientes = state.clientes;
        if (!cliente) {
          cliente = {
            id: uid("c"),
            nome: item.nome,
            telefone: item.telefone,
            email: "",
            documento: "",
            endereco: "",
            notas: "Paciente da simulação de atendimento.",
          };
          clientes = [cliente, ...clientes];
        }
        const msg: Mensagem = {
          id: uid("m"),
          de: "cliente",
          texto: item.texto,
          em: nowStamp(),
        };
        const appended = appendMensagem(state.conversas, cliente.id, msg, 1);
        const conversas = appended.conversas.map((c) =>
          c.id === appended.conversaId ? { ...c, naoLidas: 0 } : c,
        );
        set({
          clientes,
          conversas,
          conversaAtivaId: appended.conversaId,
          view: "whatsapp",
          toast: `Nova mensagem de ${firstName(cliente.nome)}`,
        });
      },
    }),
    {
      name: "zaptos-instancia-ativa",
      version: 3,
      storage: createJSONStorage(() => armazenamentoDaConta),
      migrate: (persisted) => {
        const dado = persisted as Snapshot;
        if (!Array.isArray(dado.colunas) || dado.colunas.length === 0) {
          return { ...dado, colunas: COLUNAS_PADRAO };
        }
        return dado;
      },
      skipHydration: true,
      partialize: (s) => ({
        seeded: s.seeded,
        negocio: s.negocio,
        colunas: s.colunas,
        exibirConcluidas: s.exibirConcluidas,
        diasPipeline: s.diasPipeline,
        duracaoPadrao: s.duracaoPadrao,
        clientes: s.clientes,
        tecnicos: s.tecnicos,
        ordens: s.ordens,
        conversas: s.conversas,
      }),
    },
  ),
);

export function abrirInstancia(email: string) {
  migrarInstancias();
  const chave = email.trim().toLowerCase();
  useZaptos.setState({ ...fatiaDe(lerMapa()[chave], chave), ...estadoTela() });
}

export function fecharInstancia() {
  sair();
  useZaptos.setState({ ...fatiaDe(undefined), ...estadoTela() });
}

function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function tecnicoDe(tecnicos: Tecnico[], id: string) {
  return tecnicos.find((t) => t.id === id);
}

export function clienteDe(clientes: Cliente[], id: string) {
  return clientes.find((c) => c.id === id);
}
