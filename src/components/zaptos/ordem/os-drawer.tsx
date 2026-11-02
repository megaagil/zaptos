import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { brDate, formatValor, hourOf, relativeDay } from "@/lib/zaptos/format";
import {
  ORIGEM_META,
  PRIORIDADE_META,
  TIPO_META,
} from "@/lib/zaptos/meta";
import { clienteDe, useZaptos } from "@/lib/zaptos/store";
import { cn } from "@/lib/utils";
import type { Prioridade, StatusOS } from "@/lib/zaptos/types";
import { Btn, fieldClass } from "../ui";

export function OsDrawer() {
  const id = useZaptos((s) => s.osAbertaId);
  const ordem = useZaptos((s) => s.ordens.find((o) => o.id === id));
  const clientes = useZaptos((s) => s.clientes);
  const colunas = useZaptos((s) => s.colunas);
  const setOs = useZaptos((s) => s.setOs);
  const moverStatus = useZaptos((s) => s.moverStatus);
  const atualizarOrdem = useZaptos((s) => s.atualizarOrdem);
  const addNota = useZaptos((s) => s.addNota);
  const enviarAviso = useZaptos((s) => s.enviarAviso);
  const abrirConversaCliente = useZaptos((s) => s.abrirConversaCliente);
  const abrirModal = useZaptos((s) => s.abrirModal);
  const setToast = useZaptos((s) => s.setToast);
  const [nota, setNota] = useState("");
  const [pendente, setPendente] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [valor, setValor] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [profissional, setProfissional] = useState("");

  useEffect(() => {
    const atual = useZaptos.getState().ordens.find((o) => o.id === id);
    setPendente(false);
    setConfirmar(false);
    setNota("");
    setValor(atual ? String(atual.valor || "") : "");
    setEquipamento(atual?.equipamento ?? "");
    setDescricao(atual?.descricao ?? "");
    setProfissional(atual?.profissional ?? "");
  }, [id]);

  if (!ordem) return null;
  const aberta = ordem;
  const cliente = clienteDe(clientes, aberta.clienteId);

  function salvar() {
    const n = Number(valor.replace(",", "."));
    atualizarOrdem(aberta.id, {
      profissional: profissional.trim(),
      equipamento: equipamento.trim(),
      descricao: descricao.trim(),
      valor: Number.isFinite(n) ? Math.max(0, n) : 0,
    });
    setToast("Ordem salva");
  }

  return (
    <div className="fixed inset-0 z-40">
      <button className="absolute inset-0 bg-ink/30" aria-label="Fechar detalhes" onClick={() => setOs(null)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-card">
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-4">
          <div>
            <p className="text-xs font-bold text-muted tabular-nums">{ordem.numero}</p>
            <h2 className="text-xl font-extrabold leading-tight">{ordem.titulo}</h2>
            <p className="text-sm text-muted">
              {cliente?.nome} · {ORIGEM_META[ordem.origem]}
            </p>
          </div>
          <button
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line"
            onClick={() => setOs(null)}
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {pendente && (
            <div className="rounded-2xl bg-lime-soft p-3">
              <p className="text-sm font-semibold">Avisar {cliente ? cliente.nome.split(" ")[0] : "o cliente"} no WhatsApp?</p>
              <div className="mt-2 flex gap-2">
                <Btn
                  className="h-9"
                  onClick={() => {
                    enviarAviso(ordem.id);
                    setPendente(false);
                  }}
                >
                  Enviar aviso
                </Btn>
                <Btn variant="ghost" className="h-9" onClick={() => setPendente(false)}>
                  Agora não
                </Btn>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Status</span>
              <select
                className={fieldClass}
                value={ordem.status}
                onChange={(e) => {
                  moverStatus(ordem.id, e.target.value as StatusOS, true);
                  setPendente(true);
                  setConfirmar(false);
                }}
              >
                {colunas.map((coluna) => (
                  <option key={coluna.id} value={coluna.id}>
                    {coluna.nome}
                  </option>
                ))}
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Prioridade</span>
              <select
                className={fieldClass}
                value={ordem.prioridade}
                onChange={(e) =>
                  atualizarOrdem(ordem.id, { prioridade: e.target.value as Prioridade })
                }
              >
                {(Object.keys(PRIORIDADE_META) as Prioridade[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORIDADE_META[p]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Profissional</span>
            <input
              className={fieldClass}
              value={profissional}
              placeholder="Nome de quem atende"
              onChange={(e) => setProfissional(e.target.value)}
              onBlur={() => {
                if (profissional.trim() !== (ordem.profissional ?? "")) {
                  atualizarOrdem(ordem.id, { profissional: profissional.trim() });
                }
              }}
            />
          </label>

          <div className="rounded-2xl border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted">Horário</p>
                {ordem.data ? (
                  <>
                    <p className="font-semibold">
                      {relativeDay(ordem.data)} · {brDate(ordem.data)} às {ordem.hora || "—"}
                    </p>
                    {ordem.duracaoMin ? <p className="font-semibold">{ordem.duracaoMin} min</p> : null}
                  </>
                ) : (
                  <p className="font-semibold">Ainda sem horário</p>
                )}
                <p className="text-sm text-muted">{TIPO_META[ordem.tipo]}</p>
              </div>
              <Btn
                variant="ghost"
                className="h-9"
                onClick={() =>
                  abrirModal({
                    kind: "agenda",
                    ordemId: ordem.id,
                    clienteId: ordem.clienteId,
                    data: ordem.data,
                    hora: ordem.hora || "09:00",
                    titulo: ordem.titulo,
                  })
                }
              >
                {ordem.data ? "Remarcar" : "Agendar"}
              </Btn>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Serviço</span>
            <input
              className={fieldClass}
              value={equipamento}
              placeholder="Psicoterapia individual, online, casal"
              onChange={(e) => setEquipamento(e.target.value)}
              onBlur={() => {
                if (equipamento.trim() !== ordem.equipamento) {
                  atualizarOrdem(ordem.id, { equipamento: equipamento.trim() });
                }
              }}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Descrição do serviço</span>
            <textarea
              className={cn(fieldClass, "h-28 py-2")}
              value={descricao}
              placeholder="O que precisa ser feito"
              onChange={(e) => setDescricao(e.target.value)}
              onBlur={() => {
                if (descricao.trim() !== ordem.descricao) {
                  atualizarOrdem(ordem.id, { descricao: descricao.trim() });
                }
              }}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Valor</span>
            <input
              inputMode="decimal"
              className={fieldClass}
              value={valor}
              placeholder="0"
              onChange={(e) => setValor(e.target.value)}
              onBlur={() => {
                const n = Number(valor.replace(",", "."));
                atualizarOrdem(ordem.id, { valor: Number.isFinite(n) ? Math.max(0, n) : 0 });
              }}
            />
            <span className="mt-1 block text-xs text-muted">{formatValor(ordem.valor)}</span>
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Histórico</p>
            <ul className="flex flex-col gap-2">
              {[...ordem.timeline].reverse().map((ev) => (
                <li key={ev.id} className="rounded-xl bg-paper px-3 py-2">
                  <p className="text-sm">{ev.texto}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {brDate(ev.em.slice(0, 10))} {hourOf(ev.em)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Nota interna"
                className={fieldClass}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNota(ordem.id, nota);
                    setNota("");
                  }
                }}
              />
              <Btn
                variant="ink"
                onClick={() => {
                  addNota(ordem.id, nota);
                  setNota("");
                }}
              >
                Anotar
              </Btn>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-line p-4">
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => enviarAviso(ordem.id)}>
              Avisar no WhatsApp
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => {
                if (!cliente) return;
                abrirConversaCliente(cliente.id);
                setOs(null);
              }}
            >
              Ver conversa
            </Btn>
          </div>
          <div className="flex items-center gap-2">
            <Btn className="flex-1" onClick={salvar}>
              Salvar
            </Btn>
            {confirmar ? (
              <Btn
                variant="danger"
                className="flex-1"
                onClick={() => {
                  moverStatus(ordem.id, "cancelada", true);
                  setConfirmar(false);
                  setPendente(true);
                }}
              >
                Confirmar cancelamento
              </Btn>
            ) : (
              ordem.status !== "cancelada" && (
                <button className="h-11 flex-1 text-sm font-semibold text-danger" onClick={() => setConfirmar(true)}>
                  Cancelar OS
                </button>
              )
            )}
          </div>
        </footer>
      </aside>
    </div>
  );
}
