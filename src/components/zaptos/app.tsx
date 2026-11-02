import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { sessaoAtual, type Sessao } from "@/lib/zaptos/conta";
import { abrirInstancia, fecharInstancia, migrarInstancias, useZaptos } from "@/lib/zaptos/store";
import { Login } from "./acesso/login";
import { Shell } from "./shell";

export function ZaptosApp() {
  const [ready, setReady] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    let ativo = true;
    void Promise.resolve().then(() => {
      if (!ativo) return;
      migrarInstancias();
      const atual = sessaoAtual();
      if (atual) abrirInstancia(atual.email);
      useZaptos.getState().focarHoje();
      setSessao(atual);
      setReady(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!ready) return <Boot />;
  if (!sessao) {
    return (
      <Login
        onEntrou={(proxima) => {
          abrirInstancia(proxima.email);
          setSessao(proxima);
        }}
      />
    );
  }
  return (
    <Shell
      onSair={() => {
        fecharInstancia();
        setSessao(null);
      }}
    />
  );
}

function Boot() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <img src={logo} alt="" className="size-20" />
      <div>
        <p className="text-3xl font-extrabold text-ink">
          Zapt<span className="text-lime-deep">OS</span>
        </p>
        <p className="mt-1 text-muted">Preparando a operação de hoje…</p>
      </div>
    </main>
  );
}
