export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type EnderecoCep = {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type Componente = { long_name: string; short_name: string; types: string[] };

function componente(lista: Componente[], tipo: string, curto = false) {
  const item = lista.find((parte) => parte.types.includes(tipo));
  if (!item) return "";
  return curto ? item.short_name : item.long_name;
}

export async function consultarCep(cep: string): Promise<EnderecoCep> {
  const limpo = cep.replace(/\D/g, "");
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("components", `postal_code:${limpo}|country:BR`);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  const chave = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (typeof chave === "string" && chave.trim()) url.searchParams.set("key", chave.trim());

  let dado: {
    status?: string;
    results?: { address_components?: Componente[] }[];
  };
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("CEP não encontrado.");
    dado = (await resposta.json()) as typeof dado;
  } catch {
    throw new Error("CEP não encontrado.");
  }
  const lista = dado.results?.[0]?.address_components;
  if (dado.status !== "OK" || !lista) throw new Error("CEP não encontrado.");
  return {
    logradouro: componente(lista, "route"),
    numero: componente(lista, "street_number"),
    bairro:
      componente(lista, "sublocality_level_1") ||
      componente(lista, "neighborhood") ||
      componente(lista, "administrative_area_level_4"),
    cidade: componente(lista, "administrative_area_level_2") || componente(lista, "locality"),
    estado: componente(lista, "administrative_area_level_1", true),
  };
}
