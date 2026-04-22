export const MARITAL_STATUS_OPTIONS = [
  "Solteiro(a)",
  "Casado(a)",
  "União Estável",
  "Divorciado(a)",
  "Viúvo(a)",
];

export const EDUCATION_LEVEL_OPTIONS = [
  "Ensino fundamental",
  "Ensino médio",
  "Ensino técnico",
  "Ensino superior incompleto",
  "Ensino superior completo",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
];

export const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const SCIENCE_TEXT =
  "Estou ciente de que quando houver qualquer alteração dos dados acima, providenciarei de imediato a atualização junto ao SIRH e NQ P/I desta CIA.";

export function createEmptyChild(id = 1) {
  return {
    id,
    nome: "",
    dataNascimento: "",
  };
}

function buildChildrenFromOfficer(data) {
  if (Array.isArray(data?.children) && data.children.length > 0) {
    return data.children.map((child, index) => ({
      id: index + 1,
      nome: child?.nome || "",
      dataNascimento: formatDateFromApi(child?.dataNascimento || ""),
    }));
  }

  const legacyChildren = [
    {
      nome: data?.child_1_name || "",
      dataNascimento: formatDateFromApi(data?.child_1_birth_date),
    },
    {
      nome: data?.child_2_name || "",
      dataNascimento: formatDateFromApi(data?.child_2_birth_date),
    },
    {
      nome: data?.child_3_name || "",
      dataNascimento: formatDateFromApi(data?.child_3_birth_date),
    },
  ].filter((child) => child.nome || child.dataNascimento);

  if (legacyChildren.length > 0) {
    return legacyChildren.map((child, index) => ({
      id: index + 1,
      ...child,
    }));
  }

  return [createEmptyChild(1)];
}

export function createInitialForm(unitId = "") {
  return {
    presentation_date: "",
    previous_opm: "",
    re_with_digit: "",
    rank: "",
    full_name: "",
    war_name: "",
    admission_date: "",
    birth_date: "",
    naturality: "",
    naturality_state: "",
    unit_id: unitId ? String(unitId) : "",
    is_driver: false,
    driver_category: "",
    driver_registration_number: "",
    driver_issue_date: "",
    driver_expiration_date: "",
    has_sat_pm: false,
    sat_pm_category: "",
    pmesp_courses: "",
    education_level: "",
    higher_education_course: "",
    blood_type: "",
    rg: "",
    rg_state: "",
    cpf: "",
    civil_profession: "",
    spoken_languages: "",
    mother_name: "",
    father_name: "",
    marital_status: "",
    marriage_date: "",
    spouse_name: "",
    spouse_birth_date: "",
    spouse_rg: "",
    spouse_rg_state: "",
    spouse_cpf: "",
    children: [createEmptyChild(1)],
    street: "",
    street_number: "",
    address_details: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
    reference_point: "",
    nearest_unit_cpa: "",
    nearest_unit_btl: "",
    nearest_unit_cia: "",
    nearest_unit_phone: "",
    cell_phone: "",
    residential_phone: "",
    spouse_phone: "",
    message_phone: "",
    functional_email: "",
    personal_email: "",
    associate_cb_sd: false,
    associate_afam: false,
    associate_coopmil: false,
    associate_adepom: false,
    associate_apmdfesp: false,
    associate_other: "",
    has_private_insurance: false,
    private_insurance_details: "",
    private_insurance_phone: "",
    observation: "",
    acknowledgement_date: "",
    acknowledgement_signature: "",
    nationality: "Brasileira",
    sexual_orientation: "",
    external_unit_name: "",
    address: "",
  };
}

