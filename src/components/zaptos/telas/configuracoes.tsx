import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { consultarCep, UFS } from "@/lib/zaptos/cep";
import { maskCep, maskPhone, uid } from "@/lib/zaptos/format";
import { COLUNAS_PADRAO, erroColunas } from "@/lib/zaptos/meta";
import { useZaptos } from "@/lib/zaptos/store";
import type { Coluna, Negocio } from "@/lib/zaptos/types";
import { cn } from "@/lib/utils";
import { Btn, Field, fieldClass } from "../ui";

function normalizar(n: Partial<Negocio> & { endereco?: string }): Negocio {
  return {
    nome: n.nome ?? "",
    segmento: n.segmento ?? "",
    cep: n.cep ?? "",
    logradouro: n.logradouro || n.endereco || "",
    numero: n.numero ?? "",
    complemento: n.complemento ?? "",
    bairro: n.bairro ?? "",
    cidade: n.cidade ?? "",
    estado: n.estado ?? "",
    whatsapp: n.whatsapp ?? "",
    wabaId: n.wabaId ?? "",
    phoneNumberId: n.phoneNumberId ?? "",
    token: n.token ?? "",
    webhookToken: n.webhookToken ?? "",
    vinculado: Boolean(n.vinculado),
  };
}

export function Configuracoes() {
  const negocio = useZaptos((s) => s.negocio);
  const colunasSalvas = useZaptos((s) => s.colunas);
  const ordens = useZaptos((s) => s.ordens);
  const salvarConfiguracao = useZaptos((s) => s.salvarConfiguracao);
  const duracaoAtual = useZaptos((s) => s.duracaoPadrao) || 60;
  const [form, setForm] = useState(() => normalizar(negocio));
  const [duracao, setDuracao] = useState(String(duracaoAtual));
  const [colunas, setColunas] = useState<Coluna[]>(() =>
    colunasSalvas.length ? colunasSalvas.map((c) => ({ ...c })) : COLUNAS_PADRAO.map((c) => ({ ...c })),
  );
  const [erro, setErro] = useState("");
  const [cepAviso, setCepAviso] = useState("");
  const cepConsultado = useRef("");

  function set<K extends keyof Negocio>(chave: K, valor: Negocio[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function aoDigitarCep(valor: string) {
    const cep = maskCep(valor);
    set("cep", cep);
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length < 8) {
      cepConsultado.current = "";
      setCepAviso("");
      return;
    }
    if (cepConsultado.current === digitos) return;
    cepConsultado.current = digitos;
    setCepAviso("Consultando o Google Maps…");
    try {
      const endereco = await consultarCep(digitos);
      setForm((atual) => ({
        ...atual,
        cep: maskCep(digitos),
        logradouro: endereco.logradouro || atual.logradouro,
        numero: endereco.numero || atual.numero,
        bairro: endereco.bairro || atual.bairro,
        cidade: endereco.cidade || atual.cidade,
        estado: endereco.estado || atual.estado,
      }));
      setCepAviso("Endereço preenchido pelo Google Maps.");
    } catch (falha) {
      setCepAviso(falha instanceof Error ? falha.message : "Não foi possível consultar o Google Maps.");
    }
  }

  function prontoParaVincular() {
    return (
      form.nome.trim().length > 1 &&
      form.whatsapp.replace(/\D/g, "").length >= 10 &&
      form.wabaId.trim().length > 0 &&
      form.phoneNumberId.trim().length > 0 &&
      form.token.trim().length > 0
    );
  }

  function salvar(vincular: boolean) {
    if (vincular && !prontoParaVincular()) {
      setErro("Para vincular, preencha nome, número, ID da conta, ID do número e token de acesso.");
      return;
    }
    const falha = erroColunas(colunasSalvas, colunas, ordens);
    if (falha) {
      setErro(falha);
      return;
    }
    const minutos = Math.floor(Number(duracao));
    if (!Number.isFinite(minutos) || minutos < 5 || minutos > 480) {
      setErro("A duração padrão precisa ficar entre 5 e 480 minutos.");
      return;
    }
    setErro("");
    const proximo = normalizar({
      ...form,
      nome: form.nome.trim(),
      segmento: form.segmento.trim(),
      cep: form.cep.trim(),
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim(),
      wabaId: form.wabaId.trim(),
      phoneNumberId: form.phoneNumberId.trim(),
      token: form.token.trim(),
      webhookToken: form.webhookToken.trim(),
      vinculado: vincular ? true : prontoParaVincular() && form.vinculado,
    });
    const lista = colunas.map((c) => ({ id: c.id, nome: c.nome.trim() }));
    setForm(proximo);
    setColunas(lista);
    setDuracao(String(minutos));
    salvarConfiguracao(proximo, lista, minutos);
  }

  function renomearColuna(id: string, nome: string) {
    setColunas((lista) => lista.map((c) => (c.id === id ? { ...c, nome } : c)));
  }

  function moverColuna(indice: number, direcao: -1 | 1) {
    setColunas((lista) => {
      const destino = indice + direcao;
      if (destino < 0 || destino >= lista.length) return lista;
      const proxima = [...lista];
      const [item] = proxima.splice(indice, 1);
      proxima.splice(destino, 0, item);
      return proxima;
    });
  }

  function removerColuna(id: string) {
    if (ordens.some((o) => o.status === id)) return;
    setColunas((lista) => lista.filter((c) => c.id !== id));
  }

  function novaColuna() {
    setColunas((lista) => [...lista, { id: uid("col"), nome: "Nova coluna" }]);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink lg:text-3xl">Configurações</h1>
        <p className="text-muted">Dados do negócio, colunas de Status e vínculo com o WhatsApp Business.</p>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <h2 className="text-lg font-extrabold">Empresa</h2>
        <Field label="Nome da empresa">
          <input className={fieldClass} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome da empresa" />
        </Field>
        <Field label="Segmento">
          <input className={fieldClass} value={form.segmento} onChange={(e) => set("segmento", e.target.value)} placeholder="Segmento do seu negócio" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <Field label="CEP">
            <input
              className={fieldClass}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={form.cep}
              onChange={(e) => void aoDigitarCep(e.target.value)}
            />
          </Field>
          <Field label="Estado">
            <select
              className={fieldClass}
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              aria-label="UF"
            >
              <option value="">UF</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {cepAviso && <p className="text-sm text-muted">{cepAviso}</p>}
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <Field label="Logradouro">
            <input className={fieldClass} value={form.logradouro} onChange={(e) => set("logradouro", e.target.value)} />
          </Field>
          <Field label="Número">
            <input className={fieldClass} value={form.numero} onChange={(e) => set("numero", e.target.value)} />
          </Field>
        </div>
        <Field label="Complemento">
          <input className={fieldClass} value={form.complemento} onChange={(e) => set("complemento", e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Bairro">
            <input className={fieldClass} value={form.bairro} onChange={(e) => set("bairro", e.target.value)} />
          </Field>
          <Field label="Cidade">
            <input className={fieldClass} value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <div>
          <h2 className="text-lg font-extrabold">Agenda</h2>
          <p className="text-sm text-muted">Novos agendamentos nascem com essa duração. Dá para mudar na hora de marcar.</p>
        </div>
        <Field label="Duração padrão (minutos)">
          <input
            className={fieldClass}
            type="number"
            min={5}
            max={480}
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <div>
          <h2 className="text-lg font-extrabold">Colunas da pipeline</h2>
          <p className="text-sm text-muted">
            Selecione a Ordem dos Status que suas Ordens de Serviço devem seguir.
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {colunas.map((coluna, indice) => {
            const qtd = ordens.filter((o) => o.status === coluna.id).length;
            const travada = qtd > 0;
            return (
              <li key={coluna.id} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center">
                <input
                  className={cn(fieldClass, travada && "bg-paper text-muted")}
                  value={coluna.nome}
                  disabled={travada}
                  aria-label={`Nome da coluna ${indice + 1}`}
                  onChange={(e) => renomearColuna(coluna.id, e.target.value)}
                />
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-xl border border-line disabled:opacity-40"
                    aria-label="Subir coluna"
                    disabled={indice === 0}
                    onClick={() => moverColuna(indice, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-xl border border-line disabled:opacity-40"
                    aria-label="Descer coluna"
                    disabled={indice === colunas.length - 1}
                    onClick={() => moverColuna(indice, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-xl border border-line text-danger disabled:opacity-40"
                    aria-label="Remover coluna"
                    disabled={travada || colunas.length === 1}
                    onClick={() => removerColuna(coluna.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {travada && (
                  <p className="text-xs font-semibold text-muted sm:max-w-40">
                    {qtd === 1 ? "1 ordem nesta coluna" : `${qtd} ordens nesta coluna`}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <Btn variant="ghost" onClick={novaColuna}>
          Nova coluna
        </Btn>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">WhatsApp Business</h2>
            <p className="text-sm text-muted">Credenciais da API oficial da Meta para receber e enviar as conversas do consultório.</p>
          </div>
          <span
            className={
              form.vinculado
                ? "shrink-0 rounded-full bg-lime-soft px-3 py-1 text-xs font-semibold text-ink"
                : "shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-muted"
            }
          >
            {form.vinculado ? "Vinculado" : "Não vinculado"}
          </span>
        </div>
        <Field label="Número do WhatsApp Business">
          <input
            className={fieldClass}
            inputMode="tel"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
            placeholder="(11) 90000-0000"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ID da conta (WABA)">
            <input className={fieldClass} value={form.wabaId} onChange={(e) => set("wabaId", e.target.value)} placeholder="WhatsApp Business Account ID" />
          </Field>
          <Field label="ID do número">
            <input
              className={fieldClass}
              value={form.phoneNumberId}
              onChange={(e) => set("phoneNumberId", e.target.value)}
              placeholder="Phone Number ID"
            />
          </Field>
        </div>
        <Field label="Token de acesso">
          <input
            className={fieldClass}
            type="password"
            autoComplete="off"
            value={form.token}
            onChange={(e) => set("token", e.target.value)}
            placeholder="Token permanente da conta"
          />
        </Field>
        <Field label="Token de verificação do webhook">
          <input
            className={fieldClass}
            value={form.webhookToken}
            onChange={(e) => set("webhookToken", e.target.value)}
            placeholder="O mesmo token configurado no painel da Meta"
          />
        </Field>
        {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Btn className="sm:flex-1" onClick={() => salvar(false)}>
            Salvar
          </Btn>
          <Btn variant="ink" className="sm:flex-1" onClick={() => salvar(true)}>
            Vincular WhatsApp
          </Btn>
        </div>
      </section>
    </div>
  );
}
