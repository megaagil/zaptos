import { useState } from "react";
import { maskPhone, todayKey } from "@/lib/zaptos/format";
import { TIPO_META, conflitoHorario, textoConflito } from "@/lib/zaptos/meta";
import { useZaptos } from "@/lib/zaptos/store";
import type { Modal, TipoAtendimento } from "@/lib/zaptos/types";
import { cn } from "@/lib/utils";
import { Btn, Field, fieldClass } from "../ui";

export function FormAgenda({ modal }: { modal: Extract<Modal, { kind: "agenda" }> }) {
  const clientes = useZaptos((s) => s.clientes);
  const ordens = useZaptos((s) => s.ordens);
  const duracaoPadrao = useZaptos((s) => s.duracaoPadrao) || 60;
  const ordem = ordens.find((o) => o.id === modal.ordemId);
  const criarCliente = useZaptos((s) => s.criarCliente);
  const criarOrdem = useZaptos((s) => s.criarOrdem);
  const agendar = useZaptos((s) => s.agendar);
  const [quem, setQuem] = useState(modal.clienteId || ordem?.clienteId || clientes[0]?.id || "__novo__");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [titulo, setTitulo] = useState(modal.titulo || ordem?.titulo || "");
  const [data, setData] = useState(modal.data || ordem?.data || todayKey());
  const [hora, setHora] = useState(modal.hora || ordem?.hora || "09:00");
  const [tipo, setTipo] = useState<TipoAtendimento>(ordem?.tipo || "loja");
  const [profissional, setProfissional] = useState(ordem?.profissional || "");
  const [duracao, setDuracao] = useState(String(ordem?.duracaoMin || duracaoPadrao));
  const [ciente, setCiente] = useState(false);
  const [avisar, setAvisar] = useState(true);
  const [erro, setErro] = useState("");
  const minutos = Math.floor(Number(duracao));
  const conflito =
    data && hora
      ? conflitoHorario(ordens, {
          id: ordem?.id,
          data,
          hora,
          duracaoMin: minutos > 0 ? minutos : duracaoPadrao,
          profissional,
        })
      : null;

  function salvar() {
    if (!data || !hora) {
      setErro("Escolha data e hora.");
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
    if (ordem) {
      agendar(ordem.id, {
        data,
        hora,
        duracaoMin: minutos,
        tipo,
        profissional,
        avisar,
        ignorarConflito: Boolean(conflito && ciente),
      });
      return;
    }
    if (!titulo.trim()) {
      setErro("Diga qual é o serviço.");
      return;
    }
    let clienteId = quem;
    if (quem === "__novo__") {
      if (nome.trim().length < 2 || telefone.replace(/\D/g, "").length < 10) {
        setErro("Informe o nome e um telefone com DDD.");
        return;
      }
      clienteId = criarCliente({
        nome: nome.trim(),
        telefone,
        email: "",
        documento: "",
        endereco: "",
        notas: "",
      });
    }
    criarOrdem({
      clienteId,
      tecnicoId: "",
      profissional,
      titulo,
      descricao: "",
      equipamento: "",
      prioridade: "media",
      valor: 0,
      tipo,
      origem: modal.conversaId ? "whatsapp" : "balcao",
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
      {ordem ? (
        <p className="rounded-xl bg-paper px-3 py-2 text-sm font-semibold">{ordem.numero} · {ordem.titulo}</p>
      ) : (
        <>
          <Field label="Cliente">
            <select className={fieldClass} value={quem} onChange={(e) => setQuem(e.target.value)}>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
              <option value="__novo__">Cliente novo</option>
            </select>
          </Field>
          {quem === "__novo__" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <input className={fieldClass} value={nome} onChange={(e) => setNome(e.target.value)} />
              </Field>
              <Field label="WhatsApp">
                <input className={fieldClass} inputMode="tel" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} />
              </Field>
            </div>
          )}
          <Field label="Serviço">
            <input className={fieldClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Sessão, retorno, avaliação" />
          </Field>
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Data">
          <input
            type="date"
            required
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
            required
            className={fieldClass}
            value={hora}
            onChange={(e) => {
              setHora(e.target.value);
              setCiente(false);
            }}
          />
        </Field>
        <Field label="Duração (min)">
          <input
            type="number"
            min={5}
            required
            className={fieldClass}
            value={duracao}
            onChange={(e) => {
              setDuracao(e.target.value);
              setCiente(false);
            }}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <select className={fieldClass} value={tipo} onChange={(e) => setTipo(e.target.value as TipoAtendimento)}>
            {(Object.keys(TIPO_META) as TipoAtendimento[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_META[t]}
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-lime-deep" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} />
        Confirmar pelo WhatsApp
      </label>
      {conflito && (
        <p className="rounded-xl bg-gold-soft px-3 py-2 text-sm font-semibold text-ink">
          {textoConflito(conflito, clientes.find((c) => c.id === conflito.clienteId)?.nome)}
        </p>
      )}
      {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
      <Btn type="submit" className="w-full">
        {conflito && ciente ? "Agendar mesmo assim" : "Salvar horário"}
      </Btn>
    </form>
  );
}

