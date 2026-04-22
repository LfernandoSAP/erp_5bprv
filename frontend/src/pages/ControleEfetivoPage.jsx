import { useEffect, useMemo, useState } from "react";

import ReportExportButtons from "../components/ReportExportButtons";
import { appShellStyles as styles } from "../components/appShellStyles";
import {
  createControleEfetivo,
  deleteControleEfetivo,
  getControleEfetivo,
  getControleEfetivoById,
  updateControleEfetivo,
} from "../services/controleEfetivoService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getUnits } from "../services/referenceDataService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

const OPM_CODES = {
  "5BPRv EM": "620050000",
  "5BPRv-EM": "620050000",
  "1Cia": "620051000",
  "1Pel da 1Cia": "620051100",
  "2Pel da 1Cia": "620051200",
  "2Cia": "620052000",
  "1Pel da 2Cia": "620052100",
  "2Pel da 2Cia": "620052200",
  "3Cia": "620053000",
  "1Pel da 3Cia": "620053100",
  "2Pel da 3Cia": "620053200",
  "4Cia": "620054000",
  "1Pel da 4Cia": "620054100",
  "2Pel da 4Cia": "620054200",
};

function resolveOpmCode(unitLabel) {
  const normalized = String(unitLabel || "").trim();
  return OPM_CODES[normalized] || "-";
}

const QUADRO_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "QOPM", label: "QOPM" },
  { value: "QAOPM", label: "QAOPM" },
  { value: "QPP", label: "QPP" },
];

const SITUAÇÃO_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "ADIDO", label: "Adido" },
  { value: "AGREGADO", label: "Agregado" },
  { value: "EFETIVO", label: "Efetivo" },
  { value: "EFETIVO_ADIDO", label: "Efetivo Adido" },
  { value: "EFETIVO_DISP_AG_INT", label: "Efetivo Disp Ag Int" },
  { value: "EFETIVO_DISP_AG_INT_PF", label: "Efetivo Disp Ag Int - PF" },
  { value: "OUTROS", label: "Outros" },
];

const YES_NO_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
];

const ESCOLARIDADE_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "FUNDAMENTAL_INCOMPLETO", label: "Fundamental Incompleto" },
  { value: "FUNDAMENTAL_COMPLETO", label: "Fundamental Completo" },
  { value: "MEDIO_INCOMPLETO", label: "Médio Incompleto" },
  { value: "MEDIO_COMPLETO", label: "Médio Completo" },
  { value: "SUPERIOR_INCOMPLETO", label: "Superior Incompleto" },
  { value: "SUPERIOR_COMPLETO", label: "Superior Completo" },
  { value: "POS_GRADUACAO_ESPECIALIZACAO", label: "Pós-Graduação / Especialização" },
  { value: "MESTRADO", label: "Mestrado" },
  { value: "DOUTORADO", label: "Doutorado" },
];

const TABLE_COLUMNS = [
  { key: "re_dc", label: "RE", width: 14 },
  { key: "quadro", label: "QUADRO", width: 12 },
  { key: "nome", label: "NOME", width: 28 },
  { key: "unidade", label: "UNIDADE", width: 18 },
  { key: "opm_atual", label: "OPM ATUAL", width: 14 },
  { key: "situacao", label: "SITUAÇÃO", width: 18 },
  { key: "data_25_anos", label: "25 ANOS", width: 14 },
  { key: "status_label", label: "STATUS", width: 12 },
];

function normalizeDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function formatCpf(value) {
  const digits = normalizeDigits(value, 11);
  if (!digits) return "";
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatPhone(value) {
  const digits = normalizeDigits(value, 11);
  if (!digits) return "";
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function formatDateInput(value) {
  const digits = normalizeDigits(value, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDate(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parts = trimmed.includes("/") ? trimmed.split("/") : trimmed.split("-");
  if (parts.length !== 3) return null;
  let day;
  let month;
  let year;
  if (trimmed.includes("/")) {
    [day, month, year] = parts.map((part) => Number(part));
  } else {
    [year, month, day] = parts.map((part) => Number(part));
  }
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(value) {
  const parsed = parseDate(value);
  if (!parsed) return String(value || "");
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculate25YearsStatus(value) {
  const target = parseDate(value);
  if (!target) {
    return { tone: "neutral", label: value || "-" };
  }
  const diffDays = (target.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 0) return { tone: "active", label: value };
  if (diffDays <= 365) return { tone: "warning", label: value };
  return { tone: "neutral", label: value };
}

function calculateDate25Years(value) {
  const parsed = parseDate(value);
  if (!parsed) return "";
  const calculated = new Date(parsed);
  calculated.setFullYear(calculated.getFullYear() + 25);
  return formatDate(calculated.toISOString().slice(0, 10));
}

function createInitialForm() {
  return {
    unitId: "",
    policeOfficerId: "",
    reDc: "",
    quadro: "",
    nome: "",
    sexo: "",
    unidade: "",
    opmAtual: "-",
    situacao: "",
    situacaoOutros: "",
    obsSituacao: "",
    sinesp: "",
    processoRegular: "",
    numeroProcesso: "",
    cepTranRv: "",
    cprv: "",
    dataAdmissao: "",
    data25Anos: "",
    dataApresentacao: "",
    dataNascimento: "",
    averbacaoInss: "",
    averbacaoMilitar: "",
    inatividade: "",
    nivelEscolaridade: "",
    curso: "",
    rg: "",
    cpf: "",
    telefoneCelular: "",
    telefone2: "",
    emailFuncional: "",
  };
}

function mapOfficerToImportedFields(officer) {
  const unidade = officer.unit_label || "-";
  return {
    unitId: officer.unit_id ? String(officer.unit_id) : "",
    policeOfficerId: String(officer.id),
    reDc: officer.re_with_digit || "",
    nome: officer.full_name || "",
    sexo: "Não cadastrado no P1",
    unidade,
    opmAtual: resolveOpmCode(unidade),
    dataAdmissao: officer.admission_date ? formatDate(officer.admission_date) : "",
    data25Anos: officer.admission_date ? calculateDate25Years(officer.admission_date) : "",
    dataNascimento: officer.birth_date ? formatDate(officer.birth_date) : "",
    nivelEscolaridade: officer.education_level || "",
    curso: officer.higher_education_course || "",
    rg: officer.rg || "",
    cpf: formatCpf(officer.cpf || ""),
    telefoneCelular: formatPhone(officer.cell_phone || ""),
    emailFuncional: officer.functional_email || "",
  };
}

function readOnlyInputStyle() {
  return {
    ...styles.input,
    backgroundColor: "var(--app-surface-soft)",
    color: "var(--app-text-soft)",
  };
}

function DetailField({ label, value, fullWidth = false, children }) {
  return (
    <div style={fullWidth ? styles.fieldFull : styles.field}>
      <span style={styles.label}>{label}</span>
      {children || (
        <div style={{ ...styles.input, minHeight: "46px", display: "flex", alignItems: "center" }}>
          {value || "-"}
        </div>
      )}
    </div>
  );
}

function Badge({ tone, label }) {
  let toneStyle = styles.neutralBadge;
  if (tone === "active") toneStyle = styles.activeBadge;
  if (tone === "warning") toneStyle = styles.infoBadge;
  if (tone === "danger") toneStyle = styles.inactiveBadge;
  return <span style={{ ...styles.badge, ...toneStyle }}>{label}</span>;
}

function ControleEfetivoPage({ onBack, onEditPoliceOfficer }) {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [units, setUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuadro, setFilterQuadro] = useState("");
  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterSituacao, setFilterSituacao] = useState("");
  const [filterCprv, setFilterCprv] = useState("");
  const [filterSinesp, setFilterSinesp] = useState("");
  const [form, setForm] = useState(createInitialForm());
  const [officerSearchTerm, setOfficerSearchTerm] = useState("");
  const [officerSuggestions, setOfficerSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadUnits();
    void loadItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (officerSearchTerm.trim().length < 3 || form.policeOfficerId) {
      setOfficerSuggestions([]);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const officers = await getPoliceOfficers(officerSearchTerm.trim(), null, { includeInactive: true });
        setOfficerSuggestions(officers.slice(0, 8));
      } catch (fetchError) {
        setError(fetchError.message || "Erro ao buscar policiais.");
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [officerSearchTerm, form.policeOfficerId]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filterQuadro && item.quadro !== filterQuadro) return false;
      if (filterUnitId && String(item.unit_id) !== String(filterUnitId)) return false;
      if (filterSituacao && item.situacao !== filterSituacao) return false;
      if (filterCprv && item.cprv !== filterCprv) return false;
      if (filterSinesp && item.sinesp !== filterSinesp) return false;
      return true;
    });
  }, [items, filterQuadro, filterUnitId, filterSituacao, filterCprv, filterSinesp]);

  async function loadUnits() {
    const data = await getUnits({ activeOnly: false });
    setUnits(data);
  }

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const data = await getControleEfetivo({ q: searchTerm.trim() });
      setItems(
        data.map((item) => ({
          ...item,
          status_label: item.is_active === false ? "Inativo" : "Ativo",
        }))
      );
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar o controle de efetivo.");
    } finally {
      setLoading(false);
    }
  }

  function handleOfficerSelect(officer) {
    const imported = mapOfficerToImportedFields(officer);
    setForm((current) => ({
      ...current,
      ...imported,
    }));
    setOfficerSearchTerm(imported.reDc || imported.nome || "");
    setOfficerSuggestions([]);
  }

  function handleClearOfficer() {
    setForm((current) => ({
      ...current,
      unitId: "",
      policeOfficerId: "",
      reDc: "",
      nome: "",
      sexo: "",
      unidade: "",
      opmAtual: "-",
      dataAdmissao: "",
      data25Anos: "",
      dataNascimento: "",
      nivelEscolaridade: "",
      curso: "",
      rg: "",
      cpf: "",
      telefoneCelular: "",
      emailFuncional: "",
    }));
    setOfficerSearchTerm("");
    setOfficerSuggestions([]);
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        unit_id: form.unitId ? Number(form.unitId) : null,
        police_officer_id: form.policeOfficerId ? Number(form.policeOfficerId) : null,
        re_dc: form.reDc,
        quadro: form.quadro,
        nome: form.nome,
        sexo: form.sexo || null,
        unidade: form.unidade || null,
        opm_atual: form.opmAtual || null,
        sinesp: form.sinesp || null,
        processo_regular: form.processoRegular || null,
        numero_processo: form.numeroProcesso || null,
        situacao: form.situacao,
        situacao_outros: form.situacao === "OUTROS" ? form.situacaoOutros : null,
        obs_situacao: form.obsSituacao || null,
        cep_tran_rv: form.cepTranRv || null,
        data_admissao: form.dataAdmissao || null,
        data_25_anos: form.data25Anos || null,
        averbacao_inss: form.averbacaoInss || null,
        averbacao_militar: form.averbacaoMilitar || null,
        inatividade: form.inatividade || null,
        cprv: form.cprv || null,
        data_apresentacao: form.dataApresentacao || null,
        data_nascimento: form.dataNascimento || null,
        nivel_escolaridade: form.nivelEscolaridade || null,
        curso: form.curso || null,
        rg: form.rg || null,
        cpf: normalizeDigits(form.cpf, 11) || null,
        telefone_celular: normalizeDigits(form.telefoneCelular, 11) || null,
        telefone_2: normalizeDigits(form.telefone2, 11) || null,
        email_funcional: form.emailFuncional || null,
        is_active: true,
      };

      if (editingId) {
        await updateControleEfetivo(editingId, payload);
        setSuccess("Registro do efetivo atualizado com sucesso.");
      } else {
        await createControleEfetivo(payload);
        setSuccess("Registro do efetivo cadastrado com sucesso.");
      }

      setForm(createInitialForm());
      setOfficerSearchTerm("");
      setOfficerSuggestions([]);
      setEditingId(null);
      setSelectedItem(null);
      setShowForm(false);
      await loadItems();
    } catch (saveError) {
      setError(saveError.message || "Erro ao salvar o controle de efetivo.");
    }
  }

  async function handleView(item) {
    try {
      const details = await getControleEfetivoById(item.id);
      setSelectedItem(details);
    } catch (detailError) {
      setError(detailError.message || "Erro ao carregar o registro do efetivo.");
    }
  }

  async function handleEdit(item) {
    try {
      const details = await getControleEfetivoById(item.id);
      setEditingId(details.id);
      setForm({
        unitId: details.unit_id ? String(details.unit_id) : "",
        policeOfficerId: details.police_officer_id ? String(details.police_officer_id) : "",
        reDc: details.re_dc || "",
        quadro: details.quadro || "",
        nome: details.nome || "",
        sexo: details.sexo || "",
        unidade: details.unidade || "",
        opmAtual: details.opm_atual || "-",
        situacao: details.situacao || "",
        situacaoOutros: details.situacao_outros || "",
        obsSituacao: details.obs_situacao || "",
        sinesp: details.sinesp || "",
        processoRegular: details.processo_regular || "",
        numeroProcesso: details.numero_processo || "",
        cepTranRv: details.cep_tran_rv || "",
        cprv: details.cprv || "",
        dataAdmissao: details.data_admissao || "",
        data25Anos: details.data_25_anos || "",
        dataApresentacao: details.data_apresentacao || "",
        dataNascimento: details.data_nascimento || "",
        averbacaoInss: details.averbacao_inss || "",
        averbacaoMilitar: details.averbacao_militar || "",
        inatividade: details.inatividade || "",
        nivelEscolaridade: details.nivel_escolaridade || "",
        curso: details.curso || "",
        rg: details.rg || "",
        cpf: formatCpf(details.cpf || ""),
        telefoneCelular: formatPhone(details.telefone_celular || ""),
        telefone2: formatPhone(details.telefone_2 || ""),
        emailFuncional: details.email_funcional || "",
      });
      setOfficerSearchTerm(details.re_dc || details.nome || "");
      setOfficerSuggestions([]);
      setSelectedItem(null);
      setShowForm(true);
    } catch (editError) {
      setError(editError.message || "Erro ao editar o registro do efetivo.");
    }
  }

  async function handleDelete(item) {
    try {
      await deleteControleEfetivo(item.id);
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      setSuccess("Registro removido da listagem do efetivo.");
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao excluir o registro do efetivo.");
    }
  }

  function renderImportedField(label, value) {
    return (
      <div style={styles.field}>
        <label style={styles.label}>
          {label} <span style={{ opacity: 0.8 }}>(importado)</span>
        </label>
        <input value={value || ""} readOnly style={readOnlyInputStyle()} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Controle de Efetivo</h1>
        <p style={styles.subtitle}>Gerencie o efetivo do 5BPRv.</p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm(createInitialForm());
              setOfficerSearchTerm("");
              setShowForm(true);
            }}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            + Novo Registro
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {showForm ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>{editingId ? "Editar registro do efetivo" : "Novo registro do efetivo"}</h2>
          <form onSubmit={handleSave}>
            <div style={styles.formGrid}>
              <div style={{ ...styles.field, position: "relative" }}>
                <label style={styles.label}>RE *</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    value={officerSearchTerm}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (form.policeOfficerId) {
                        handleClearOfficer();
                      }
                      setOfficerSearchTerm(nextValue);
                    }}
                    placeholder="Digite 3+ caracteres do RE"
                    style={styles.input}
                    required
                  />
                  {(form.policeOfficerId || officerSearchTerm) ? (
                    <button
                      type="button"
                      onClick={handleClearOfficer}
                      style={{ ...styles.button, ...styles.secondaryButton, padding: "10px 14px" }}
                    >
                      X
                    </button>
                  ) : null}
                </div>
                {officerSuggestions.length ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      right: 0,
                      zIndex: 30,
                      border: "1px solid var(--app-border-strong)",
                      borderRadius: "14px",
                      backgroundColor: "var(--app-surface)",
                      boxShadow: "var(--app-shadow-soft)",
                      overflow: "hidden",
                    }}
                  >
                    {officerSuggestions.map((officer) => (
                      <button
                        key={officer.id}
                        type="button"
                        onClick={() => handleOfficerSelect(officer)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          border: "none",
                          background: "transparent",
                          color: "var(--app-text)",
                          borderBottom: "1px solid var(--app-border)",
                        }}
                      >
                        {`${officer.re_with_digit} | ${officer.rank || "-"} | ${officer.full_name}`}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>QUADRO *</label>
                <select
                  value={form.quadro}
                  onChange={(event) => setForm((current) => ({ ...current, quadro: event.target.value }))}
                  style={styles.input}
                  required
                >
                  {QUADRO_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {renderImportedField("NOME", form.nome)}
              {renderImportedField("SEXO", form.sexo || "Não cadastrado no P1")}
              {renderImportedField("UNIDADE", form.unidade)}
              {renderImportedField("OPM ATUAL", form.opmAtual)}

              <div style={styles.field}>
                <label style={styles.label}>SITUAÇÃO *</label>
                <select
                  value={form.situacao}
                  onChange={(event) => setForm((current) => ({ ...current, situacao: event.target.value }))}
                  style={styles.input}
                  required
                >
                  {SITUAÇÃO_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.situacao === "OUTROS" ? (
                <div style={styles.field}>
                  <label style={styles.label}>Especificar Situação *</label>
                  <input
                    value={form.situacaoOutros}
                    onChange={(event) => setForm((current) => ({ ...current, situacaoOutros: event.target.value }))}
                    style={styles.input}
                    required
                  />
                </div>
              ) : null}

              <div style={styles.field}>
                <label style={styles.label}>SINESP</label>
                <select
                  value={form.sinesp}
                  onChange={(event) => setForm((current) => ({ ...current, sinesp: event.target.value }))}
                  style={styles.input}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={`sinesp-${option.value || "empty"}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>PROCESSO REGULAR</label>
                <select
                  value={form.processoRegular}
                  onChange={(event) => setForm((current) => ({ ...current, processoRegular: event.target.value }))}
                  style={styles.input}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={`proc-${option.value || "empty"}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.processoRegular === "SIM" ? (
                <div style={styles.field}>
                  <label style={styles.label}>Nº do Processo *</label>
                  <input
                    value={form.numeroProcesso}
                    onChange={(event) => setForm((current) => ({ ...current, numeroProcesso: event.target.value }))}
                    placeholder="Digite o nº do processo"
                    style={styles.input}
                    required
                  />
                </div>
              ) : null}

              <div style={styles.field}>
                <label style={styles.label}>CEP Tran Rv</label>
                <select
                  value={form.cepTranRv}
                  onChange={(event) => setForm((current) => ({ ...current, cepTranRv: event.target.value }))}
                  style={styles.input}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={`cep-${option.value || "empty"}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>CPRv</label>
                <select
                  value={form.cprv}
                  onChange={(event) => setForm((current) => ({ ...current, cprv: event.target.value }))}
                  style={styles.input}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={`cprv-${option.value || "empty"}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {renderImportedField("ADMISSÃO", form.dataAdmissao)}

              <DetailField label="25 ANOS DE SERVIÇO">
                <div style={{ ...readOnlyInputStyle(), display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span>{form.data25Anos || "-"}</span>
                  {form.data25Anos ? (
                    <Badge
                      tone={calculate25YearsStatus(form.data25Anos).tone}
                      label={calculate25YearsStatus(form.data25Anos).label}
                    />
                  ) : null}
                </div>
              </DetailField>

              <div style={styles.field}>
                <label style={styles.label}>Data de Apresentação</label>
                <input
                  value={form.dataApresentacao}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dataApresentacao: formatDateInput(event.target.value),
                    }))
                  }
                  placeholder="DD/MM/AAAA"
                  style={styles.input}
                />
              </div>

              {renderImportedField("DATA DE NASCIMENTO", form.dataNascimento)}

              <div style={styles.field}>
                <label style={styles.label}>Averbação INSS/Outros Órgãos</label>
                <input
                  value={form.averbacaoInss}
                  onChange={(event) => setForm((current) => ({ ...current, averbacaoInss: event.target.value }))}
                  placeholder="Digite o número"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Averbação Militar</label>
                <input
                  value={form.averbacaoMilitar}
                  onChange={(event) => setForm((current) => ({ ...current, averbacaoMilitar: event.target.value }))}
                  placeholder="Digite o número"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Inatividade</label>
                <input
                  value={form.inatividade}
                  onChange={(event) => setForm((current) => ({ ...current, inatividade: event.target.value }))}
                  placeholder="Digite o número"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nível de Escolaridade</label>
                <select
                  value={form.nivelEscolaridade}
                  onChange={(event) => setForm((current) => ({ ...current, nivelEscolaridade: event.target.value }))}
                  style={styles.input}
                >
                  {ESCOLARIDADE_OPTIONS.map((option) => (
                    <option key={`esc-${option.value || "empty"}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Curso</label>
                <input
                  value={form.curso}
                  onChange={(event) => setForm((current) => ({ ...current, curso: event.target.value }))}
                  placeholder="Nome do curso realizado"
                  style={styles.input}
                />
              </div>

              {renderImportedField("RG", form.rg)}
              {renderImportedField("CPF", form.cpf)}
              {renderImportedField("TELEFONE CELULAR", form.telefoneCelular)}

              <div style={styles.field}>
                <label style={styles.label}>Telefone 2</label>
                <input
                  value={form.telefone2}
                  onChange={(event) => setForm((current) => ({ ...current, telefone2: formatPhone(event.target.value) }))}
                  placeholder="(00) 00000-0000"
                  style={styles.input}
                />
              </div>

              {renderImportedField("E-MAIL FUNCIONAL", form.emailFuncional)}

              <div style={styles.fieldFull}>
                <label style={styles.label}>Observação de Situação</label>
                <textarea
                  value={form.obsSituacao}
                  onChange={(event) => setForm((current) => ({ ...current, obsSituacao: event.target.value }))}
                  placeholder="Detalhes sobre a situação"
                  style={styles.textarea}
                />
              </div>
            </div>

            {form.policeOfficerId ? (
              <p style={{ ...styles.helperText, marginTop: "12px" }}>
                Dados importados do cadastro P1 ·{" "}
                <button
                  type="button"
                  onClick={() => onEditPoliceOfficer?.(Number(form.policeOfficerId))}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--app-primary)",
                    padding: 0,
                    fontWeight: 700,
                  }}
                >
                  Editar cadastro do policial
                </button>
              </p>
            ) : null}

            <div style={styles.footerActions}>
              <button type="button" onClick={() => setShowForm(false)} style={{ ...styles.button, ...styles.secondaryButton }}>
                Cancelar
              </button>
              <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
                Salvar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {selectedItem ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes do Controle de Efetivo</h2>
              <p style={styles.sectionText}>Visualização completa do registro selecionado.</p>
            </div>
            <div style={styles.tableHeaderActions}>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ ...styles.button, ...styles.secondaryButton }}>
                Voltar
              </button>
              <button type="button" onClick={() => void handleEdit(selectedItem)} style={{ ...styles.button, ...styles.primaryButton }}>
                Editar
              </button>
            </div>
          </div>
          <div style={styles.formGrid}>
            <DetailField label="RE" value={selectedItem.re_dc} />
            <DetailField label="Quadro" value={selectedItem.quadro} />
            <DetailField label="Nome" value={selectedItem.nome} fullWidth />
            <DetailField label="Sexo" value={selectedItem.sexo || "Não cadastrado no P1"} />
            <DetailField label="Unidade" value={selectedItem.unidade} />
            <DetailField label="OPM Atual" value={selectedItem.opm_atual} />
            <DetailField label="Situação" value={selectedItem.situacao} />
            {selectedItem.situacao_outros ? <DetailField label="Especificar Situação" value={selectedItem.situacao_outros} /> : null}
            <DetailField label="SINESP" value={selectedItem.sinesp} />
            <DetailField label="Processo Regular" value={selectedItem.processo_regular} />
            <DetailField label="Nº do Processo" value={selectedItem.numero_processo} />
            <DetailField label="CEP Tran Rv" value={selectedItem.cep_tran_rv} />
            <DetailField label="CPRv" value={selectedItem.cprv} />
            <DetailField label="Admissão" value={selectedItem.data_admissao} />
            <DetailField label="25 Anos" value={selectedItem.data_25_anos} />
            <DetailField label="Data de Apresentação" value={selectedItem.data_apresentacao} />
            <DetailField label="Data de Nascimento" value={selectedItem.data_nascimento} />
            <DetailField label="Averbação INSS/Outros Órgãos" value={selectedItem.averbacao_inss} />
            <DetailField label="Averbação Militar" value={selectedItem.averbacao_militar} />
            <DetailField label="Inatividade" value={selectedItem.inatividade} />
            <DetailField label="Nível de Escolaridade" value={selectedItem.nivel_escolaridade} />
            <DetailField label="Curso" value={selectedItem.curso} />
            <DetailField label="RG" value={selectedItem.rg} />
            <DetailField label="CPF" value={formatCpf(selectedItem.cpf || "")} />
            <DetailField label="Telefone Celular" value={formatPhone(selectedItem.telefone_celular || "")} />
            <DetailField label="Telefone 2" value={formatPhone(selectedItem.telefone_2 || "")} />
            <DetailField label="E-mail Funcional" value={selectedItem.email_funcional} />
            <DetailField label="Observação de Situação" value={selectedItem.obs_situacao} fullWidth />
          </div>
        </section>
      ) : null}

      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Controle de Efetivo</h2>
            <p style={styles.tableMeta}>{visibleItems.length} policiais cadastrados no efetivo</p>
          </div>
          <ReportExportButtons
            disabled={!visibleItems.length}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "controle_efetivo",
                sheetName: "Controle de Efetivo",
                title: "Controle de Efetivo",
                subtitle: "Exportação completa dos registros filtrados",
                columns: TABLE_COLUMNS.map((column) => ({ key: column.key, label: column.label, width: column.width })),
                rows: visibleItems.map((item) => ({ ...item, status_label: item.is_active === false ? "Inativo" : "Ativo" })),
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "controle_efetivo",
                title: "Controle de Efetivo",
                subtitle: "Exportação completa dos registros filtrados",
                columns: TABLE_COLUMNS.map((column) => ({ key: column.key, label: column.label })),
                rows: visibleItems.map((item) => ({ ...item, status_label: item.is_active === false ? "Inativo" : "Ativo" })),
                orientation: "landscape",
              })
            }
          />
        </div>
        <div style={{ ...styles.card, margin: "16px" }}>
          <div style={styles.actions}>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar por RE, nome ou nº do processo"
              style={{ ...styles.input, ...styles.actionFieldWide }}
            />
            <select value={filterQuadro} onChange={(event) => setFilterQuadro(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              <option value="">Todos os quadros</option>
              {QUADRO_OPTIONS.slice(1).map((option) => (
                <option key={`f-quadro-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select value={filterUnitId} onChange={(event) => setFilterUnitId(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              <option value="">Todas as unidades</option>
              {units.map((unit) => (
                <option key={`f-unit-${unit.id}`} value={unit.id}>
                  {unit.display_name || unit.name}
                </option>
              ))}
            </select>
            <select value={filterSituacao} onChange={(event) => setFilterSituacao(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              <option value="">Todas as situações</option>
              {SITUAÇÃO_OPTIONS.slice(1).map((option) => (
                <option key={`f-situ-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select value={filterCprv} onChange={(event) => setFilterCprv(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              <option value="">Todos os CPRv</option>
              {YES_NO_OPTIONS.slice(1).map((option) => (
                <option key={`f-cprv-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select value={filterSinesp} onChange={(event) => setFilterSinesp(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              <option value="">Todos os Sinesp</option>
              {YES_NO_OPTIONS.slice(1).map((option) => (
                <option key={`f-sinesp-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button onClick={() => void loadItems()} style={{ ...styles.button, ...styles.primaryButton }}>
              Pesquisar
            </button>
          </div>
        </div>

        <div style={{ ...styles.tableWrap, overflowX: "auto" }}>
          <table style={{ ...styles.table, minWidth: "1400px" }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, position: "sticky", left: 0, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "80px" }}>VER</th>
                <th style={{ ...styles.th, position: "sticky", left: 80, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "120px" }}>RE</th>
                <th style={{ ...styles.th, position: "sticky", left: 200, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "260px" }}>NOME</th>
                <th style={styles.th}>QUADRO</th>
                <th style={styles.th}>UNIDADE</th>
                <th style={styles.th}>OPM ATUAL</th>
                <th style={styles.th}>SITUAÇÃO</th>
                <th style={styles.th}>25 ANOS</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, index) => {
                const rowBg = index % 2 === 1 ? "var(--app-surface-muted)" : "var(--app-surface)";
                const badge25 = calculate25YearsStatus(item.data_25_anos);
                return (
                  <tr key={item.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                    <td style={{ ...styles.td, position: "sticky", left: 0, zIndex: 3, backgroundColor: rowBg }}>
                      <button
                        type="button"
                        onClick={() => void handleView(item)}
                        style={{
                          ...styles.button,
                          ...styles.infoButton,

                          padding: "8px 12px",
                          minWidth: "52px",
                        }}
                      >
                        Ver
                      </button>
                    </td>
                    <td style={{ ...styles.td, position: "sticky", left: 80, zIndex: 2, backgroundColor: rowBg }}>{item.re_dc || "-"}</td>
                    <td style={{ ...styles.td, position: "sticky", left: 200, zIndex: 2, backgroundColor: rowBg }}>{item.nome || "-"}</td>
                    <td style={styles.td}>{item.quadro || "-"}</td>
                    <td style={styles.td}>{item.unidade || "-"}</td>
                    <td style={styles.td}>{item.opm_atual || "-"}</td>
                    <td style={styles.td}>{item.situacao || "-"}</td>
                    <td style={styles.td}>
                      <Badge tone={badge25.tone} label={badge25.label} />
                    </td>
                    <td style={styles.td}>
                      <Badge tone={item.is_active === false ? "danger" : "active"} label={item.is_active === false ? "Inativo" : "Ativo"} />
                    </td>
                    <td style={styles.td}>
                      <div style={styles.tableActionGroup}>
                        <button type="button" onClick={() => void handleEdit(item)} style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}>
                          Editar
                        </button>
                        <button type="button" onClick={() => void handleDelete(item)} style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && visibleItems.length === 0 ? <div style={styles.emptyState}>Nenhum policial cadastrado no controle de efetivo.</div> : null}
          {loading ? <div style={styles.emptyState}>Carregando controle de efetivo...</div> : null}
        </div>
      </section>
    </div>
  );
}

export default ControleEfetivoPage;

