import { X } from "lucide-react";
import { useZaptos } from "@/lib/zaptos/store";
import { FormAgenda } from "./formularios/form-agenda";
import { FormCliente } from "./formularios/form-cliente";
import { FormOs } from "./formularios/form-os";

export function Modals() {
  const modal = useZaptos((s) => s.modal);
  if (!modal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button className="absolute inset-0 bg-ink/30" aria-label="Fechar" onClick={() => useZaptos.getState().fecharModal()} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">
              {modal.kind === "os" && "Nova ordem de serviço"}
              {modal.kind === "agenda" && (modal.ordemId ? "Remarcar horário" : "Novo horário")}
              {modal.kind === "cliente" && (modal.clienteId ? "Editar cliente" : "Novo cliente")}
            </h2>
            <p className="text-sm text-muted">
              {modal.kind === "os" && "O cliente recebe o aviso no WhatsApp se você marcar a opção."}
              {modal.kind === "agenda" && "Vira um horário na agenda e, se ainda não existir, uma OS."}
              {modal.kind === "cliente" && "Os dados ficam neste navegador, na demonstração."}
            </p>
          </div>
          <button
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line"
            aria-label="Fechar formulário"
            onClick={() => useZaptos.getState().fecharModal()}
          >
            <X className="size-5" />
          </button>
        </div>
        {modal.kind === "os" && <FormOs modal={modal} />}
        {modal.kind === "agenda" && <FormAgenda modal={modal} />}
        {modal.kind === "cliente" && <FormCliente modal={modal} />}
      </div>
    </div>
  );
}
