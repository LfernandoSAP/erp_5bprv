import { formatDateFromApi } from "../pages/policeOfficerRegistrationUtils";

export function resolvePrimarySerial(item) {
  return (
    item?.lot_number ||
    item?.armamento_num_serie ||
    item?.algema_num_serie ||
    item?.colete_num_serie ||
    item?.municao_lote ||
    null
  );
}

export function normalizeMaterialBelicoCaliber(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (normalized === "552") return "556";
  if (normalized === "Taser-Operacional") return "Cartucho Taser";
  return normalized;
}

function normalizeCategoryKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const CDC_MATERIAL_OPTIONS = [
  { value: "ESCUDO_BALISTICO", label: "Escudo Balístico" },
  { value: "ESCUDO_ANTI_TUMULTO", label: "Escudo anti tumulto" },
  { value: "CAPACETE_BALISTICO", label: "Capacete balístico" },
  { value: "CAPACETE_ANTI_TUMULTO", label: "Capacete anti tumulto" },
  { value: "PERNEIRA", label: "Perneira" },
  { value: "EXOESQUELETO", label: "Exoesqueleto" },
  { value: "LANCADOR", label: "Lançador" },
];

const CDC_MATERIAL_LABEL_MAP = Object.fromEntries(
  CDC_MATERIAL_OPTIONS.map((option) => [option.value, option.label])
);

function isConcessionariaSelected(value) {
  return String(value || "").trim().toUpperCase() === "CONCESSIONARIA";
}

function isOutrosSelected(value) {
  return String(value || "").trim().toUpperCase() === "OUTROS";
}

function buildConditionalField({
  key,
  label,
  triggerKey,
  predicate,
  required = true,
  placeholder = "",
}) {
  return {
    key,
    label,
    type: "text",
    placeholder,
    visibleWhen: (form) => predicate(form?.[triggerKey]),
    requiredWhen: (form) => predicate(form?.[triggerKey]) && required,
  };
}

export function resolvePrimaryAsset(item) {
  return (
    item?.armamento_patrimonio ||
    item?.algema_patrimonio ||
    item?.colete_patrimonio ||
    null
  );
}

const BELICO_CATEGORY_CONFIG = {
  coletes: {
    primaryLabel: "Número de série",
    showPrimary: true,
    showAsset: true,
    extraFields: [
      { key: "item_brand", label: "Marca", type: "text" },
      { key: "item_model", label: "Modelo", type: "text" },
      {
        key: "item_gender",
        label: "Sexo",
        type: "select",
        options: ["Masculino", "Feminino"],
      },
      { key: "expiration_date", label: "Validade", type: "date" },
      {
        key: "item_size",
        label: "Tamanho",
        type: "select",
        options: [
          "EXP padrão",
          "EXP Largo",
          "EXP Estreito",
          "PP padrão",
          "PP Largo",
          "PP Estreito",
          "P padrão",
          "P Largo",
          "P Estreito",
          "M padrão",
          "M Largo",
          "M Estreito",
          "G padrão",
          "G Largo",
          "G Estreito",
        ],
      },
    ],
  },
  espargidores: {
    primaryLabel: "Lote",
    showPrimary: false,
    showAsset: false,
    extraFields: [
      { key: "item_brand", label: "Marca", type: "text" },
      {
        key: "item_model",
        label: "Modelo",
        type: "select",
        options: [
          { value: "Condor", label: "Condor" },
          { value: "OUTROS", label: "Outros" },
        ],
      },
      buildConditionalField({
        key: "item_model_other",
        label: "Informe o modelo",
        triggerKey: "item_model",
        predicate: isOutrosSelected,
        placeholder: "Digite o modelo",
      }),
      { key: "lot_number", label: "Lote", type: "text" },
      { key: "expiration_date", label: "Validade", type: "date" },
    ],
  },
  armas: {
    primaryLabel: "Número de série",
    showPrimary: true,
    showAsset: true,
    extraFields: [
      { key: "item_brand", label: "Marca", type: "text" },
      { key: "item_model", label: "Modelo", type: "text" },
      {
        key: "item_type",
        label: "Tipo",
        type: "select",
        options: ["Revolver", "Pistola", "Carabina", "Espingarda", "Fuzil"],
      },
    ],
  },
  algemas: {
    primaryLabel: "Número de série",
    showPrimary: true,
    showAsset: true,
    extraFields: [
      { key: "item_brand", label: "Marca", type: "text" },
      { key: "item_model", label: "Modelo", type: "text" },
      {
        key: "item_holder",
        label: "Detentor",
        type: "select",
        options: ["PMESP", "DER", "PARTICULAR"],
      },
    ],
  },
  municoes: {
    primaryLabel: "Número de lote",
    showPrimary: false,
    showAsset: false,
    extraFields: [
      { key: "lot_number", label: "Nº de Lote", type: "text" },
      {
        key: "item_type",
        label: "Tipo",
        type: "select",
        options: ["Treina", "Operacional", "EXPO", "EOPP", "LNOCK", "SS109", "EG"],
      },
      {
        key: "item_model",
        label: "Calibre",
        type: "select",
        options: ["12", "40", "556", "762", "Cartucho Taser"],
      },
      { key: "quantity", label: "Saldo Atual", type: "number" },
    ],
  },
  municoes_quimicas: {
    primaryLabel: "Lote",
    showPrimary: false,
    showAsset: false,
    extraFields: [
      { key: "lot_number", label: "Nº de Lote", type: "text" },
      { key: "item_brand", label: "Marca", type: "text" },
      { key: "item_model", label: "Modelo", type: "text" },
      { key: "expiration_date", label: "Validade", type: "date" },
      { key: "quantity", label: "Quantidade", type: "number" },
    ],
  },
  tonfa_cassetetes: {
    primaryLabel: "Lote",
    showPrimary: false,
    showAsset: false,
    extraFields: [
      { key: "lot_number", label: "Lote", type: "text" },
      { key: "quantity", label: "Quantidade", type: "number" },
      {
        key: "item_holder",
        label: "Detentor",
        type: "select",
        options: [
          { value: "PMESP", label: "PMESP" },
          { value: "CONCESSIONARIA", label: "Concessionária" },
        ],
      },
      buildConditionalField({
        key: "item_holder_other",
        label: "Concessionária",
        triggerKey: "item_holder",
        predicate: isConcessionariaSelected,
        placeholder: "Digite o nome da concessionária",
      }),
    ],
  },
  taser: {
    primaryLabel: "Número de série",
    showPrimary: true,
    showAsset: true,
    extraFields: [
      { key: "item_brand", label: "Marca", type: "text" },
      { key: "item_model", label: "Modelo", type: "text" },
      {
        key: "item_holder",
        label: "Detentor",
        type: "select",
        options: [
          { value: "PMESP", label: "PMESP" },
          { value: "CONCESSIONARIA", label: "Concessionária" },
        ],
      },
      buildConditionalField({
        key: "item_holder_other",
        label: "Concessionária",
        triggerKey: "item_holder",
        predicate: isConcessionariaSelected,
        placeholder: "Digite o nome da concessionária",
      }),
    ],
  },
  material_de_cdc: {
    primaryLabel: "Número de série",
    showPrimary: true,
    showAsset: true,
    extraFields: [
      {
        key: "cdc_material_type",
        label: "Selecionar Material",
        type: "select",
        options: CDC_MATERIAL_OPTIONS,
      },
      {
        key: "cdc_exoskeleton_size",
        label: "Tamanho",
        type: "select",
        options: ["P", "M", "G"],
        visibleWhen: (form) => form.cdc_material_type === "EXOESQUELETO",
        requiredWhen: (form) => form.cdc_material_type === "EXOESQUELETO",
      },
      { key: "item_brand", label: "Marca", type: "text" },
      { key: "item_model", label: "Modelo", type: "text" },
      { key: "expiration_date", label: "Validade", type: "date" },
    ],
  },
  controle_de_material_belico_5bprv: {
    primaryLabel: "Número de série",
    showPrimary: true,
    showAsset: true,
    extraFields: [],
  },
};

