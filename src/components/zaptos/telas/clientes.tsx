import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatValor } from "@/lib/zaptos/format";
import { emAberto, nomeStatus } from "@/lib/zaptos/meta";
import { useZaptos } from "@/lib/zaptos/store";
import { Btn, Chip } from "../ui";

export function Clientes() {
  const clientes = useZaptos((s) => s.clientes);
  const ordens = useZaptos((s) => s.ordens);
  const colunas = useZaptos((s) => s.colunas);
  const foco = useZaptos((s) => s.clienteFocoId);
  const setClienteFoco = useZaptos((s) => s.setClienteFoco);
  const abrirModal = useZaptos((s) => s.abrirModal);
  const setOs = useZaptos((s) => s.setOs);
  const abrirConversaCliente = useZaptos((s) => s.abrirConversaCliente);
  const [q, setQ] = useState("");

  const lista = useMemo(() => {
    const termo = q.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");
    return clientes.filter((c) => {
      if (!termo) return true;
      return (
        c.nome.toLowerCase().includes(termo) ||
        c.telefone.toLowerCase().includes(termo) ||
        c.documento.toLowerCase().includes(termo) ||
        (digitos.length > 2 && c.telefone.replace(/\D/g, "").includes(digitos))
      );
    });
  }, [clientes, q]);

  const ativo = clientes.find((c) => c.id === foco) ?? null;
  const osDoCliente = ativo ? ordens.filter((o) => o.clienteId === ativo.id) : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold lg:text-3xl">Clientes</h1>
          <p className="text-sm text-muted">Quem chama no WhatsApp e quem entra na loja.</p>
        </div>
        <Btn onClick={() => abrirModal({ kind: "cliente" })}>Novo cliente</Btn>
      </div>

      <div className={ativo ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}>
        <section className={ativo ? "hidden lg:block" : ""}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome, telefone ou CNPJ"
            aria-label="Buscar clientes"
            className="mb-3 h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-lime-deep"
          />
          <ul className="overflow-hidden rounded-2xl border border-line bg-card">
            {lista.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Nenhum cliente.</li>}
            {lista.map((c) => {
              const abertas = ordens.filter((o) => o.clienteId === c.id && emAberto(o.status)).length;
              return (
                <li key={c.id} className="border-b border-line last:border-b-0">
                  <button
                    onClick={() => setClienteFoco(c.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-lime-soft"
                  >
                    <span>
                      <span className="block font-semibold">{c.nome}</span>
                      <span className="text-sm text-muted">{c.telefone}</span>
                    </span>
                    <span className="text-right text-xs text-muted">
                      {abertas > 0 ? `${abertas} em aberto` : "Sem OS aberta"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {ativo && (
          <section className="rounded-2xl border border-line bg-card p-4">
            <button
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted lg:hidden"
              onClick={() => setClienteFoco(null)}
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">{ativo.nome}</h2>
                <p className="text-sm text-muted">{ativo.telefone}</p>
              </div>
              <button
                className="text-sm font-semibold text-muted"
                onClick={() => setClienteFoco(null)}
              >
                Fechar
              </button>
            </div>
            {ativo.email && <p className="text-sm text-muted">{ativo.email}</p>}
            {ativo.documento && <p className="text-sm text-muted">{ativo.documento}</p>}
            {ativo.endereco && <p className="mt-2 text-sm">{ativo.endereco}</p>}
            {ativo.notas && <p className="mt-2 rounded-xl bg-paper px-3 py-2 text-sm">{ativo.notas}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn
                onClick={() => abrirModal({ kind: "os", clienteId: ativo.id })}
              >
                Nova OS
              </Btn>
              <Btn
                variant="ghost"
                onClick={() =>
                  abrirModal({ kind: "agenda", clienteId: ativo.id, titulo: "Atendimento", hora: "09:00" })
                }
              >
                Agendar
              </Btn>
              <Btn variant="ghost" onClick={() => abrirConversaCliente(ativo.id)}>
                WhatsApp
              </Btn>
              <Btn variant="ghost" onClick={() => abrirModal({ kind: "cliente", clienteId: ativo.id })}>
                Editar
              </Btn>
            </div>
            <h3 className="mt-6 text-sm font-extrabold text-muted">Ordens</h3>
            <ul className="mt-2 flex flex-col">
              {osDoCliente.length === 0 && <li className="text-sm text-muted">Nenhuma ordem ainda.</li>}
              {osDoCliente.map((o) => (
                <li key={o.id} className="border-t border-line">
                  <button onClick={() => setOs(o.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                    <span>
                      <span className="block font-semibold">{o.titulo}</span>
                      <span className="text-xs text-muted">{o.numero}</span>
                    </span>
                    <span className="text-right">
                      <Chip className="bg-paper text-ink">{nomeStatus(colunas, o.status)}</Chip>
                      <span className="mt-1 block text-xs font-semibold tabular-nums">{formatValor(o.valor)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
