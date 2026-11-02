import { ArrowRight } from "lucide-react";
import { formatDayLong, formatValor, hourOf, isLate, relativeDay, todayKey } from "@/lib/zaptos/format";
import { PRIORIDADE_META, TIPO_META, ehConcluida, emAberto, noPeriodo, prioridadeChip, tomChip } from "@/lib/zaptos/meta";
import { clienteDe, useZaptos } from "@/lib/zaptos/store";
import { Chip } from "../ui";

export function Painel() {
  const negocio = useZaptos((s) => s.negocio);
  const ordens = useZaptos((s) => s.ordens);
  const colunas = useZaptos((s) => s.colunas);
  const exibirConcluidas = useZaptos((s) => s.exibirConcluidas);
  const diasPipeline = useZaptos((s) => s.diasPipeline);
  const clientes = useZaptos((s) => s.clientes);
  const conversas = useZaptos((s) => s.conversas);
  const setOs = useZaptos((s) => s.setOs);
  const setConversa = useZaptos((s) => s.setConversa);
  const setView = useZaptos((s) => s.setView);
  const irParaOrdens = useZaptos((s) => s.irParaOrdens);
  const hoje = todayKey();

  const abertas = ordens.filter((o) => emAberto(o.status));
  const doDia = ordens
    .filter((o) => o.data === hoje && o.status !== "cancelada")
    .sort((a, b) => a.hora.localeCompare(b.hora));
  const aReceber = abertas.reduce((sum, o) => sum + o.valor, 0);
  const fila = [...conversas].sort((a, b) => {
    const ua = a.mensagens.at(-1)?.em ?? "";
    const ub = b.mensagens.at(-1)?.em ?? "";
    return ub.localeCompare(ua);
  });
  const semResposta = conversas.filter((c) => c.naoLidas > 0).length;

  const metrics = [
    { label: "Em aberto", value: String(abertas.length), hint: "OS que ainda não fecharam", go: () => irParaOrdens("abertas") },
    { label: "Hoje", value: String(doDia.length), hint: "horários no dia", go: () => setView("agenda") },
    { label: "A receber", value: formatValor(aReceber), hint: "soma das OS em aberto", go: () => irParaOrdens("abertas") },
  ];

  const daPipeline = ordens.filter(
    (o) => noPeriodo(o.criadoEm, diasPipeline) && (exibirConcluidas || !ehConcluida(o.status)),
  );
  const counts = (exibirConcluidas ? colunas : colunas.filter((c) => !ehConcluida(c.id))).map((coluna) => ({
    status: coluna.id,
    nome: coluna.nome,
    n: daPipeline.filter((o) => o.status === coluna.id).length,
  }));
  const total = counts.reduce((sum, c) => sum + c.n, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink lg:text-3xl">{negocio.nome || "Seu negócio"}</h1>
          <p className="text-muted">{formatDayLong(hoje)}</p>
        </div>
        <p className="max-w-sm text-sm text-muted">
          {semResposta > 0
            ? `${semResposta} ${semResposta === 1 ? "conversa pede" : "conversas pedem"} resposta no WhatsApp.`
            : "Nenhuma conversa pendente. A fila está em dia."}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <button
            key={m.label}
            onClick={m.go}
            className="rounded-2xl border border-line bg-card px-4 py-4 text-left transition-colors hover:border-lime"
          >
            <p className="text-sm font-semibold text-muted">{m.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-ink tabular-nums">{m.value}</p>
            <p className="mt-1 text-sm text-muted">{m.hint}</p>
          </button>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-line bg-card p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">Agenda de hoje</h2>
            <button className="text-sm font-semibold text-lime-deep" onClick={() => setView("agenda")}>
              Ver a semana
            </button>
          </div>
          {doDia.length === 0 ? (
            <p className="rounded-xl bg-paper px-3 py-6 text-sm text-muted">
              Nenhum horário hoje. Abra a agenda para encaixar uma sessão.
            </p>
          ) : (
            <ul className="flex flex-col">
              {doDia.map((o) => {
                const cliente = clienteDe(clientes, o.clienteId);
                const atrasado = isLate(o.data, o.hora, o.status);
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => setOs(o.id)}
                      className="flex w-full gap-3 border-t border-line py-3 text-left first:border-t-0"
                    >
                      <span className="w-12 shrink-0 pt-0.5 text-sm font-bold text-ink tabular-nums">
                        {o.hora}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{o.titulo}</span>
                          {atrasado && <Chip className="bg-gold-soft text-ink">Atrasado</Chip>}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted">
                          {cliente?.nome} · {TIPO_META[o.tipo]} · {colunas.find((c) => c.id === o.status)?.nome ?? o.status}
                        </span>
                      </span>
                      {o.profissional ? (
                        <Chip className={tomChip("lime")}>{o.profissional.split(" ")[0]}</Chip>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">WhatsApp</h2>
            <button className="text-sm font-semibold text-lime-deep" onClick={() => setView("whatsapp")}>
              Abrir
            </button>
          </div>
          <ul className="flex flex-col">
            {fila.slice(0, 5).map((c) => {
              const cliente = clienteDe(clientes, c.clienteId);
              const ultima = c.mensagens.at(-1);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setConversa(c.id)}
                    className="flex w-full items-start gap-3 border-t border-line py-3 text-left first:border-t-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold">{cliente?.nome}</span>
                        {c.naoLidas > 0 && (
                          <span className="rounded-full bg-lime px-1.5 text-xs font-bold text-ink tabular-nums">
                            {c.naoLidas}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-sm text-muted">
                        {ultima?.de === "negocio" ? "Você: " : ""}
                        {ultima?.texto}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {ultima ? (ultima.em.slice(0, 10) === hoje ? hourOf(ultima.em) : relativeDay(ultima.em.slice(0, 10))) : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Pipeline das ordens</h2>
          <button
            className="inline-flex items-center gap-1 text-sm font-semibold text-lime-deep"
            onClick={() => irParaOrdens("todas")}
          >
            Quadro <ArrowRight className="size-4" />
          </button>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-paper">
          {counts.map((c, i) =>
            c.n === 0 ? null : (
              <button
                key={c.status}
                title={`${c.nome}: ${c.n}`}
                onClick={() => irParaOrdens(c.status)}
                className={barra(i)}
                style={{ width: `${(c.n / Math.max(total, 1)) * 100}%` }}
              />
            ),
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {counts.map((c) => (
            <li key={c.status}>
              <button
                onClick={() => irParaOrdens(c.status)}
                className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink"
              >
                {c.nome} <span className="tabular-nums text-muted">{c.n}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Prioridades altas e urgentes aparecem em destaque no quadro.{" "}
          {ordens.filter((o) => o.prioridade === "urgente").length > 0 && (
            <span className={prioridadeChip("urgente") + " ml-1 rounded-full px-2 py-0.5"}>
              {PRIORIDADE_META.urgente}: {ordens.filter((o) => o.prioridade === "urgente").length}
            </span>
          )}
        </p>
      </section>
    </div>
  );
}

function barra(indice: number) {
  const cores = ["bg-lime", "bg-gold", "bg-olive", "bg-gold-soft", "bg-lime-deep", "bg-ink"];
  return cores[indice % cores.length];
}
