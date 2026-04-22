import { maskDate, toIsoDate } from "../pages/policeOfficerRegistrationUtils";

export const STOCK_CATEGORY_OPTIONS = [
  "Peça de Veículo",
  "Material de Escritório",
  "EPI/Fardamento",
  "Equipamento",
  "Ferramenta",
  "Outros",
];

export const STOCK_UNIT_MEASURE_OPTIONS = [
  "Unidade",
  "Par",
  "Caixa",
  "Litro",
  "Metro",
  "Kg",
];

export const STOCK_STATUS_OPTIONS = ["Ativo", "Inativo"];

export const STOCK_EXIT_REASON_OPTIONS = [
  "Uso interno",
  "Manutenção",
  "Descarte",
  "Transferência",
  "Outros",
];

export const STOCK_MAINTENANCE_TYPE_OPTIONS = [
  "Manutenção Preventiva",
  "Manutenção Corretiva",
  "Revisão",
];

export const STOCK_MAINTENANCE_STATUS_OPTIONS = [
  "Aberta",
  "Em andamento",
  "Concluída",
  "Cancelada",
];

export function maskCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function sanitizeCurrencyInput(value) {
  const normalized = String(value || "").replace(/[^\d,.-]/g, "").replace(",", ".");
  return normalized;
}

export function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

export function normalizeStockText(value) {
  const text = String(value ?? "");
  if (!text) {
    return "";
  }

  return text
    .replace(/Relat\u00C3\u00B3rio/g, "Relatório")
    .replace(/Manuten\u00C3\u00A7\u00C3\u00A3o/g, "Manutenção")
    .replace(/manuten\?\?o/gi, "manutenção")
    .replace(/Situa\u00C3\u00A7\u00C3\u00A3o/g, "Situação")
    .replace(/situa\?\?o/gi, "situação")
    .replace(/Hist\u00C3\u00B3rico/g, "Histórico")
    .replace(/hist\?\?rico/gi, "histórico")
    .replace(/Movimenta\u00C3\u00A7\u00C3\u00B5es/g, "Movimentações")
    .replace(/movimenta\?\?\w*/gi, "movimentações")
    .replace(/Respons\u00C3\u00A1vel/g, "Responsável")
    .replace(/respons\?\?vel/gi, "responsável")
    .replace(/Observa\u00C3\u00A7\u00C3\u00A3o/g, "Observação")
    .replace(/observa\?\?o/gi, "observação")
    .replace(/Cr\u00C3\u00ADtico/g, "Crítico")
    .replace(/cr\?\?tico/gi, "Crítico")
    .replace(/M\u00C3\u00ADnimo/g, "Mínimo")
    .replace(/m\?\?nimo/gi, "mínimo")
    .replace(/Localiza\u00C3\u00A7\u00C3\u00A3o/g, "Localização")
    .replace(/localiza\?\?o/gi, "localização")
    .replace(/Equipe de manuten\?\?o/gi, "Equipe de manutenção");
}

export function resolveStockSituation(item) {
  const current = Number(item?.estoque_atual || 0);
  const minimum = Number(item?.estoque_minimo || 0);
  if (current < minimum) return "Crítico";
  if (current === minimum) return "Baixo";
  return "Normal";
}

export function resolveStockSituationStyle(item) {
  const situation = resolveStockSituation(item);
  if (situation === "Crítico") {
    return {
      backgroundColor: "rgba(239, 68, 68, 0.12)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.28)",
    };
  }
  if (situation === "Baixo") {
    return {
      backgroundColor: "rgba(245, 158, 11, 0.12)",
      color: "#f59e0b",
      border: "1px solid rgba(245, 158, 11, 0.28)",
    };
  }
  return {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    color: "#22c55e",
    border: "1px solid rgba(34, 197, 94, 0.28)",
  };
}

export function buildStockProductPayload(form) {
  return {
    nome: form.nome.trim(),
    codigo_patrimonio: form.codigo_patrimonio.trim() || null,
    categoria: form.categoria || null,
    unidade_medida: form.unidade_medida || null,
    estoque_minimo: Number(form.estoque_minimo || 0),
    estoque_atual: Number(form.estoque_atual || 0),
    localizacao: form.localizacao.trim() || null,
    observacoes: form.observacoes.trim() || null,
    status: form.status,
  };
}

