import { useEffect, useState } from "react";
import { formatValor, horaFim, isLate } from "@/lib/zaptos/format";
import { PRIORIDADE_META, ehConcluida, emAberto, noPeriodo, prioridadeChip, tomBorder, tomChip } from "@/lib/zaptos/meta";
import { clienteDe, useZaptos } from "@/lib/zaptos/store";
import type { StatusOS } from "@/lib/zaptos/types";
import { cn } from "@/lib/utils";
import { Chip } from "../ui";

export function Ordens() {
  const ordens = useZaptos((s) => s.ordens);
  const colunas = useZaptos((s) => s.colunas);
  const clientes = useZaptos((s) => s.clientes);
  const filtro = useZaptos((s) => s.ordensFiltro);
  const exibirConcluidas = useZaptos((s) => s.exibirConcluidas);
  const diasPipeline = useZaptos((s) => s.diasPipeline);
  const setFiltro = useZaptos((s) => s.setFiltro);
  const setExibirConcluidas = useZaptos((s) => s.setExibirConcluidas);
  const setDiasPipeline = useZaptos((s) => s.setDiasPipeline);
  const moverStatus = useZaptos((s) => s.moverStatus);
  const setOs = useZaptos((s) => s.setOs);
  const abrirModal = useZaptos((s) => s.abrirModal);
  const [q, setQ] = useState("");
  const [podeArrastar, setPodeArrastar] = useState(false);

  useEffect(() => {
    setPodeArrastar(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const termo = q.trim().toLowerCase();
  const base = ordens.filter((o) => {
    if (!noPeriodo(o.criadoEm, diasPipeline)) return false;
    if (!exibirConcluidas && ehConcluida(o.status)) return false;
    if (o.status === "cancelada" && filtro !== "todas") return false;
    if (filtro === "abertas") return emAberto(o.status);
    if (filtro !== "todas" && o.status !== filtro) return false;
    if (!termo) return true;
    const nome = clienteDe(clientes, o.clienteId)?.nome.toLowerCase() ?? "";
    return (
      o.numero.toLowerCase().includes(termo) ||
      o.titulo.toLowerCase().includes(termo) ||
      nome.includes(termo) ||
      o.equipamento.toLowerCase().includes(termo)
    );
  });

  const modoColuna = filtro === "todas";
  const colunasVisiveis = exibirConcluidas ? colunas : colunas.filter((c) => !ehConcluida(c.id));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold lg:text-3xl">Ordens de serviço</h1>
          <p className="text-sm text-muted">Arraste o card da OS entre as colunas para atualizar o status.</p>
        </div>
        <button
          className="h-11 rounded-xl bg-lime px-4 text-sm font-semibold text-ink"
          onClick={() => abrirModal({ kind: "os" })}
        >
          Nova OS
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar por cliente, OS ou serviço"
          className="h-11 flex-1 rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-lime-deep"
          aria-label="Filtrar ordens"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as typeof filtro)}
          className="h-11 rounded-xl border border-line bg-card px-3 text-base"
          aria-label="Filtrar por status"
        >
          <option value="todas">Todos os estágios</option>
          <option value="abertas">Só em aberto</option>
          {colunas.map((coluna) => (
            <option key={coluna.id} value={coluna.id}>
              {coluna.nome}
            </option>
          ))}
        </select>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="size-4 accent-lime-deep"
            checked={exibirConcluidas}
            onChange={(e) => setExibirConcluidas(e.target.checked)}
          />
          Exibir concluídas
          <span className="text-muted">{exibirConcluidas ? "Sim" : "Não"}</span>
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm font-semibold">
          Últimos
          <input
            type="number"
            min={1}
            inputMode="numeric"
            aria-label="Dias da pipeline"
            value={diasPipeline}
            onChange={(e) => setDiasPipeline(Number(e.target.value))}
            className="h-8 w-16 rounded-lg border border-line bg-paper px-2 text-base tabular-nums outline-none focus:border-lime-deep"
          />
          dias
        </label>
      </div>

      {modoColuna ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {colunasVisiveis.map((coluna) => {
            const status = coluna.id;
            const lista = base.filter((o) => o.status === status);
            return (
              <section
                key={status}
                className="w-72 shrink-0"
                onDragOver={(e) => {
                  if (podeArrastar) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moverStatus(id, status);
                }}
              >
                <header className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-extrabold">{coluna.nome}</h2>
                  <span className="text-sm font-semibold text-muted tabular-nums">{lista.length}</span>
                </header>
                <div className="flex min-h-40 flex-col gap-2">
                  {lista.map((o) => (
                    <CardOS
                      key={o.id}
                      id={o.id}
                      numero={o.numero}
                      titulo={o.titulo}
                      cliente={clienteDe(clientes, o.clienteId)?.nome ?? ""}
                      equipamento={o.equipamento}
                      prioridade={o.prioridade}
                      valor={o.valor}
                      hora={o.hora}
                      duracaoMin={o.duracaoMin}
                      data={o.data}
                      status={o.status}
                      tom={o.profissional ? "lime" : undefined}
                      tecnico={o.profissional?.split(" ")[0] || "Sem profissional"}
                      arrastar={podeArrastar}
                      onOpen={() => setOs(o.id)}
                    />
                  ))}
                  {lista.length === 0 && (
                    <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                      Nenhuma
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {base.length === 0 && (
            <li className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              Nenhuma ordem nesse filtro.
            </li>
          )}
          {base.map((o) => (
            <li key={o.id}>
              <CardOS
                id={o.id}
                numero={o.numero}
                titulo={o.titulo}
                cliente={clienteDe(clientes, o.clienteId)?.nome ?? ""}
                equipamento={o.equipamento}
                prioridade={o.prioridade}
                valor={o.valor}
                hora={o.hora}
                duracaoMin={o.duracaoMin}
                data={o.data}
                status={o.status}
                tom={o.profissional ? "lime" : undefined}
                tecnico={o.profissional?.split(" ")[0] || "Sem profissional"}
                arrastar={false}
                onOpen={() => setOs(o.id)}
                largo
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CardOS({
  id,
  numero,
  titulo,
  cliente,
  equipamento,
  prioridade,
  valor,
  hora,
  duracaoMin,
  data,
  status,
  tom,
  tecnico,
  arrastar,
  onOpen,
  largo,
}: {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  equipamento: string;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  valor: number;
  hora: string;
  duracaoMin: number;
  data: string;
  status: StatusOS;
  tom: "lime" | "gold" | "olive" | undefined;
  tecnico: string;
  arrastar: boolean;
  onOpen: () => void;
  largo?: boolean;
}) {
  const atrasado = isLate(data, hora, status);
  return (
    <article
      draggable={arrastar}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "rounded-2xl border border-line border-l-4 bg-card p-3",
        tomBorder(tom),
        arrastar && "cursor-grab",
        largo && "flex flex-wrap items-center gap-3",
      )}
    >
      <button onClick={onOpen} className={cn("w-full text-left", largo && "min-w-0 flex-1")}>
        <span className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-muted tabular-nums">{numero}</span>
          <Chip className={prioridadeChip(prioridade)}>{PRIORIDADE_META[prioridade]}</Chip>
        </span>
        <span className="mt-1 block font-semibold leading-snug">{titulo}</span>
        <span className="mt-0.5 block text-sm text-muted">
          {cliente}
          {equipamento ? ` · ${equipamento}` : ""}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-2">
          {tom && <Chip className={tomChip(tom)}>{tecnico}</Chip>}
          {!tom && <Chip className="bg-paper text-muted">{tecnico}</Chip>}
          {atrasado && <Chip className="bg-gold-soft text-ink">Atrasado</Chip>}
          {data && hora && (
            <span className="text-xs text-muted tabular-nums">
              {hora}
              {horaFim(hora, duracaoMin) ? ` – ${horaFim(hora, duracaoMin)}` : ""}
            </span>
          )}
          <span className="ml-auto text-sm font-bold tabular-nums">{formatValor(valor)}</span>
        </span>
      </button>
    </article>
  );
}
