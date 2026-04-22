import { useCallback, useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { RANK_OPTIONS } from "../constants/policeOfficerOptions";
import { lookupCep } from "../services/addressService";
import { apiFetch } from "../services/api";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";
import { normalizeUpperIdentifier } from "../utils/identifierFormat";
import {
  BLOOD_TYPE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  SCIENCE_TEXT,
  UF_OPTIONS,
  buildFormFromOfficer,
  createEmptyChild,
  createInitialForm,
  emptyToNull,
  getCepInputProps,
  getCpfInputProps,
  getDateInputProps,
  getPhoneInputProps,
  maskCep,
  maskCpf,
  maskDate,
  maskPhone,
  sanitizePhone,
  toIsoDate,
} from "./policeOfficerRegistrationUtils";

function FormSection({ title, children }) {
  return (
    <section style={{ ...styles.card, marginTop: "20px" }}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.formGrid}>{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  onBlur,
  required = false,
  placeholder = "",
  full = false,
  maxLength,
  inputMode,
}) {
  const fieldStyle = full ? styles.fieldFull : styles.field;
  return (
    <div style={fieldStyle}>
      <label style={styles.label}>{label}</label>
      <input
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={styles.input}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false, full = false }) {
  const fieldStyle = full ? styles.fieldFull : styles.field;
  return (
    <div style={fieldStyle}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={onChange} required={required} style={styles.input}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function getChildOrdinalLabel(index) {
  return `${index + 1}º filho`;
}

function PoliceOfficerRegistrationForm({ onBack, officerId = null, mode = "create" }) {
  const isEditMode = mode === "edit";
  const [viewerAccess, setViewerAccess] = useState({ unitId: null, unitLabel: "", canViewAll: false });
  const [form, setForm] = useState(createInitialForm());
  const [units, setUnits] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const loadUnits = useCallback(async (access) => {
    try {
      const activeUnits = await getUnits();
      setUnits(activeUnits);
      if (!access.canViewAll && access.unitId) {
        setForm((current) => ({ ...current, unit_id: String(access.unitId) }));
      }
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar unidades");
    }
  }, []);

  const loadOfficer = useCallback(async (access) => {
    try {
      setError("");
      setIsLoading(true);
      const data = await apiFetch(`/rh/police-officers/${officerId}`);
      setForm(buildFormFromOfficer(data, access.canViewAll ? "" : access.unitId || ""));
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar policial");
    } finally {
      setIsLoading(false);
    }
  }, [officerId]);

  useEffect(() => {
    const access = readAuthAccess();
    setViewerAccess(access);
    setForm(createInitialForm(access.canViewAll ? "" : access.unitId || ""));
    loadUnits(access);
    if (isEditMode && officerId) {
      loadOfficer(access);
    } else {
      setIsLoading(false);
    }
  }, [isEditMode, loadOfficer, loadUnits, officerId]);

  const availableUnits = useMemo(() => {
    if (viewerAccess.canViewAll) return units;
    return units.filter((unit) => String(unit.id) === String(viewerAccess.unitId));
  }, [units, viewerAccess]);

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(availableUnits), [availableUnits]);
  const selectedUnitLabel = useMemo(() => {
    const selected = unitOptions.find((option) => String(option.id) === String(form.unit_id));
    return selected?.label || viewerAccess.unitLabel || "";
  }, [form.unit_id, unitOptions, viewerAccess.unitLabel]);

  const needsSpouseFields =
    form.marital_status === "Casado(a)" || form.marital_status === "União Estável";

  const handleInputChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleMaskedChange = (field, formatter) => (event) => {
    setForm((current) => ({ ...current, [field]: formatter(event.target.value) }));
  };

  const handleUppercaseChange = (field, maxLength = null) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: normalizeUpperIdentifier(event.target.value, maxLength),
    }));
  };

  const handleDateBlur = (field, label) => () => {
    setForm((current) => {
      const value = current[field];
      if (!value) {
        return current;
      }
      if (toIsoDate(value)) {
        return current;
      }
      setError(`Informe uma data válida para ${label} no formato DD/MM/AAAA.`);
      return { ...current, [field]: "" };
    });
  };

  const updateChild = (id, field, value) => {
    setForm((current) => ({
      ...current,
      children: (current.children || []).map((child) =>
        child.id === id ? { ...child, [field]: value } : child
      ),
    }));
  };

  const addChild = () => {
    setForm((current) => {
      const nextId =
        (current.children || []).reduce((maxId, child) => Math.max(maxId, child.id || 0), 0) + 1;
      return {
        ...current,
        children: [...(current.children || []), createEmptyChild(nextId)],
      };
    });
  };

  const removeChild = (id) => {
    setForm((current) => {
      const children = current.children || [];
      if (children.length <= 1) return current;
      const remaining = children
        .filter((child) => child.id !== id)
        .map((child, index) => ({ ...child, id: index + 1 }));
      return {
        ...current,
        children: remaining.length ? remaining : [createEmptyChild(1)],
      };
    });
  };

  const handleChildDateBlur = (id, label) => () => {
    const child = (form.children || []).find((item) => item.id === id);
    if (!child?.dataNascimento) return;
    if (toIsoDate(child.dataNascimento)) return;
    updateChild(id, "dataNascimento", "");
    setError(`Informe uma data válida para ${label} no formato DD/MM/AAAA.`);
  };

  const handleClear = () => {
    setError("");
    if (isEditMode && officerId) {
      loadOfficer(viewerAccess);
      return;
    }
    setForm(createInitialForm(viewerAccess.canViewAll ? "" : viewerAccess.unitId || ""));
  };

  const handleCepLookup = async () => {
    const normalizedCep = form.cep.replace(/\D/g, "");
    if (normalizedCep.length !== 8) return;

    try {
      const data = await lookupCep(normalizedCep);
      setForm((current) => ({
        ...current,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));
    } catch (fetchError) {
      setError(fetchError.message || "Não foi possível consultar o CEP automaticamente.");
    }
  };

  const validateForm = () => {
    const requiredFields = [
      ["full_name", "Nome completo"],
      ["war_name", "Nome de Guerra"],
      ["re_with_digit", "RE-DC"],
      ["rank", "Posto/Graduação"],
      ["birth_date", "Data de Nascimento"],
      ["cpf", "CPF"],
      ["unit_id", "Unidade de lotação"],
    ];
    for (const [field, label] of requiredFields) {
      if (!String(form[field] || "").trim()) return `Preencha o campo obrigatório: ${label}.`;
    }

    const dateFields = [
      ["presentation_date", "Data de Apresentação"],
      ["admission_date", "Data de Admissão"],
      ["birth_date", "Data de Nascimento"],
      ["driver_issue_date", "Data de Expedição"],
      ["driver_expiration_date", "Validade"],
      ["marriage_date", "Data do Casamento"],
      ["spouse_birth_date", "Data de Nascimento do Cônjuge"],
      ["acknowledgement_date", "Data de ciência"],
    ];
    for (const [field, label] of dateFields) {
      if (form[field] && !toIsoDate(form[field])) {
        return `Informe uma data válida para ${label} no formato DD/MM/AAAA.`;
      }
    }

    for (const [index, child] of (form.children || []).entries()) {
      if (child.dataNascimento && !toIsoDate(child.dataNascimento)) {
        return `Informe uma data válida para ${getChildOrdinalLabel(index)} no formato DD/MM/AAAA.`;
      }
    }

    if (form.cpf.replace(/\D/g, "").length !== 11) return "CPF deve conter exatamente 11 dígitos.";
    if (form.spouse_cpf && form.spouse_cpf.replace(/\D/g, "").length !== 11) {
      return "CPF do cônjuge deve conter exatamente 11 dígitos.";
    }
    if (form.cep && form.cep.replace(/\D/g, "").length !== 8) return "CEP deve conter 8 dígitos.";
    if (form.is_driver && !form.driver_category.trim()) return "Informe a CAT do policial motorista.";
    if (needsSpouseFields && !form.spouse_name.trim()) return "Informe o nome do cônjuge.";
    if (
      form.functional_email &&
      !form.functional_email.toLowerCase().endsWith("@policiamilitar.sp.gov.br")
    ) {
      return "O e-mail funcional deve usar o domínio @policiamilitar.sp.gov.br.";
    }

    const phoneFields = [
      ["cell_phone", "Telefone Celular"],
      ["residential_phone", "Telefone Residencial"],
      ["spouse_phone", "Telefone do Cônjuge"],
      ["message_phone", "Telefone para Recado"],
      ["nearest_unit_phone", "Telefone da unidade PMESP mais próxima"],
      ["private_insurance_phone", "Telefone do seguro particular"],
    ];
    for (const [field, label] of phoneFields) {
      const digits = form[field].replace(/\D/g, "");
      if (digits && digits.length < 10) return `Informe um telefone válido para ${label}.`;
    }

    return "";
  };

  const buildPayload = () => ({
    full_name: form.full_name.trim(),
    war_name: form.war_name.trim(),
    rank: emptyToNull(form.rank),
    re_with_digit: form.re_with_digit.trim(),
    presentation_date: toIsoDate(form.presentation_date),
    admission_date: toIsoDate(form.admission_date),
    previous_opm: emptyToNull(form.previous_opm),
    unit_id: Number(form.unit_id),
    cpf: form.cpf.replace(/\D/g, ""),
    rg: emptyToNull(form.rg),
    rg_state: emptyToNull(form.rg_state),
    birth_date: toIsoDate(form.birth_date),
    naturality: emptyToNull(form.naturality),
    naturality_state: emptyToNull(form.naturality_state),
    nationality: emptyToNull(form.nationality),
    marital_status: emptyToNull(form.marital_status),
    sexual_orientation: null,
    is_driver: Boolean(form.is_driver),
    driver_category: form.is_driver ? emptyToNull(form.driver_category) : null,
    driver_registration_number: form.is_driver
      ? emptyToNull(form.driver_registration_number)
      : null,
    driver_issue_date: form.is_driver ? toIsoDate(form.driver_issue_date) : null,
    driver_expiration_date: form.is_driver
      ? toIsoDate(form.driver_expiration_date)
      : null,
    has_sat_pm: Boolean(form.has_sat_pm),
    sat_pm_category: null,
    pmesp_courses: emptyToNull(form.pmesp_courses),
    education_level: emptyToNull(form.education_level),
    higher_education_course: emptyToNull(form.higher_education_course),
    blood_type: emptyToNull(form.blood_type),
    civil_profession: emptyToNull(form.civil_profession),
    spoken_languages: emptyToNull(form.spoken_languages),
    mother_name: emptyToNull(form.mother_name),
    father_name: emptyToNull(form.father_name),
    marriage_date: needsSpouseFields ? toIsoDate(form.marriage_date) : null,
    spouse_name: needsSpouseFields ? emptyToNull(form.spouse_name) : null,
    spouse_birth_date: needsSpouseFields ? toIsoDate(form.spouse_birth_date) : null,
    spouse_rg: needsSpouseFields ? emptyToNull(form.spouse_rg) : null,
    spouse_rg_state: needsSpouseFields ? emptyToNull(form.spouse_rg_state) : null,
    spouse_cpf: needsSpouseFields ? form.spouse_cpf.replace(/\D/g, "") || null : null,
    children: (form.children || [])
      .map((child) => ({
        nome: emptyToNull(child.nome),
        dataNascimento: child.dataNascimento ? toIsoDate(child.dataNascimento) : null,
      }))
      .filter((child) => child.nome || child.dataNascimento),
    external_unit_name: null,
    cep: form.cep.replace(/\D/g, "") || null,
    street: emptyToNull(form.street),
    street_number: emptyToNull(form.street_number),
    address_details: emptyToNull(form.address_details),
    neighborhood: emptyToNull(form.neighborhood),
    state: emptyToNull(form.state),
    city: emptyToNull(form.city),
    reference_point: emptyToNull(form.reference_point),
    nearest_unit_cpa: emptyToNull(form.nearest_unit_cpa),
    nearest_unit_btl: emptyToNull(form.nearest_unit_btl),
    nearest_unit_cia: emptyToNull(form.nearest_unit_cia),
    nearest_unit_phone: sanitizePhone(form.nearest_unit_phone),
    cell_phone: sanitizePhone(form.cell_phone),
    residential_phone: sanitizePhone(form.residential_phone),
    spouse_phone: sanitizePhone(form.spouse_phone),
    message_phone: sanitizePhone(form.message_phone),
    functional_email: emptyToNull(form.functional_email),
    personal_email: emptyToNull(form.personal_email),
    associate_cb_sd: Boolean(form.associate_cb_sd),
    associate_afam: Boolean(form.associate_afam),
    associate_coopmil: Boolean(form.associate_coopmil),
    associate_adepom: Boolean(form.associate_adepom),
    associate_apmdfesp: Boolean(form.associate_apmdfesp),
    associate_other: emptyToNull(form.associate_other),
    has_private_insurance: Boolean(form.has_private_insurance),
    private_insurance_details: form.has_private_insurance
      ? emptyToNull(form.private_insurance_details)
      : null,
    private_insurance_phone: form.has_private_insurance
      ? sanitizePhone(form.private_insurance_phone)
      : null,
    observation: emptyToNull(form.observation),
    acknowledgement_date: toIsoDate(form.acknowledgement_date),
    acknowledgement_signature: emptyToNull(form.acknowledgement_signature),
    address: null,
    is_active: true,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const endpoint = isEditMode
      ? `/rh/police-officers/${officerId}`
      : "/rh/police-officers/";
    const method = isEditMode ? "PUT" : "POST";

    try {
      setIsSubmitting(true);
      await apiFetch(endpoint, { method, body: JSON.stringify(buildPayload()) });
      onBack();
    } catch (fetchError) {
      setError(
        fetchError.message ||
          (isEditMode ? "Erro ao atualizar policial" : "Erro ao cadastrar policial")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={styles.loadingCard}>Carregando ficha do policial...</div>;
  }

  const dateInputProps = getDateInputProps();
  const cpfInputProps = getCpfInputProps();
  const cepInputProps = getCepInputProps();
  const phoneInputProps = getPhoneInputProps();

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>{isEditMode ? "Editar policial" : "Cadastrar policial"}</h1>
        <p style={styles.subtitle}>
          {isEditMode
            ? "Atualize a ficha individual de dados pessoais do policial com segurança e consistência."
            : "Preencha a ficha individual de dados pessoais do policial com os dados funcionais, familiares e de contato exigidos pelo setor."}
        </p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {isEditMode ? "Atualização cadastral" : "Orientações do cadastro"}
          </h2>
          <p style={styles.sectionText}>
            Os campos com data usam máscara DD/MM/AAAA. CPF, CEP e telefones são
            formatados automaticamente durante o preenchimento.
          </p>
          <div style={styles.infoBox}>
            Campos obrigatórios desta ficha: Nome completo, Nome de Guerra, RE-DC,
            Posto/Graduação, Data de Nascimento, CPF e Unidade de lotação.
          </div>
        </section>

        <FormSection title="Dados pessoais">
          <TextField label="Data de Apresentação" value={form.presentation_date} onChange={handleMaskedChange("presentation_date", maskDate)} onBlur={handleDateBlur("presentation_date", "Data de Apresentação")} {...dateInputProps} />
          <TextField label="OPM Anterior" value={form.previous_opm} onChange={handleInputChange("previous_opm")} placeholder="BTL/CIA/PEL/GP/Município" />
          <TextField label="RE-DC" value={form.re_with_digit} onChange={handleUppercaseChange("re_with_digit", 20)} required />
          <SelectField label="Posto/Graduação" value={form.rank} onChange={handleInputChange("rank")} options={RANK_OPTIONS} required />
          <TextField label="Nome completo" value={form.full_name} onChange={handleInputChange("full_name")} required />
          <TextField label="Nome de Guerra" value={form.war_name} onChange={handleInputChange("war_name")} required />
          <TextField label="Data de Admissão" value={form.admission_date} onChange={handleMaskedChange("admission_date", maskDate)} onBlur={handleDateBlur("admission_date", "Data de Admissão")} {...dateInputProps} />
          <TextField label="Data de Nascimento" value={form.birth_date} onChange={handleMaskedChange("birth_date", maskDate)} onBlur={handleDateBlur("birth_date", "Data de Nascimento")} required {...dateInputProps} />
          <TextField label="Natural de" value={form.naturality} onChange={handleInputChange("naturality")} placeholder="Município de nascimento" />
          <SelectField label="UF" value={form.naturality_state} onChange={handleInputChange("naturality_state")} options={UF_OPTIONS} />

          <div style={styles.field}>
            <label style={styles.label}>Unidade de lotação</label>
            {viewerAccess.canViewAll ? (
              <select value={form.unit_id} onChange={handleInputChange("unit_id")} required style={styles.input}>
                <option value="">Selecione</option>
                {unitOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={selectedUnitLabel || "Carregando unidade..."}
                readOnly
                style={{
                  ...styles.input,
                  backgroundColor: "var(--app-surface-muted)",
                  color: "var(--app-text-muted)",
                  cursor: "not-allowed",
                }}
              />
            )}
          </div>

          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={form.is_driver} onChange={handleCheckboxChange("is_driver")} />
            <span>Motorista</span>
          </label>

          {form.is_driver && (
            <>
              <TextField label="CAT" value={form.driver_category} onChange={handleInputChange("driver_category")} />
              <TextField label="Nº Registro" value={form.driver_registration_number} onChange={handleInputChange("driver_registration_number")} />
              <TextField label="Data de Expedição" value={form.driver_issue_date} onChange={handleMaskedChange("driver_issue_date", maskDate)} onBlur={handleDateBlur("driver_issue_date", "Data de Expedição")} {...dateInputProps} />
              <TextField label="Validade" value={form.driver_expiration_date} onChange={handleMaskedChange("driver_expiration_date", maskDate)} onBlur={handleDateBlur("driver_expiration_date", "Validade")} {...dateInputProps} />
            </>
          )}

          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={form.has_sat_pm} onChange={handleCheckboxChange("has_sat_pm")} />
            <span>SAT PM</span>
          </label>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Cursos Realizados na PMESP</label>
            <textarea value={form.pmesp_courses} onChange={handleInputChange("pmesp_courses")} style={{ ...styles.textarea, minHeight: "120px" }} />
          </div>

          <SelectField label="Grau de Instrução" value={form.education_level} onChange={handleInputChange("education_level")} options={EDUCATION_LEVEL_OPTIONS} />
          <TextField label="Superior: especificar curso" value={form.higher_education_course} onChange={handleInputChange("higher_education_course")} />
          <SelectField label="Tipo Sanguíneo" value={form.blood_type} onChange={handleInputChange("blood_type")} options={BLOOD_TYPE_OPTIONS} />
          <TextField label="RG" value={form.rg} onChange={handleInputChange("rg")} />
          <SelectField label="Estado do RG" value={form.rg_state} onChange={handleInputChange("rg_state")} options={UF_OPTIONS} />
          <TextField label="CPF" value={form.cpf} onChange={handleMaskedChange("cpf", maskCpf)} required {...cpfInputProps} />
          <TextField label="Profissão Civil" value={form.civil_profession} onChange={handleInputChange("civil_profession")} />

          <div style={styles.fieldFull}>
            <label style={styles.label}>Idiomas que Domina</label>
            <textarea value={form.spoken_languages} onChange={handleInputChange("spoken_languages")} style={{ ...styles.textarea, minHeight: "100px" }} />
          </div>
        </FormSection>

        <FormSection title="Filiação">
          <TextField label="Nome da Mãe" value={form.mother_name} onChange={handleInputChange("mother_name")} />
          <TextField label="Nome do Pai" value={form.father_name} onChange={handleInputChange("father_name")} />
        </FormSection>

        <FormSection title="Estado civil">
          <SelectField label="Estado Civil" value={form.marital_status} onChange={handleInputChange("marital_status")} options={MARITAL_STATUS_OPTIONS} />
          {needsSpouseFields && (
            <>
              <TextField label="Data do Casamento" value={form.marriage_date} onChange={handleMaskedChange("marriage_date", maskDate)} onBlur={handleDateBlur("marriage_date", "Data do Casamento")} {...dateInputProps} />
              <TextField label="Nome do Cônjuge" value={form.spouse_name} onChange={handleInputChange("spouse_name")} />
              <TextField label="Data de Nascimento" value={form.spouse_birth_date} onChange={handleMaskedChange("spouse_birth_date", maskDate)} onBlur={handleDateBlur("spouse_birth_date", "Data de Nascimento do Cônjuge")} {...dateInputProps} />
              <TextField label="RG" value={form.spouse_rg} onChange={handleInputChange("spouse_rg")} />
              <SelectField label="Estado" value={form.spouse_rg_state} onChange={handleInputChange("spouse_rg_state")} options={UF_OPTIONS} />
              <TextField label="CPF" value={form.spouse_cpf} onChange={handleMaskedChange("spouse_cpf", maskCpf)} {...cpfInputProps} />
            </>
          )}
        </FormSection>

        <FormSection title="Filhos">
          <div style={styles.fieldFull}>
            <div style={{ display: "grid", gap: "12px" }}>
              {(form.children || []).map((child, index) => (
                <div
                  key={child.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
                    gap: "12px",
                    alignItems: "end",
                  }}
                >
                  <TextField
                    label={`${getChildOrdinalLabel(index)} - Nome`}
                    value={child.nome}
                    onChange={(event) => updateChild(child.id, "nome", event.target.value)}
                  />
                  <TextField
                    label={`${getChildOrdinalLabel(index)} - Data de Nascimento`}
                    value={child.dataNascimento}
                    onChange={(event) =>
                      updateChild(child.id, "dataNascimento", maskDate(event.target.value))
                    }
                    onBlur={handleChildDateBlur(
                      child.id,
                      `Data de Nascimento do ${getChildOrdinalLabel(index)}`
                    )}
                    {...dateInputProps}
                  />
                  {form.children.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      style={{
                        ...styles.secondaryButton,
                        alignSelf: "end",
                        minWidth: "auto",
                        padding: "12px 14px",
                        color: "var(--app-danger-strong, #ef4444)",
                        borderColor: "rgba(239, 68, 68, 0.35)",
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      ✕ Remover
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addChild}
              style={{
                ...styles.secondaryButton,
                marginTop: "12px",
                width: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--app-primary-strong)",
                borderColor: "rgba(45, 212, 191, 0.35)",
                backgroundColor: "rgba(45, 212, 191, 0.08)",
                transition: "all 0.2s ease",
              }}
            >
              + Adicionar Filho
            </button>
          </div>
        </FormSection>

        <FormSection title="Endereço residencial">
          <TextField label="AV/Rua" value={form.street} onChange={handleInputChange("street")} />
          <TextField label="Número" value={form.street_number} onChange={handleInputChange("street_number")} />
          <TextField label="Complemento" value={form.address_details} onChange={handleInputChange("address_details")} />
          <TextField label="Bairro" value={form.neighborhood} onChange={handleInputChange("neighborhood")} />
          <TextField label="Cidade" value={form.city} onChange={handleInputChange("city")} />
          <SelectField label="Estado" value={form.state} onChange={handleInputChange("state")} options={UF_OPTIONS} />
          <div style={styles.field}>
            <label style={styles.label}>CEP</label>
            <input
              value={form.cep}
              onChange={handleMaskedChange("cep", maskCep)}
              onBlur={handleCepLookup}
              placeholder={cepInputProps.placeholder}
              inputMode={cepInputProps.inputMode}
              maxLength={cepInputProps.maxLength}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldFull}>
            <label style={styles.label}>Ponto de Referência</label>
            <input value={form.reference_point} onChange={handleInputChange("reference_point")} style={styles.input} />
          </div>
          <TextField label="CPA" value={form.nearest_unit_cpa} onChange={handleInputChange("nearest_unit_cpa")} />
          <TextField label="BTL" value={form.nearest_unit_btl} onChange={handleInputChange("nearest_unit_btl")} />
          <TextField label="CIA" value={form.nearest_unit_cia} onChange={handleInputChange("nearest_unit_cia")} />
          <TextField label="Fone" value={form.nearest_unit_phone} onChange={handleMaskedChange("nearest_unit_phone", maskPhone)} {...phoneInputProps} />
        </FormSection>

        <FormSection title="Contatos">
          <TextField label="Telefone Celular" value={form.cell_phone} onChange={handleMaskedChange("cell_phone", maskPhone)} {...phoneInputProps} />
          <TextField label="Telefone Residencial" value={form.residential_phone} onChange={handleMaskedChange("residential_phone", maskPhone)} {...phoneInputProps} />
          <TextField label="Telefone do Cônjuge" value={form.spouse_phone} onChange={handleMaskedChange("spouse_phone", maskPhone)} {...phoneInputProps} />
          <TextField label="Telefone para Recado" value={form.message_phone} onChange={handleMaskedChange("message_phone", maskPhone)} {...phoneInputProps} />
          <TextField label="E-mail Funcional" value={form.functional_email} onChange={handleInputChange("functional_email")} placeholder="nome@policiamilitar.sp.gov.br" />
          <TextField label="E-mail Particular" value={form.personal_email} onChange={handleInputChange("personal_email")} />
        </FormSection>

        <FormSection title="Associado">
          {[
            ["associate_cb_sd", "CB/SD"],
            ["associate_afam", "AFAM"],
            ["associate_coopmil", "COOPMIL"],
            ["associate_adepom", "ADEPOM"],
            ["associate_apmdfesp", "APMDFESP"],
          ].map(([field, label]) => (
            <label key={field} style={styles.checkboxRow}>
              <input type="checkbox" checked={form[field]} onChange={handleCheckboxChange(field)} />
              <span>{label}</span>
            </label>
          ))}
          <TextField label="Outras" value={form.associate_other} onChange={handleInputChange("associate_other")} full />
        </FormSection>

        <FormSection title="Seguro particular">
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={form.has_private_insurance} onChange={handleCheckboxChange("has_private_insurance")} />
            <span>Possui seguro particular</span>
          </label>
          {form.has_private_insurance && (
            <>
              <TextField label="Descrição" value={form.private_insurance_details} onChange={handleInputChange("private_insurance_details")} full />
              <TextField label="Telefone" value={form.private_insurance_phone} onChange={handleMaskedChange("private_insurance_phone", maskPhone)} {...phoneInputProps} />
            </>
          )}
        </FormSection>

        <FormSection title="Observação">
          <div style={styles.fieldFull}>
            <label style={styles.label}>Observação</label>
            <textarea value={form.observation} onChange={handleInputChange("observation")} style={styles.textarea} />
          </div>
        </FormSection>

        <FormSection title="Ciência e assinatura">
          <div style={styles.fieldFull}>
            <label style={styles.label}>Texto de ciência</label>
            <div style={styles.infoBox}>{SCIENCE_TEXT}</div>
          </div>
          <TextField label="Data" value={form.acknowledgement_date} onChange={handleMaskedChange("acknowledgement_date", maskDate)} onBlur={handleDateBlur("acknowledgement_date", "Data de ciência")} {...dateInputProps} />
          <TextField label="Assinatura do PM" value={form.acknowledgement_signature} onChange={handleInputChange("acknowledgement_signature")} />
        </FormSection>

        <div style={styles.footerActions}>
          <button type="button" onClick={handleClear} style={{ ...styles.button, ...styles.secondaryButton }}>
            {isEditMode ? "Restaurar Dados" : "Limpar Formulário"}
          </button>
          <button type="submit" disabled={isSubmitting} style={{ ...styles.button, ...styles.primaryButton }}>
            {isSubmitting
              ? "Salvando..."
              : isEditMode
                ? "Salvar Alterações"
                : "Salvar Cadastro"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PoliceOfficerRegistrationForm;