export function getMaterialBelicoCategoryConfig(category) {
  return (
    BELICO_CATEGORY_CONFIG[normalizeCategoryKey(category)] || {
      primaryLabel: "Número de série",
      showPrimary: true,
      showAsset: true,
      extraFields: [],
    }
  );
}

export function buildMaterialBelicoFieldState(item = {}) {
  const normalizedCaliber = normalizeMaterialBelicoCaliber(item?.item_model);
  return {
    item_name: item?.item_name || "",
    lot_number: item?.lot_number || item?.municao_lote || "",
    expiration_date: formatDateFromApi(item?.expiration_date || ""),
    quantity: item?.quantity ?? "",
    item_brand: item?.item_brand || "",
    item_model: normalizedCaliber,
    item_model_other: item?.item_model_other || "",
    item_type: item?.item_type || "",
    item_gender: item?.item_gender || "",
    item_size: item?.item_size || "",
    item_holder: item?.item_holder || "",
    item_holder_other: item?.item_holder_other || "",
    cdc_material_type: item?.cdc_material_type || "",
    cdc_exoskeleton_size: item?.cdc_exoskeleton_size || "",
  };
}

export function buildMaterialBelicoExtraColumns(category) {
  return getMaterialBelicoCategoryConfig(category).extraFields;
}

export function isMaterialBelicoFieldVisible(field, form) {
  if (typeof field.visibleWhen === "function") {
    return field.visibleWhen(form);
  }
  return true;
}

export function isMaterialBelicoFieldRequired(field, form) {
  if (typeof field.requiredWhen === "function") {
    return field.requiredWhen(form);
  }
  return true;
}

export function buildCdcMaterialLabel(materialType, exoskeletonSize) {
  const baseLabel = CDC_MATERIAL_LABEL_MAP[(materialType || "").trim().toUpperCase()];
  if (!baseLabel) {
    return "-";
  }
  if ((materialType || "").trim().toUpperCase() === "EXOESQUELETO" && exoskeletonSize) {
    return `${baseLabel} - ${String(exoskeletonSize).trim().toUpperCase()}`;
  }
  return baseLabel;
}

export function formatMaterialBelicoFieldValue(field, item) {
  if (field.key === "cdc_material_type") {
    return buildCdcMaterialLabel(item?.cdc_material_type, item?.cdc_exoskeleton_size);
  }

  if (field.key === "item_model" && String(item?.item_model || "").trim().toUpperCase() === "OUTROS") {
    return item?.item_model_other || "Outros";
  }

  if (field.key === "item_holder") {
    const holder = String(item?.item_holder || "").trim();
    if (!holder) {
      return "-";
    }
    if (isConcessionariaSelected(holder)) {
      return item?.item_holder_other || "Concessionária";
    }
    if (holder === "PARTICULAR") {
      return "Particular";
    }
    return holder;
  }

  const value = item?.[field.key];
  const normalizedValue = field.key === "item_model" ? normalizeMaterialBelicoCaliber(value) : value;

  if (normalizedValue === null || normalizedValue === undefined || normalizedValue === "") {
    return "-";
  }

  if (typeof normalizedValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(normalizedValue)) {
    const date = new Date(normalizedValue);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("pt-BR");
    }
  }

  return String(normalizedValue);
}
