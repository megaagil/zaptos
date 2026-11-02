export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export type StatusOS = string;

export type Coluna = {
  id: string;
  nome: string;
};

export type TipoAtendimento = "loja" | "visita" | "remoto";
export type Origem = "whatsapp" | "balcao" | "telefone";
export type View = "painel" | "agenda" | "ordens" | "whatsapp" | "clientes" | "configuracoes";
export type Tom = "lime" | "gold" | "olive";

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  documento: string;
  endereco: string;
  notas: string;
};

export type Tecnico = {
  id: string;
  nome: string;
  especialidade: string;
  tom: Tom;
};

export type ChecklistItem = { id: string; texto: string; feito: boolean };
export type Evento = { id: string; texto: string; em: string };

export type Ordem = {
  id: string;
  numero: string;
  clienteId: string;
  tecnicoId: string;
  profissional?: string;
  titulo: string;
  descricao: string;
  equipamento: string;
  status: StatusOS;
  prioridade: Prioridade;
  valor: number;
  tipo: TipoAtendimento;
  origem: Origem;
  data: string;
  hora: string;
  duracaoMin: number;
  checklist: ChecklistItem[];
  timeline: Evento[];
  criadoEm: string;
  atualizadoEm: string;
};

export type Mensagem = {
  id: string;
  de: "cliente" | "negocio";
  texto: string;
  em: string;
};

export type Conversa = {
  id: string;
  clienteId: string;
  mensagens: Mensagem[];
  naoLidas: number;
};

export type Negocio = {
  nome: string;
  segmento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  whatsapp: string;
  wabaId: string;
  phoneNumberId: string;
  token: string;
  webhookToken: string;
  vinculado: boolean;
};

export type Modal =
  | null
  | {
      kind: "os";
      clienteId?: string;
      conversaId?: string;
      titulo?: string;
      descricao?: string;
    }
  | {
      kind: "agenda";
      clienteId?: string;
      conversaId?: string;
      ordemId?: string;
      data?: string;
      hora?: string;
      titulo?: string;
    }
  | { kind: "cliente"; clienteId?: string };

export type NovaOrdem = {
  clienteId: string;
  tecnicoId: string;
  profissional: string;
  titulo: string;
  descricao: string;
  equipamento: string;
  prioridade: Prioridade;
  valor: number;
  tipo: TipoAtendimento;
  origem: Origem;
  data: string;
  hora: string;
  duracaoMin: number;
  avisar: boolean;
  ignorarConflito?: boolean;
};

export type FiltroOrdens = "todas" | "abertas" | StatusOS;

export type Snapshot = {
  seeded: boolean;
  negocio: Negocio;
  colunas: Coluna[];
  clientes: Cliente[];
  tecnicos: Tecnico[];
  ordens: Ordem[];
  conversas: Conversa[];
};
