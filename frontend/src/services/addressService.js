const IBGE_CITIES_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome";

const VIACEP_URL = "https://viacep.com.br/ws";

let citiesCache = null;

export async function loadBrazilCities() {
  if (citiesCache) {
    return citiesCache;
  }

  const response = await fetch(IBGE_CITIES_URL);
  if (!response.ok) {
    throw new Error("Não foi possível carregar as cidades do IBGE.");
  }

  const data = await response.json();
  citiesCache = data
    .map((item) => item?.nome)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  return citiesCache;
}

export async function lookupCep(cep) {
  const normalizedCep = String(cep || "").replace(/\D/g, "");
  if (normalizedCep.length !== 8) {
    throw new Error("CEP inválido.");
  }

  const response = await fetch(`${VIACEP_URL}/${normalizedCep}/json/`);
  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = await response.json();
  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return data;
}
