import { brDate, firstName, relativeDay } from "./format";
import type { Coluna, Origem, Ordem, Prioridade, TipoAtendimento, Tom } from "./types";

export const STATUS_META: Record<string, string> = {
  aberta: "Aberta",
  agendada: "Agendada",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando Pagamento",
  concluida: "Concluída",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

export const COLUNAS_PADRAO: Coluna[] = [
  { id: "aberta", nome: "Aberta" },
  { id: "agendada", nome: "Agendada" },
  { id: "em_andamento", nome: "Em andamento" },
  { id: "aguardando_peca", nome: "Aguardando Pagamento" },
  { id: "concluida", nome: "Concluída" },
  { id: "entregue", nome: "Entregue" },
];

export const COLUNAS = COLUNAS_PADRAO.map((c) => c.id);

const FECHADAS = new Set(["concluida", "entregue", "cancelada"]);

export function emAberto(status: string) {
  return !FECHADAS.has(status);
}

export function ehConcluida(status: string) {
  return status === "concluida" || status === "entregue";
}

export function noPeriodo(criadoEm: string, dias: number, now = new Date()) {
  const janela = Number.isFinite(dias) && dias > 0 ? Math.floor(dias) : 30;
  const limite = new Date(now);
  limite.setHours(0, 0, 0, 0);
  limite.setDate(limite.getDate() - janela);
  const dia = criadoEm?.slice(0, 10);
  if (!dia) return true;
  const [ano, mes, data] = dia.split("-").map(Number);
  return new Date(ano || 1970, (mes || 1) - 1, data || 1) >= limite;
}

function emMinutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function conflitoHorario(
  ordens: Ordem[],
  alvo: { id?: string; data: string; hora: string; duracaoMin: number; profissional?: string },
) {
  const inicio = emMinutos(alvo.hora);
  if (!alvo.data || inicio == null) return null;
  const duracao = alvo.duracaoMin > 0 ? alvo.duracaoMin : 60;
  const fim = inicio + duracao;
  const prof = alvo.profissional?.trim().toLowerCase() ?? "";
  return (
    ordens.find((o) => {
      if (alvo.id && o.id === alvo.id) return false;
      if (o.status === "cancelada" || o.data !== alvo.data || !o.hora) return false;
      const outroProf = (o.profissional ?? "").trim().toLowerCase();
      if (prof && outroProf && prof !== outroProf) return false;
      const outroInicio = emMinutos(o.hora);
      if (outroInicio == null) return false;
      const outroFim = outroInicio + (o.duracaoMin > 0 ? o.duracaoMin : duracao);
      return inicio < outroFim && outroInicio < fim;
    }) ?? null
  );
}

export function textoConflito(ordem: Ordem, cliente?: string) {
  const quem = cliente ? `, ${cliente}` : "";
  const minutos = ordem.duracaoMin > 0 ? ordem.duracaoMin : 60;
  return `Já existe um agendamento neste horário: ${ordem.numero} · ${ordem.titulo}, às ${ordem.hora} (${minutos} min)${quem}.`;
}

export function nomeStatus(colunas: Coluna[], status: string) {
  if (status === "cancelada") return "Cancelada";
  return colunas.find((c) => c.id === status)?.nome ?? STATUS_META[status] ?? status;
}

export function erroColunas(atuais: Coluna[], proximas: Coluna[], ordens: { status: string }[]) {
  if (proximas.length === 0) return "A pipeline precisa de ao menos uma coluna.";
  if (proximas.some((c) => !c.nome.trim())) return "Toda coluna precisa de um nome.";
  const usadas = new Map<string, number>();
  for (const ordem of ordens) {
    if (ordem.status === "cancelada") continue;
    usadas.set(ordem.status, (usadas.get(ordem.status) ?? 0) + 1);
  }
  for (const [id, qtd] of usadas) {
    const antes = atuais.find((c) => c.id === id);
    if (!antes || qtd < 1) continue;
    const depois = proximas.find((c) => c.id === id);
    const quanto = qtd === 1 ? "há 1 ordem" : `há ${qtd} ordens`;
    if (!depois) return `Não é possível remover "${antes.nome}": ${quanto} nessa coluna.`;
    if (depois.nome.trim() !== antes.nome) {
      return `Não é possível alterar "${antes.nome}": ${quanto} nessa coluna.`;
    }
  }
  return null;
}

export const PRIORIDADE_META: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const TIPO_META: Record<TipoAtendimento, string> = {
  loja: "No consultório",
  visita: "Visita",
  remoto: "Online",
};

export const ORIGEM_META: Record<Origem, string> = {
  whatsapp: "WhatsApp",
  balcao: "Balcão",
  telefone: "Telefone",
};

export const ABERTAS = COLUNAS_PADRAO.map((c) => c.id).filter((id) => emAberto(id));

export function tomChip(tom: Tom) {
  if (tom === "gold") return "bg-gold-soft text-ink";
  if (tom === "olive") return "bg-olive text-paper";
  return "bg-lime-soft text-ink";
}

export function tomBorder(tom: Tom | undefined) {
  if (tom === "gold") return "border-l-gold";
  if (tom === "olive") return "border-l-olive";
  if (tom === "lime") return "border-l-lime";
  return "border-l-line";
}

export function prioridadeChip(p: Prioridade) {
  if (p === "urgente" || p === "alta") return "bg-gold-soft text-ink";
  if (p === "media") return "bg-lime-soft text-ink";
  return "bg-paper text-muted";
}

export function textoStatus(negocio: string, cliente: string, ordem: Ordem, colunas: Coluna[]) {
  const nome = firstName(cliente);
  const quando = ordem.data
    ? `\nHorário: ${relativeDay(ordem.data)} (${brDate(ordem.data)}) às ${ordem.hora || "—"}, ${TIPO_META[ordem.tipo].toLowerCase()}.`
    : "";
  return `Olá, ${nome}! Aqui é a ${negocio}.\nSua ${ordem.numero} — ${ordem.titulo} — está: ${nomeStatus(colunas, ordem.status)}.${quando}\nSe precisar, é só responder por aqui.`;
}

export function sugerirTitulo(texto: string) {
  const t = texto.toLowerCase();
  if (t.includes("casal")) return "Sessão de casal";
  if (t.includes("online")) return "Sessão online";
  if (t.includes("remarcar") || t.includes("remarca")) return "Remarcação de sessão";
  if (t.includes("primeira") || t.includes("indica")) return "Primeira sessão";
  if (
    t.includes("sessão") ||
    t.includes("sessao") ||
    t.includes("horário") ||
    t.includes("horario") ||
    t.includes("agendar") ||
    t.includes("marcar")
  ) {
    return "Sessão de terapia";
  }
  return "Atendimento via WhatsApp";
}

export function sugerirFrase(texto: string) {
  const t = texto.toLowerCase();
  if (t.includes("remarcar") || t.includes("remarca")) {
    return "Consigo te encaixar nesta semana. Qual dia e horário ficam melhores?";
  }
  if (t.includes("online")) return "Sim, atendo online. Quer que eu reserve um horário?";
  if (t.includes("casal")) return "Atendo sessão de casal. Qual período fica melhor para vocês?";
  if (t.includes("sess") || t.includes("agendar") || t.includes("marcar") || t.includes("horário") || t.includes("horario")) {
    return "Tenho horário nesta semana. Prefere no consultório ou online?";
  }
  return null;
}

export function checklistPadrao() {
  return ["Confirmar o defeito", "Diagnosticar", "Executar o serviço", "Testar com o cliente"];
}
