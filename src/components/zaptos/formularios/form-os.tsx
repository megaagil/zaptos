import { useState } from "react";
import { maskPhone } from "@/lib/zaptos/format";
import { PRIORIDADE_META, TIPO_META, conflitoHorario, textoConflito } from "@/lib/zaptos/meta";
import { useZaptos } from "@/lib/zaptos/store";
import type { Modal, Origem, Prioridade, TipoAtendimento } from "@/lib/zaptos/types";
import { cn } from "@/lib/utils";
import { Btn, Field, fieldClass } from "../ui";

export function FormOs({ modal }: { modal: Extract<Modal, { kind: "os" }> }) {
  const clientes = useZaptos((s) => s.clientes);
  const ordens = useZaptos((s) => s.ordens);
  const duracaoPadrao = useZaptos((s) => s.duracaoPadrao) || 60;
  const criarCliente = useZaptos((s) => s.criarCliente);
  const criarOrdem = useZaptos((s) => s.criarOrdem);
  const inicial = clientes.find((c) => c.id === modal.clienteId);
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [clienteId, setClienteId] = useState(inicial?.id ?? "");
  const [telefone, setTelefone] = useState(inicial?.telefone ?? "");
  const [listaAberta, setListaAberta] = useState(false);
  const [titulo, setTitulo] = useState(modal.titulo || "");
  const [descricao, setDescricao] = useState(modal.descricao || "");
  const [equipamento, setEquipamento] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [profissional, setProfissional] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<TipoAtendimento>("loja");
  const [origem, setOrigem] = useState<Origem>(modal.conversaId ? "whatsapp" : "balcao");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [duracao, setDuracao] = useState(String(duracaoPadrao));
  const [ciente, setCiente] = useState(false);
  const [avisar, setAvisar] = useState(Boolean(modal.conversaId));
  const [erro, setErro] = useState("");
  const termo = nome.trim().toLowerCase();
  const sugestoes =
    termo.length >= 3 ? clientes.filter((c) => c.nome.toLowerCase().includes(termo)).slice(0, 8) : [];
  const minutos = Math.floor(Number(duracao));
  const conflito =
    data && hora
      ? conflitoHorario(ordens, {
          data,
          hora,
          duracaoMin: minutos > 0 ? minutos : duracaoPadrao,
          profissional,
        })
      : null;

  function salvar() {
    if (!titulo.trim()) {
      setErro("Dê um nome para o serviço.");
      return;
    }
    if (!Number.isFinite(minutos) || minutos < 5) {
      setErro("Informe a duração em minutos.");
      return;
    }
    if (conflito && !ciente) {
      setCiente(true);
      setErro(textoConflito(conflito, clientes.find((c) => c.id === conflito.clienteId)?.nome));
      return;
    }
    let clienteIdFinal = "";
    const escolhido = clientes.find((c) => c.id === clienteId);
    if (escolhido && escolhido.nome.toLowerCase() === nome.trim().toLowerCase()) {
      clienteIdFinal = escolhido.id;
    } else {
      if (nome.trim().length < 2 || telefone.replace(/\D/g, "").length < 10) {
        setErro("Informe o nome e um telefone com DDD.");
        return;
      }
      clienteIdFinal = criarCliente({
        nome: nome.trim(),
        telefone,
        email: "",
        documento: "",
        endereco: "",
        notas: "",
      });
    }
    const n = Number(valor.replace(",", "."));
    criarOrdem({
      clienteId: clienteIdFinal,
      tecnicoId: "",
      profissional,
      titulo,
      descricao,
      equipamento,
      prioridade,
      valor: Number.isFinite(n) ? Math.max(0, n) : 0,
      tipo,
      origem,
      data,
      hora,
      duracaoMin: minutos,
      avisar,
      ignorarConflito: Boolean(conflito && ciente),
    });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <div>
        <Field label="Cliente">
          <input
            className={fieldClass}
            value={nome}
            autoComplete="off"
            placeholder="Nome do cliente"
            onChange={(e) => {
              const valor = e.target.value;
              setNome(valor);
              const exato = clientes.find((c) => c.nome.toLowerCase() === valor.trim().toLowerCase());
              if (exato) {
                setClienteId(exato.id);
                setTelefone(exato.telefone);
              } else {
                setClienteId("");
                setTelefone("");
              }
              setListaAberta(valor.trim().length >= 3);
            }}
            onFocus={() => setListaAberta(nome.trim().length >= 3)}
          />
        </Field>
        {listaAberta && sugestoes.length > 0 && (
          <ul className="mt-1 overflow-hidden rounded-xl border border-line bg-card">
            {sugestoes.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-lime-soft"
                  onClick={() => {
                    setNome(c.nome);
                    setClienteId(c.id);
                    setTelefone(c.telefone);
                    setListaAberta(false);
                  }}
                >
                  <span className="text-sm font-semibold">{c.nome}</span>
                  <span className="text-xs text-muted">{c.telefone}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!(clienteId && clientes.some((c) => c.id === clienteId && c.nome.toLowerCase() === nome.trim().toLowerCase())) && (
        <Field label="WhatsApp">
          <input
            className={fieldClass}
            inputMode="tel"
            value={telefone}
            onChange={(e) => setTelefone(maskPhone(e.target.value))}
            placeholder="(11) 90000-0000"
          />
        </Field>
      )}
      <Field label="Título">
        <input className={fieldClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Sessão individual, retorno, avaliação" />
      </Field>
      <Field label="Descrição do serviço">
        <textarea className={cn(fieldClass, "h-24 py-2")} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Serviço">
          <input className={fieldClass} value={equipamento} onChange={(e) => setEquipamento(e.target.value)} placeholder="Psicoterapia individual, online, casal" />
        </Field>
        <Field label="Valor (R$)">
          <input className={fieldClass} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Prioridade">
          <select className={fieldClass} value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
            {(Object.keys(PRIORIDADE_META) as Prioridade[]).map((p) => (
              <option key={p} value={p}>
                {PRIORIDADE_META[p]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Profissional">
          <input
            className={fieldClass}
            value={profissional}
            onChange={(e) => {
              setProfissional(e.target.value);
              setCiente(false);
            }}
            placeholder="Nome de quem atende"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Onde">
          <select className={fieldClass} value={tipo} onChange={(e) => setTipo(e.target.value as TipoAtendimento)}>
            {(Object.keys(TIPO_META) as TipoAtendimento[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_META[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duração (min)">
          <input
            type="number"
            min={5}
            className={fieldClass}
            value={duracao}
            onChange={(e) => {
              setDuracao(e.target.value);
              setCiente(false);
            }}
          />
        </Field>
        <Field label="Data">
          <input
            type="date"
            className={fieldClass}
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              setCiente(false);
            }}
          />
        </Field>
        <Field label="Hora">
          <input
            type="time"
            className={fieldClass}
            value={hora}
            onChange={(e) => {
              setHora(e.target.value);
              setCiente(false);
            }}
          />
        </Field>
      </div>
      <Field label="Origem">
        <select className={fieldClass} value={origem} onChange={(e) => setOrigem(e.target.value as Origem)}>
          <option value="whatsapp">WhatsApp</option>
          <option value="balcao">Balcão</option>
          <option value="telefone">Telefone</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-lime-deep" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} />
        Avisar o cliente no WhatsApp
      </label>
      {conflito && (
        <p className="rounded-xl bg-gold-soft px-3 py-2 text-sm font-semibold text-ink">
          {textoConflito(conflito, clientes.find((c) => c.id === conflito.clienteId)?.nome)}
        </p>
      )}
      {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
      <Btn type="submit" className="w-full">
        {conflito && ciente ? "Criar mesmo assim" : "Criar ordem"}
      </Btn>
    </form>
  );
}

