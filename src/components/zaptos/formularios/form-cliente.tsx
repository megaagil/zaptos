import { useState } from "react";
import { maskPhone } from "@/lib/zaptos/format";
import { useZaptos } from "@/lib/zaptos/store";
import type { Modal } from "@/lib/zaptos/types";
import { cn } from "@/lib/utils";
import { Btn, Field, fieldClass } from "../ui";

export function FormCliente({ modal }: { modal: Extract<Modal, { kind: "cliente" }> }) {
  const existente = useZaptos((s) => s.clientes.find((c) => c.id === modal.clienteId));
  const criarCliente = useZaptos((s) => s.criarCliente);
  const atualizarCliente = useZaptos((s) => s.atualizarCliente);
  const fecharModal = useZaptos((s) => s.fecharModal);
  const setToast = useZaptos((s) => s.setToast);
  const setClienteFoco = useZaptos((s) => s.setClienteFoco);
  const [nome, setNome] = useState(existente?.nome ?? "");
  const [telefone, setTelefone] = useState(existente?.telefone ?? "");
  const [email, setEmail] = useState(existente?.email ?? "");
  const [documento, setDocumento] = useState(existente?.documento ?? "");
  const [endereco, setEndereco] = useState(existente?.endereco ?? "");
  const [notas, setNotas] = useState(existente?.notas ?? "");
  const [erro, setErro] = useState("");

  function salvar() {
    if (nome.trim().length < 2 || telefone.replace(/\D/g, "").length < 10) {
      setErro("Informe o nome e um telefone com DDD.");
      return;
    }
    const dados = {
      nome: nome.trim(),
      telefone,
      email: email.trim(),
      documento: documento.trim(),
      endereco: endereco.trim(),
      notas: notas.trim(),
    };
    if (existente) {
      atualizarCliente(existente.id, dados);
      setToast("Cliente atualizado");
      fecharModal();
      return;
    }
    const id = criarCliente(dados);
    setClienteFoco(id);
    setToast("Cliente cadastrado");
    fecharModal();
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <input className={fieldClass} value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <input className={fieldClass} inputMode="tel" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="E-mail">
          <input type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="CPF ou CNPJ">
          <input className={fieldClass} value={documento} onChange={(e) => setDocumento(e.target.value)} />
        </Field>
      </div>
      <Field label="Endereço">
        <input className={fieldClass} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
      </Field>
      <Field label="Notas">
        <textarea className={cn(fieldClass, "h-20 py-2")} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </Field>
      {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
      <Btn type="submit" className="w-full">
        Salvar cliente
      </Btn>
    </form>
  );
}