export function maskDate(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function getDateInputProps() {
  return {
    inputMode: "numeric",
    maxLength: 10,
    placeholder: "DD/MM/AAAA",
  };
}

export function getCpfInputProps() {
  return {
    inputMode: "numeric",
    maxLength: 14,
    placeholder: "000.000.000-00",
  };
}

export function getCepInputProps() {
  return {
    inputMode: "numeric",
    maxLength: 9,
    placeholder: "00000-000",
  };
}

export function getPhoneInputProps() {
  return {
    inputMode: "numeric",
    maxLength: 15,
    placeholder: "(00) 00000-0000",
  };
}

export function formatDateFromApi(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function maskCpf(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function maskCep(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function toIsoDate(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function emptyToNull(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function sanitizePhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits || null;
}

export function buildFormFromOfficer(data, fallbackUnitId = "") {
  return {
    ...createInitialForm(fallbackUnitId),
    presentation_date: formatDateFromApi(data.presentation_date),
    previous_opm: data.previous_opm || "",
    re_with_digit: data.re_with_digit || "",
    rank: data.rank || "",
    full_name: data.full_name || "",
    war_name: data.war_name || "",
    admission_date: formatDateFromApi(data.admission_date),
    birth_date: formatDateFromApi(data.birth_date),
    naturality: data.naturality || "",
    naturality_state: data.naturality_state || "",
    unit_id: data.unit_id ? String(data.unit_id) : String(fallbackUnitId || ""),
    is_driver: Boolean(data.is_driver),
    driver_category: data.driver_category || "",
    driver_registration_number: data.driver_registration_number || "",
    driver_issue_date: formatDateFromApi(data.driver_issue_date),
    driver_expiration_date: formatDateFromApi(data.driver_expiration_date),
    has_sat_pm: Boolean(data.has_sat_pm),
    sat_pm_category: data.sat_pm_category || "",
    pmesp_courses: data.pmesp_courses || "",
    education_level: data.education_level || "",
    higher_education_course: data.higher_education_course || "",
    blood_type: data.blood_type || "",
    rg: data.rg || "",
    rg_state: data.rg_state || "",
    cpf: maskCpf(data.cpf || ""),
    civil_profession: data.civil_profession || "",
    spoken_languages: data.spoken_languages || "",
    mother_name: data.mother_name || "",
    father_name: data.father_name || "",
    marital_status: data.marital_status || "",
    marriage_date: formatDateFromApi(data.marriage_date),
    spouse_name: data.spouse_name || "",
    spouse_birth_date: formatDateFromApi(data.spouse_birth_date),
    spouse_rg: data.spouse_rg || "",
    spouse_rg_state: data.spouse_rg_state || "",
    spouse_cpf: maskCpf(data.spouse_cpf || ""),
    children: buildChildrenFromOfficer(data),
    street: data.street || "",
    street_number: data.street_number || "",
    address_details: data.address_details || "",
    neighborhood: data.neighborhood || "",
    city: data.city || "",
    state: data.state || "",
    cep: maskCep(data.cep || ""),
    reference_point: data.reference_point || "",
    nearest_unit_cpa: data.nearest_unit_cpa || "",
    nearest_unit_btl: data.nearest_unit_btl || "",
    nearest_unit_cia: data.nearest_unit_cia || "",
    nearest_unit_phone: maskPhone(data.nearest_unit_phone || ""),
    cell_phone: maskPhone(data.cell_phone || ""),
    residential_phone: maskPhone(data.residential_phone || ""),
    spouse_phone: maskPhone(data.spouse_phone || ""),
    message_phone: maskPhone(data.message_phone || ""),
    functional_email: data.functional_email || "",
    personal_email: data.personal_email || "",
    associate_cb_sd: Boolean(data.associate_cb_sd),
    associate_afam: Boolean(data.associate_afam),
    associate_coopmil: Boolean(data.associate_coopmil),
    associate_adepom: Boolean(data.associate_adepom),
    associate_apmdfesp: Boolean(data.associate_apmdfesp),
    associate_other: data.associate_other || "",
    has_private_insurance: Boolean(data.has_private_insurance),
    private_insurance_details: data.private_insurance_details || "",
    private_insurance_phone: maskPhone(data.private_insurance_phone || ""),
    observation: data.observation || "",
    acknowledgement_date: formatDateFromApi(data.acknowledgement_date),
    acknowledgement_signature: data.acknowledgement_signature || "",
    nationality: data.nationality || "Brasileira",
    sexual_orientation: data.sexual_orientation || "",
    external_unit_name: data.external_unit_name || "",
    address: data.address || "",
  };
}
