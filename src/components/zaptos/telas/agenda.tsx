import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDaysKey, formatDayNum, formatDayShort, formatWeekday, isLate, todayKey } from "@/lib/zaptos/format";
import { TIPO_META, nomeStatus, tomBorder, tomChip } from "@/lib/zaptos/meta";
import { clienteDe, useZaptos } from "@/lib/zaptos/store";
import type { Cliente, Ordem, StatusOS, Tom } from "@/lib/zaptos/types";
import { Chip } from "../ui";

export function Agenda() {
  const inicio = useZaptos((s) => s.agendaInicio) || todayKey();
  const selecionado = useZaptos((s) => s.agendaDia) || inicio;
  const ordens = useZaptos((s) => s.ordens);
  const clientes = useZaptos((s) => s.clientes);
  const setAgendaDia = useZaptos((s) => s.setAgendaDia);
  const shiftAgenda = useZaptos((s) => s.shiftAgenda);
  const focarHoje = useZaptos((s) => s.focarHoje);
  const abrirModal = useZaptos((s) => s.abrirModal);
  const setOs = useZaptos((s) => s.setOs);

  const dias = Array.from({ length: 7 }, (_, i) => addDaysKey(inicio, i));
  const hoje = todayKey();

  function itens(dia: string) {
    return ordens
      .filter((o) => o.data === dia && o.status !== "cancelada")
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  function novo(dia: string, hora = "09:00") {
    abrirModal({ kind: "agenda", data: dia, hora });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold lg:text-3xl">Agenda</h1>
          <p className="text-sm text-muted">
            {formatDayShort(dias[0])} — {formatDayShort(dias[6])}. Loja, visita e remoto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-card"
            onClick={() => shiftAgenda(-7)}
            aria-label="Sete dias anteriores"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="h-11 rounded-xl border border-line bg-card px-4 text-sm font-semibold"
            onClick={focarHoje}
          >
            Hoje
          </button>
          <button
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-card"
            onClick={() => shiftAgenda(7)}
            aria-label="Próximos sete dias"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            className="h-11 rounded-xl bg-lime px-4 text-sm font-semibold text-ink"
            onClick={() => novo(selecionado)}
          >
            Novo horário
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {dias.map((dia) => {
          const n = itens(dia).length;
          const ativo = dia === selecionado;
          return (
            <button
              key={dia}
              onClick={() => setAgendaDia(dia)}
              className={cn(
                "flex min-w-16 flex-col items-center rounded-2xl border px-3 py-2",
                ativo ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink",
                !ativo && dia === hoje && "border-lime",
              )}
            >
              <span className="text-xs font-semibold uppercase">{formatWeekday(dia)}</span>
              <span className="text-lg font-extrabold tabular-nums">{formatDayNum(dia)}</span>
              <span className="text-xs tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="lg:hidden">
        <DiaLista
          dia={selecionado}
          itens={itens(selecionado)}
          onOpen={setOs}
          onNovo={() => novo(selecionado)}
          clientes={clientes}
        />
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-7">
        {dias.map((dia) => {
          const lista = itens(dia);
          return (
            <section key={dia} className="min-w-0">
              <header className={cn("mb-2 rounded-xl px-2 py-2", dia === hoje && "bg-lime-soft")}>
                <p className="text-xs font-semibold uppercase text-muted">{formatWeekday(dia)}</p>
                <p className="text-lg font-extrabold tabular-nums">{formatDayNum(dia)}</p>
              </header>
              <div className="flex flex-col gap-2">
                {lista.map((o) => (
                  <CardHorario
                    key={o.id}
                    hora={o.hora}
                    titulo={o.titulo}
                    cliente={clienteDe(clientes, o.clienteId)?.nome ?? ""}
                    tipo={TIPO_META[o.tipo]}
                    status={o.status}
                    atrasado={isLate(o.data, o.hora, o.status)}
                    tom={o.profissional ? "lime" : undefined}
                    tecnico={o.profissional?.split(" ")[0] ?? ""}
                    onOpen={() => setOs(o.id)}
                  />
                ))}
                <button
                  onClick={() => novo(dia, lista.length ? "16:00" : "09:00")}
                  className="rounded-xl border border-dashed border-line px-2 py-3 text-xs font-semibold text-muted hover:border-lime hover:text-ink"
                >
                  Livre
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DiaLista({
  dia,
  itens,
  onOpen,
  onNovo,
  clientes,
}: {
  dia: string;
  itens: Ordem[];
  onOpen: (id: string) => void;
  onNovo: () => void;
  clientes: Cliente[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-muted">{formatDayShort(dia)}</p>
      {itens.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Dia livre. Encaixe uma sessão no consultório, online ou uma visita.
        </p>
      )}
      {itens.map((o) => (
        <CardHorario
          key={o.id}
          hora={o.hora}
          titulo={o.titulo}
          cliente={clienteDe(clientes, o.clienteId)?.nome ?? ""}
          tipo={TIPO_META[o.tipo]}
          status={o.status}
          atrasado={isLate(o.data, o.hora, o.status)}
          tom={o.profissional ? "lime" : undefined}
          tecnico={o.profissional?.split(" ")[0] ?? ""}
          onOpen={() => onOpen(o.id)}
        />
      ))}
      <button
        onClick={onNovo}
        className="h-11 rounded-xl border border-dashed border-line text-sm font-semibold text-muted"
      >
        Novo horário neste dia
      </button>
    </div>
  );
}

function CardHorario({
  hora,
  titulo,
  cliente,
  tipo,
  status,
  atrasado,
  tom,
  tecnico,
  onOpen,
}: {
  hora: string;
  titulo: string;
  cliente: string;
  tipo: string;
  status: StatusOS;
  atrasado: boolean;
  tom: Tom | undefined;
  tecnico: string;
  onOpen: () => void;
}) {
  const colunas = useZaptos((s) => s.colunas);
  return (
    <button
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border border-line border-l-4 bg-card p-2 text-left",
        tomBorder(tom),
      )}
    >
      <span className="text-xs font-bold tabular-nums">{hora}</span>
      <span className="mt-0.5 block text-sm font-semibold leading-snug">{titulo}</span>
      <span className="mt-0.5 block text-xs text-muted">{cliente}</span>
      <span className="mt-1 flex flex-wrap gap-1">
        <Chip className="bg-paper text-muted">{tipo}</Chip>
        {atrasado ? (
          <Chip className="bg-gold-soft text-ink">Atrasado</Chip>
        ) : (
          <Chip className="bg-paper text-muted">{nomeStatus(colunas, status)}</Chip>
        )}
        {tecnico && tom && <Chip className={tomChip(tom)}>{tecnico}</Chip>}
      </span>
    </button>
  );
}
