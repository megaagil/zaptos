import { criteriosSenha, type Via } from "@/lib/zaptos/conta";
import { Field, fieldClass } from "../ui";

export type Provedor = Exclude<Via, "senha">;

export function CampoValidado({
  label,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  value,
  mostrar,
  mensagem,
  ok,
  onChange,
  onBlur,
}: {
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "text";
  placeholder?: string;
  value: string;
  mostrar: boolean;
  mensagem: string;
  ok: string;
  onChange: (valor: string) => void;
  onBlur: () => void;
}) {
  const invalido = mostrar && Boolean(mensagem);
  const valido = mostrar && !mensagem && value.trim().length > 0;
  return (
    <Field label={label}>
      <input
        className={fieldClass + (invalido ? " border-danger" : valido ? " border-lime-deep" : "")}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        aria-invalid={invalido}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required
      />
      {invalido && <p className="mt-1 text-xs font-semibold text-danger">{mensagem}</p>}
      {valido && <p className="mt-1 text-xs font-semibold text-lime-deep">{ok}</p>}
    </Field>
  );
}

export function ListaSenha({ senha, email }: { senha: string; email: string }) {
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {criteriosSenha(senha, email).map((item) => (
        <li key={item.id} className={item.ok ? "font-semibold text-lime-deep" : "text-muted"}>
          {item.ok ? "Ok" : "Falta"} · {item.texto}
        </li>
      ))}
    </ul>
  );
}

export function ProvedorIcone({ id }: { id: Provedor }) {
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.6 18.7 23 15.8 23 12.3z" />
        <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.3v3c2 4 6 6.7 10.7 6.7z" />
        <path fill="#FBBC05" d="M5.1 14.3A7.2 7.2 0 0 1 4.7 12c0-.8.1-1.6.4-2.3V6.7H1.3A12 12 0 0 0 0 12c0 1.9.5 3.8 1.3 5.3l3.8-3z" />
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.7l3.8 3C6.1 7 8.8 4.8 12 4.8z" />
      </svg>
    );
  }
  if (id === "microsoft") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
        <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
        <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
        <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.6-.9 1.1-1.8 1.4-2.8-3.6-1.4-3.7-5.3-3.7-5.5zM14.7 6.6c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4z"
      />
    </svg>
  );
}
