import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { hourOf, relativeDay } from "@/lib/zaptos/format";
import { sugerirFrase, sugerirTitulo } from "@/lib/zaptos/meta";
import { clienteDe, useZaptos } from "@/lib/zaptos/store";
import { cn } from "@/lib/utils";
import { Btn } from "../ui";

const RAPIDAS = [
  "Olá, posso te ajudar a marcar um horário.",
  "Tenho horário nesta semana. Qual dia fica melhor?",
  "A sessão pode ser online ou no consultório.",
  "Sua sessão está confirmada. Qualquer coisa, me chame aqui.",
];

export function Inbox() {
  const conversas = useZaptos((s) => s.conversas);
  const clientes = useZaptos((s) => s.clientes);
  const ativaId = useZaptos((s) => s.conversaAtivaId);
  const setConversa = useZaptos((s) => s.setConversa);
  const enviarMensagem = useZaptos((s) => s.enviarMensagem);
  const abrirModal = useZaptos((s) => s.abrirModal);
  const negocio = useZaptos((s) => s.negocio);
  const [texto, setTexto] = useState("");
  const fim = useRef<HTMLDivElement>(null);

  const ordenadas = [...conversas].sort((a, b) =>
    (b.mensagens.at(-1)?.em ?? "").localeCompare(a.mensagens.at(-1)?.em ?? ""),
  );
  const ativa = conversas.find((c) => c.id === ativaId) ?? null;
  const cliente = ativa ? clienteDe(clientes, ativa.clienteId) : undefined;
  const ultimaCliente = [...(ativa?.mensagens ?? [])].reverse().find((m) => m.de === "cliente");
  const sugestao = ultimaCliente ? sugerirFrase(ultimaCliente.texto) : null;

  useEffect(() => {
    if (ativaId || ordenadas.length === 0) return;
    if (window.matchMedia("(min-width: 768px)").matches) {
      setConversa(ordenadas[0].id);
    }
  }, [ativaId, ordenadas, setConversa]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [ativa?.id, ativa?.mensagens.length]);

  useEffect(() => {
    if (ativa && ativa.naoLidas > 0) {
      useZaptos.getState().marcarLidas(ativa.id);
    }
  }, [ativa?.id, ativa?.naoLidas]);

  function enviar() {
    if (!ativa) return;
    enviarMensagem(ativa.id, texto);
    setTexto("");
  }

  return (
    <div className="flex h-full min-h-0">
      <aside
        className={cn(
          "flex w-full min-w-0 flex-col border-r border-line bg-card md:w-80 md:shrink-0",
          ativa && "hidden md:flex",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h1 className="text-lg font-extrabold">Conversas</h1>
            {negocio.whatsapp ? (
              <p className="text-xs text-muted">WhatsApp {negocio.whatsapp}</p>
            ) : null}
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {ordenadas.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted">Nenhuma conversa ainda.</li>
          )}
          {ordenadas.map((c) => {
            const pessoa = clienteDe(clientes, c.clienteId);
            const ultima = c.mensagens.at(-1);
            const selecionada = c.id === ativa?.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setConversa(c.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-line px-4 py-3 text-left",
                    selecionada ? "bg-lime-soft" : "hover:bg-paper",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{pessoa?.nome}</span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {ultima ? hourOf(ultima.em) : ""}
                    </span>
                  </span>
                  <span className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm text-muted">
                      {ultima?.de === "negocio" ? "Você: " : ""}
                      {ultima?.texto ?? "Sem mensagens"}
                    </span>
                    {c.naoLidas > 0 && (
                      <span className="mt-0.5 rounded-full bg-lime px-1.5 text-xs font-bold text-ink tabular-nums">
                        {c.naoLidas}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className={cn("flex min-w-0 flex-1 flex-col bg-paper", !ativa && "hidden md:flex")}>
        {!ativa || !cliente ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-lg font-extrabold">Nenhuma conversa ainda</p>
            <p className="max-w-sm text-sm text-muted">
              Quando um cliente escrever, a conversa entra aqui, da mais recente para a mais antiga.
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-line bg-card px-3 py-3">
              <button
                className="inline-flex size-11 items-center justify-center rounded-xl md:hidden"
                onClick={() => setConversa(null)}
                aria-label="Voltar para a lista"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{cliente.nome}</p>
                <p className="truncate text-xs text-muted">
                  {cliente.telefone}
                  {cliente.endereco ? ` · ${cliente.endereco}` : ""}
                </p>
              </div>
              <Btn
                variant="ghost"
                className="h-9 px-3 text-xs"
                onClick={() =>
                  abrirModal({
                    kind: "os",
                    clienteId: cliente.id,
                    conversaId: ativa.id,
                    titulo: ultimaCliente ? sugerirTitulo(ultimaCliente.texto) : "Atendimento via WhatsApp",
                    descricao: ultimaCliente?.texto ?? "",
                  })
                }
              >
                Gerar OS
              </Btn>
            </header>

            {sugestao && (
              <div className="flex flex-wrap items-center gap-2 border-b border-line bg-gold-soft px-3 py-2">
                <p className="text-sm font-semibold">Sugestão: {sugestao}</p>
                <button
                  className="text-sm font-semibold underline"
                  onClick={() =>
                    abrirModal({
                      kind: "agenda",
                      clienteId: cliente.id,
                      conversaId: ativa.id,
                      titulo: sugerirTitulo(ultimaCliente?.texto ?? ""),
                      data: "",
                      hora: "09:00",
                    })
                  }
                >
                  Agendar
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
              <Mensagens mensagens={ativa.mensagens} />
              <div ref={fim} />
            </div>

            <div className="border-t border-line bg-card p-3">
              <div className="mb-2 flex min-w-0 gap-2 overflow-x-auto">
                {RAPIDAS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setTexto(r)}
                    className="shrink-0 rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  rows={2}
                  placeholder={`Responder ${cliente.nome.split(" ")[0]} · Ctrl + Enter envia`}
                  className="min-h-11 flex-1 resize-none rounded-xl border border-line bg-paper px-3 py-2 text-base outline-none focus:border-lime-deep"
                />
                <button
                  onClick={enviar}
                  disabled={!texto.trim()}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime text-ink disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Mensagens({ mensagens }: { mensagens: { id: string; de: "cliente" | "negocio"; texto: string; em: string }[] }) {
  let dia = "";
  return (
    <>
      {mensagens.map((m) => {
        const chave = m.em.slice(0, 10);
        const mostraDia = chave !== dia;
        dia = chave;
        return (
          <div key={m.id}>
            {mostraDia && (
              <p className="my-2 text-center text-xs font-semibold text-muted">{relativeDay(chave)}</p>
            )}
            <div className={cn("flex", m.de === "negocio" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  m.de === "negocio" ? "rounded-br-sm bg-lime-soft text-ink" : "rounded-bl-sm border border-line bg-card text-ink",
                )}
              >
                {m.texto}
                <span className="mt-1 block text-right text-xs text-muted tabular-nums">{hourOf(m.em)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
