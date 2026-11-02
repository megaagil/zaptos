import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  MessageSquarePlus,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/zaptos/types";
import { clienteDe, useZaptos } from "@/lib/zaptos/store";
import { Agenda } from "./telas/agenda";
import { Clientes } from "./telas/clientes";
import { Configuracoes } from "./telas/configuracoes";
import { Inbox } from "./telas/inbox";
import { Modals } from "./modals";
import { Ordens } from "./telas/ordens";
import { OsDrawer } from "./ordem/os-drawer";
import { Painel } from "./telas/painel";
import { Btn } from "./ui";

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "painel", label: "Painel", icon: LayoutDashboard },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "ordens", label: "Ordens", icon: ClipboardList },
  { id: "whatsapp", label: "Conversas", icon: MessageCircle },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

export function Shell({ onSair }: { onSair: () => void }) {
  const view = useZaptos((s) => s.view);
  const setView = useZaptos((s) => s.setView);
  const negocio = useZaptos((s) => s.negocio);
  const simularEntrada = useZaptos((s) => s.simularEntrada);
  const conversas = useZaptos((s) => s.conversas);
  const clientes = useZaptos((s) => s.clientes);
  const ordens = useZaptos((s) => s.ordens);
  const abrirModal = useZaptos((s) => s.abrirModal);
  const setOs = useZaptos((s) => s.setOs);
  const setClienteFoco = useZaptos((s) => s.setClienteFoco);
  const osAbertaId = useZaptos((s) => s.osAbertaId);
  const modal = useZaptos((s) => s.modal);
  const toast = useZaptos((s) => s.toast);
  const setToast = useZaptos((s) => s.setToast);
  const [busca, setBusca] = useState("");
  const [focado, setFocado] = useState(false);

  const naoLidas = conversas.reduce((sum, c) => sum + c.naoLidas, 0);
  const overlay = Boolean(osAbertaId || modal);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast, setToast]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (modal) useZaptos.getState().fecharModal();
      else if (osAbertaId) setOs(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, osAbertaId, setOs]);

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 2) return { clientes: [], ordens: [] };
    const digitos = q.replace(/\D/g, "");
    return {
      clientes: clientes
        .filter((c) => {
          const fone = c.telefone.replace(/\D/g, "");
          return (
            c.nome.toLowerCase().includes(q) ||
            c.telefone.toLowerCase().includes(q) ||
            (digitos.length > 2 && fone.includes(digitos))
          );
        })
        .slice(0, 4),
      ordens: ordens
        .filter((o) => {
          const nome = clienteDe(clientes, o.clienteId)?.nome.toLowerCase() ?? "";
          return (
            o.numero.toLowerCase().includes(q) ||
            o.titulo.toLowerCase().includes(q) ||
            nome.includes(q)
          );
        })
        .slice(0, 4),
    };
  }, [busca, clientes, ordens]);

  const mostrarBusca = focado && busca.trim().length >= 2;

  return (
    <div className="flex h-dvh bg-paper text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-card lg:flex">
        <div className="flex items-center gap-3 px-4 py-5">
          <img src={logo} alt="" className="size-12" />
          <div>
            <p className="text-xl font-extrabold leading-none tracking-tight text-ink">
              Zapt<span className="text-lime-deep">OS</span>
            </p>
            <p className="mt-1 text-xs text-muted">Agenda e OS no WhatsApp</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              ativo={view === item.id}
              badge={item.id === "whatsapp" ? naoLidas : 0}
              onClick={() => setView(item.id)}
            />
          ))}
        </nav>
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={simularEntrada}
            className="flex h-11 w-full items-center gap-3 rounded-xl bg-lime px-3 text-sm font-semibold text-ink hover:bg-lime-deep hover:text-paper"
          >
            <MessageSquarePlus className="size-5" />
            Simular atendimento
          </button>
        </div>
        <div className="border-t border-line p-4">
          <p className="text-xs font-semibold text-muted">Negócio</p>
          <p className="mt-1 text-sm font-semibold">{negocio.nome || "Seu negócio"}</p>
          <p className="mt-1 text-xs text-muted">
            {negocio.vinculado ? "WhatsApp vinculado" : "WhatsApp não vinculado"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex items-center gap-3 border-b border-line bg-card px-3 py-3 lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="" className="size-9" />
            <span className="font-extrabold tracking-tight">
              Zapt<span className="text-lime-deep">OS</span>
            </span>
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              placeholder="Buscar cliente, OS ou telefone"
              className="h-11 w-full rounded-xl border border-line bg-paper pr-3 pl-10 text-base text-ink outline-none placeholder:text-muted focus:border-lime-deep focus:ring-2 focus:ring-lime-soft"
              aria-label="Buscar"
            />
            {mostrarBusca && (
              <div className="absolute top-12 right-0 left-0 z-30 overflow-hidden rounded-xl border border-line bg-card shadow-lg">
                {resultados.clientes.length === 0 && resultados.ordens.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-muted">Nada encontrado.</p>
                ) : (
                  <ul>
                    {resultados.clientes.map((c) => (
                      <li key={c.id}>
                        <button
                          className="flex w-full flex-col px-3 py-2 text-left hover:bg-lime-soft"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setClienteFoco(c.id);
                            setBusca("");
                          }}
                        >
                          <span className="text-sm font-semibold">{c.nome}</span>
                          <span className="text-xs text-muted">{c.telefone}</span>
                        </button>
                      </li>
                    ))}
                    {resultados.ordens.map((o) => (
                      <li key={o.id}>
                        <button
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-lime-soft"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setOs(o.id);
                            setBusca("");
                          }}
                        >
                          <span>
                            <span className="text-sm font-semibold">{o.numero}</span>
                            <span className="mt-0.5 block text-xs text-muted">{o.titulo}</span>
                          </span>
                          <span className="text-xs text-muted">
                            {clienteDe(clientes, o.clienteId)?.nome}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <Btn onClick={() => abrirModal({ kind: "os" })} className="shrink-0 px-3">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova OS</span>
          </Btn>
          <button
            type="button"
            onClick={onSair}
            className="h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-muted hover:text-ink"
          >
            Sair
          </button>
        </header>

        <main
          className={cn(
            "min-h-0 min-w-0 flex-1",
            view === "whatsapp" ? "overflow-hidden" : "overflow-y-auto px-4 py-4 lg:px-8 lg:py-6",
          )}
        >
          {view === "painel" && <Painel />}
          {view === "agenda" && <Agenda />}
          {view === "ordens" && <Ordens />}
          {view === "whatsapp" && <Inbox />}
          {view === "clientes" && <Clientes />}
          {view === "configuracoes" && <Configuracoes />}
        </main>

        <button
          type="button"
          onClick={simularEntrada}
          className={cn(
            "flex h-11 shrink-0 items-center justify-center gap-2 bg-lime text-sm font-semibold text-ink lg:hidden",
            overlay && "hidden",
          )}
        >
          <MessageSquarePlus className="size-4" />
          Simular atendimento
        </button>
        <nav
          className={cn(
            "flex shrink-0 overflow-x-auto border-t border-line bg-card lg:hidden",
            overlay && "hidden",
          )}
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const ativo = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "relative flex min-h-14 min-w-16 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center text-xs font-semibold leading-tight",
                  ativo ? "text-lime-deep" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {item.label}
                {item.id === "whatsapp" && naoLidas > 0 && (
                  <span className="absolute top-1 right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-xs font-bold text-ink tabular-nums">
                    {naoLidas}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <OsDrawer />
      <Modals />
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <p className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper shadow-lg">
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}

function NavButton({
  item,
  ativo,
  badge,
  onClick,
}: {
  item: (typeof NAV)[number];
  ativo: boolean;
  badge: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold",
        ativo ? "bg-lime-soft text-ink" : "text-muted hover:bg-paper hover:text-ink",
      )}
    >
      <Icon className="size-5" />
      <span className="flex-1 text-left">{item.label}</span>
      {badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1 text-xs font-bold text-ink tabular-nums">
          {badge}
        </span>
      )}
    </button>
  );
}