export function buildStockEntryPayload(form) {
  const resolvedProductId = form.produto_id ? Number(form.produto_id) : null;
  const typedProductName = String(form.produto_nome || "").trim();
  return {
    produto_id: Number.isFinite(resolvedProductId) ? resolvedProductId : null,
    produto_nome: typedProductName || null,
    quantidade_recebida: Number(form.quantidade_recebida),
    data_entrada: form.data_entrada ? toIsoDate(form.data_entrada) : null,
    numero_documento: form.numero_documento.trim() || null,
    fornecedor_id: form.fornecedor_id ? Number(form.fornecedor_id) : null,
    fornecedor_nome: form.fornecedor_nome.trim() || null,
    responsavel_recebimento: form.responsavel_recebimento.trim() || null,
    unidade_destino_id: form.unidade_destino_id ? Number(form.unidade_destino_id) : null,
    observacoes: form.observacoes.trim() || null,
  };
}

export function getStockProductOptionLabel(item) {
  const name = String(item?.nome || "").trim();
  const code = String(item?.codigo_patrimonio || "").trim();
  return code ? `${name} - ${code}` : name;
}

export function resolveStockProductFromInput(products, rawValue) {
  const normalized = String(rawValue || "").trim();
  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  return (
    products.find((item) => String(item.id) === normalized) ||
    products.find((item) => getStockProductOptionLabel(item).toLowerCase() === lowered) ||
    products.find((item) => String(item.nome || "").trim().toLowerCase() === lowered) ||
    products.find((item) => String(item.codigo_patrimonio || "").trim().toLowerCase() === lowered) ||
    null
  );
}

export function buildStockExitPayload(form) {
  return {
    produto_id: Number(form.produto_id),
    quantidade: Number(form.quantidade),
    data_saida: form.data_saida ? toIsoDate(form.data_saida) : null,
    motivo_saida: form.motivo_saida || null,
    destino_solicitante: form.destino_solicitante.trim() || null,
    responsavel: form.responsavel.trim() || null,
    observacoes: form.observacoes.trim() || null,
  };
}

export function buildSupplierPayload(form) {
  return {
    nome: form.nome.trim(),
    cnpj: form.cnpj.trim() || null,
    telefone: form.telefone.trim() || null,
    email: form.email.trim() || null,
    endereco: form.endereco.trim() || null,
    produto_servico: form.produto_servico.trim() || null,
    observacoes: form.observacoes.trim() || null,
    status: form.status,
  };
}

export function buildMaintenanceOrderPayload(form) {
  return {
    tipo: form.tipo || null,
    item_equipamento: form.item_equipamento.trim(),
    patrimonio_placa: form.patrimonio_placa.trim() || null,
    descricao_problema: form.descricao_problema.trim(),
    data_abertura: form.data_abertura ? toIsoDate(form.data_abertura) : null,
    previsao_conclusao: form.previsao_conclusao ? toIsoDate(form.previsao_conclusao) : null,
    data_conclusao: form.data_conclusao ? toIsoDate(form.data_conclusao) : null,
    responsavel_tecnico: form.responsavel_tecnico.trim() || null,
    pecas_utilizadas: form.pecas_utilizadas.trim() || null,
    custo_estimado: form.custo_estimado ? Number(sanitizeCurrencyInput(form.custo_estimado)) : null,
    custo_real: form.custo_real ? Number(sanitizeCurrencyInput(form.custo_real)) : null,
    status: form.status || "Aberta",
    observacoes: form.observacoes.trim() || null,
  };
}

export function createEmptyProductForm() {
  return {
    nome: "",
    codigo_patrimonio: "",
    categoria: "",
    unidade_medida: "",
    estoque_minimo: "",
    estoque_atual: 0,
    localizacao: "",
    observacoes: "",
    status: "Ativo",
  };
}

export function createEmptyEntryForm() {
  return {
    produto_id: "",
    produto_nome: "",
    quantidade_recebida: "",
    data_entrada: "",
    numero_documento: "",
    fornecedor_id: "",
    fornecedor_nome: "",
    responsavel_recebimento: "",
    unidade_destino_id: "",
    observacoes: "",
  };
}

export function createEmptyExitForm() {
  return {
    produto_id: "",
    quantidade: "",
    data_saida: "",
    motivo_saida: "",
    destino_solicitante: "",
    responsavel: "",
    observacoes: "",
  };
}

export function createEmptySupplierForm() {
  return {
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    produto_servico: "",
    observacoes: "",
    status: "Ativo",
  };
}

export function createEmptyMaintenanceForm() {
  return {
    tipo: "",
    item_equipamento: "",
    patrimonio_placa: "",
    descricao_problema: "",
    data_abertura: maskDate(new Date().toLocaleDateString("pt-BR").replace(/\D/g, "")),
    previsao_conclusao: "",
    data_conclusao: "",
    responsavel_tecnico: "",
    pecas_utilizadas: "",
    custo_estimado: "",
    custo_real: "",
    status: "Aberta",
    observacoes: "",
  };
}

