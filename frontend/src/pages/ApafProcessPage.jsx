import { useEffect, useMemo, useState } from "react";

import ReportExportButtons from "../components/ReportExportButtons";
import { appShellStyles as styles } from "../components/appShellStyles";
import {
  createApafProcesso,
  deleteApafProcesso,
  getApafProcesso,
  getApafProcessos,
  updateApafProcesso,
} from "../services/apafProcessService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess } from "../utils/authAccess";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

const STATUS_FIELD_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "SOLICITADO", label: "Solicitado" },
  { value: "RECEBIDO", label: "Recebido" },
  { value: "NAO_SE_APLICA", label: "Não se aplica" },
];

const CERT_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "SOLICITADA", label: "Solicitada" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "NAO_SE_APLICA", label: "Não se aplica" },
];

const COMP_RES_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "DIGITALIZADO", label: "Digitalizado" },
  { value: "NAO_SE_APLICA", label: "Não se aplica" },
];

const TABLE_COLUMNS = [
  { key: "re_dc", label: "RE", width: 14 },
  { key: "posto_graduacao", label: "POSTO/GRAD.", width: 18 },
  { key: "nome", label: "NOME", width: 28 },
  { key: "cia_entregou", label: "CIA ENTREGOU", width: 18 },
  { key: "data_entrada", label: "ENTRADA", width: 14 },
  { key: "parte", label: "PARTE", width: 16 },
  { key: "sigma", label: "SIGMA", width: 16 },
  { key: "data_cadastro", label: "CADASTRO", width: 14 },
  { key: "solic_consulta_pi", label: "SOLIC. CONSULTA PI", width: 18 },
  { key: "sei", label: "SEI", width: 16 },
  { key: "envio_cprv_link", label: "ENVIO CPRv LINK", width: 22 },
  { key: "cert_1", label: "CERT. 1", width: 14 },
  { key: "cert_2", label: "CERT. 2", width: 14 },
  { key: "cert_3", label: "CERT. 3", width: 14 },
  { key: "rg", label: "RG", width: 14 },
  { key: "cpf", label: "CPF", width: 18 },
  { key: "comp_residencia", label: "COMP. RES.", width: 16 },
  { key: "boletim_geral", label: "BOL. G", width: 16 },
  { key: "apafi", label: "APAFI", width: 16 },
  { key: "data_entrega", label: "ENTREGA", width: 14 },
  { key: "observacao", label: "OBSERVAÇÃO", width: 32 },
];

function formatToday() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function createInitialForm() {
  return {
    policeOfficerId: "",
    re_dc: "",
    posto_graduacao: "",
    nome: "",
    cia_entregou: "",
    data_entrada: "",
    parte: "",
    sigma: "",
    data_cadastro: formatToday(),
    solic_consulta_pi: "",
    sei: "",
    envio_cprv_link: "",
    cert_1: "",
    cert_2: "",
    cert_3: "",
    rg: "",
    cpf: "",
    comp_residencia: "",
    boletim_geral: "",
    apafi: "",
    data_entrega: "",
    observacao: "",
  };
}

function DetailField({ label, value, fullWidth = false }) {
  return (
    <div style={fullWidth ? styles.fieldFull : styles.field}>
      <span style={styles.label}>{label}</span>
      <div style={{ ...styles.input, minHeight: "46px", display: "flex", alignItems: "center" }}>
        {value || "-"}
      </div>
    </div>
  );
}

function ApafProcessPage({ onBack, startWithForm = false }) {
  const access = readViewerAccess();
  const [showForm, setShowForm] = useState(startWithForm);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCia, setFilterCia] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [form, setForm] = useState(createInitialForm());
  const [units, setUnits] = useState([]);
  const [officerSuggestions, setOfficerSuggestions] = useState([]);
  const [officerSearchTerm, setOfficerSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadUnits();
    void loadItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setShowForm(startWithForm);
  }, [startWithForm]);

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
      if (filterCia && item.cia_entregou !== filterCia) {
        return false;
      }
      if (filterStatus) {
        const statuses = [
          item.solic_consulta_pi,
          item.cert_1,
          item.cert_2,
          item.cert_3,
          item.comp_residencia,
        ];
        if (!statuses.includes(filterStatus)) {
          return false;
        }
      }
      if (filterDateFrom && (item.data_entrada || "") < filterDateFrom) {
        return false;
      }
      if (filterDateTo && (item.data_entrada || "") > filterDateTo) {
        return false;
      }
      return true;
    });
  }, [items, filterCia, filterStatus, filterDateFrom, filterDateTo]);

  async function loadUnits() {
    const data = await getUnits();
    setUnits(data);
  }

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const data = await getApafProcessos(searchTerm.trim());
      setItems(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar processos APAF.");
    } finally {
      setLoading(false);
    }
  }

  function handleOfficerSelect(officer) {
    setForm((current) => ({
      ...current,
      policeOfficerId: String(officer.id),
      re_dc: officer.re_with_digit || "",
      posto_graduacao: officer.rank || "",
      nome: officer.full_name || "",
      rg: officer.rg || "",
      cpf: formatCpf(officer.cpf || ""),
    }));
    setOfficerSearchTerm(officer.re_with_digit || officer.full_name || "");
    setOfficerSuggestions([]);
  }

  function handleClearOfficer() {
    setForm((current) => ({
      ...current,
      policeOfficerId: "",
      re_dc: "",
      posto_graduacao: "",
      nome: "",
      rg: "",
      cpf: "",
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
        unit_id: Number(access.unitId || "0") || 1,
        police_officer_id: form.policeOfficerId ? Number(form.policeOfficerId) : null,
        re_dc: form.re_dc,
        posto_graduacao: form.posto_graduacao,
        nome: form.nome,
        cia_entregou: form.cia_entregou,
        data_entrada: form.data_entrada,
        parte: form.parte,
        sigma: form.sigma,
        data_cadastro: form.data_cadastro,
        solic_consulta_pi: form.solic_consulta_pi,
        sei: form.sei,
        envio_cprv_link: form.envio_cprv_link,
        cert_1: form.cert_1,
        cert_2: form.cert_2,
        cert_3: form.cert_3,
        rg: form.rg,
        cpf: form.cpf,
        comp_residencia: form.comp_residencia,
        boletim_geral: form.boletim_geral,
        apafi: form.apafi,
        data_entrega: form.data_entrega,
        observacao: form.observacao,
        is_active: true,
      };

      if (editingId) {
        await updateApafProcesso(editingId, payload);
        setSuccess("Processo APAF atualizado com sucesso.");
      } else {
        await createApafProcesso(payload);
        setSuccess("Processo APAF cadastrado com sucesso.");
      }

      setForm(createInitialForm());
      setOfficerSearchTerm("");
      setOfficerSuggestions([]);
      setEditingId(null);
      setSelectedItem(null);
      setShowForm(false);
      await loadItems();
    } catch (saveError) {
      setError(saveError.message || "Erro ao salvar processo APAF.");
    }
  }

  async function handleView(item) {
    try {
      const details = await getApafProcesso(item.id);
      setSelectedItem(details);
    } catch (detailError) {
      setError(detailError.message || "Erro ao carregar processo APAF.");
    }
  }

  async function handleEdit(item) {
    const details = await getApafProcesso(item.id);
    setEditingId(details.id);
    setForm({
      policeOfficerId: details.police_officer_id ? String(details.police_officer_id) : "",
      re_dc: details.re_dc || "",
      posto_graduacao: details.posto_graduacao || "",
      nome: details.nome || "",
      cia_entregou: details.cia_entregou || "",
      data_entrada: details.data_entrada || "",
      parte: details.parte || "",
      sigma: details.sigma || "",
      data_cadastro: details.data_cadastro || formatToday(),
      solic_consulta_pi: details.solic_consulta_pi || "",
      sei: details.sei || "",
      envio_cprv_link: details.envio_cprv_link || "",
      cert_1: details.cert_1 || "",
      cert_2: details.cert_2 || "",
      cert_3: details.cert_3 || "",
      rg: details.rg || "",
      cpf: formatCpf(details.cpf || ""),
      comp_residencia: details.comp_residencia || "",
      boletim_geral: details.boletim_geral || "",
      apafi: details.apafi || "",
      data_entrega: details.data_entrega || "",
      observacao: details.observacao || "",
    });
    setOfficerSearchTerm(details.re_dc || details.nome || "");
    setOfficerSuggestions([]);
    setSelectedItem(null);
    setShowForm(true);
  }

  async function handleDelete(item) {
    try {
      await deleteApafProcesso(item.id);
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      setSuccess("Processo APAF removido da listagem.");
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao excluir processo APAF.");
    }
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Solicitação de APAF</h1>
        <p style={styles.subtitle}>Gerencie a abertura e o acompanhamento das solicitações de APAF.</p>
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
            + Novo Processo
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {showForm ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>{editingId ? "Editar processo APAF" : "Cadastrar processo APAF"}</h2>
          <form onSubmit={handleSave}>
            <div style={styles.formGrid}>
              <div style={{ ...styles.field, position: "relative" }}>
                <label style={styles.label}>RE *</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    value={officerSearchTerm}
                    onChange={(event) => {
                      setOfficerSearchTerm(event.target.value);
                      if (form.policeOfficerId) {
                        handleClearOfficer();
                        setOfficerSearchTerm(event.target.value);
                      }
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
                      ✕
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
                        {`${officer.re_with_digit} - ${officer.full_name}`}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>POSTO/GRAD.</label>
                <input value={form.posto_graduacao} readOnly style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>NOME</label>
                <input value={form.nome} readOnly style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>CIA ENTREGOU</label>
                <select value={form.cia_entregou} onChange={(event) => setForm((current) => ({ ...current, cia_entregou: event.target.value }))} style={styles.input}>
                  <option value="">Selecione</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.name}>
                      {unit.display_name || unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Data de Entrada</label>
                <input value={form.data_entrada} onChange={(event) => setForm((current) => ({ ...current, data_entrada: event.target.value }))} placeholder="DD/MM/AAAA" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nº da Parte</label>
                <input value={form.parte} onChange={(event) => setForm((current) => ({ ...current, parte: event.target.value }))} placeholder="Ex: 001/2026" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nº SIGMA</label>
                <input value={form.sigma} onChange={(event) => setForm((current) => ({ ...current, sigma: event.target.value }))} placeholder="Nº do registro no SIGMA" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Data de Cadastro</label>
                <input value={form.data_cadastro} onChange={(event) => setForm((current) => ({ ...current, data_cadastro: event.target.value }))} placeholder="DD/MM/AAAA" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>SOLIC. CONSULTA PI</label>
                <select value={form.solic_consulta_pi} onChange={(event) => setForm((current) => ({ ...current, solic_consulta_pi: event.target.value }))} style={styles.input}>
                  {STATUS_FIELD_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nº SEI</label>
                <input value={form.sei} onChange={(event) => setForm((current) => ({ ...current, sei: event.target.value }))} placeholder="Nº do processo SEI" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Link Envio CPRv</label>
                <input value={form.envio_cprv_link} onChange={(event) => setForm((current) => ({ ...current, envio_cprv_link: event.target.value }))} placeholder="Cole o link ou nº do envio" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Certidão 1</label>
                <select value={form.cert_1} onChange={(event) => setForm((current) => ({ ...current, cert_1: event.target.value }))} style={styles.input}>
                  {CERT_OPTIONS.map((option) => (
                    <option key={`cert1-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Certidão 2</label>
                <select value={form.cert_2} onChange={(event) => setForm((current) => ({ ...current, cert_2: event.target.value }))} style={styles.input}>
                  {CERT_OPTIONS.map((option) => (
                    <option key={`cert2-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Certidão 3</label>
                <select value={form.cert_3} onChange={(event) => setForm((current) => ({ ...current, cert_3: event.target.value }))} style={styles.input}>
                  {CERT_OPTIONS.map((option) => (
                    <option key={`cert3-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>RG</label>
                <input value={form.rg} readOnly style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>CPF</label>
                <input value={form.cpf} readOnly style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Comp. Res.</label>
                <select value={form.comp_residencia} onChange={(event) => setForm((current) => ({ ...current, comp_residencia: event.target.value }))} style={styles.input}>
                  {COMP_RES_OPTIONS.map((option) => (
                    <option key={`comp-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Bol. G</label>
                <input value={form.boletim_geral} onChange={(event) => setForm((current) => ({ ...current, boletim_geral: event.target.value }))} placeholder="Nº do BG" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>APAFI</label>
                <input value={form.apafi} onChange={(event) => setForm((current) => ({ ...current, apafi: event.target.value }))} placeholder="Nº da APAFI gerada" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Data de Entrega</label>
                <input value={form.data_entrega} onChange={(event) => setForm((current) => ({ ...current, data_entrega: event.target.value }))} placeholder="DD/MM/AAAA" style={styles.input} />
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Observação</label>
                <textarea value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Informações adicionais sobre o processo" style={styles.textarea} />
              </div>
            </div>

            {form.policeOfficerId ? (
              <p style={{ ...styles.helperText, marginTop: "12px" }}>
                Dados importados do cadastro P1 · Editar cadastro do policial
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
              <h2 style={styles.sectionTitle}>Detalhes da Solicitação de APAF</h2>
              <p style={styles.sectionText}>Visualização completa do processo selecionado.</p>
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
            {TABLE_COLUMNS.map((column) => (
              <DetailField
                key={column.key}
                label={column.label}
                value={selectedItem[column.key]}
                fullWidth={column.key === "envio_cprv_link" || column.key === "observacao" || column.key === "nome"}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Listagem de Solicitações de APAF</h2>
            <p style={styles.tableMeta}>{visibleItems.length} registro(s) encontrado(s)</p>
          </div>
          <ReportExportButtons
            disabled={!visibleItems.length}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "processos_apaf",
                sheetName: "Solicitação APAF",
                title: "Solicitação de APAF",
                subtitle: "Exportação completa dos processos filtrados",
                columns: TABLE_COLUMNS.map((column) => ({ key: column.key, label: column.label, width: column.width })),
                rows: visibleItems,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "processos_apaf",
                title: "Solicitação de APAF",
                subtitle: "Exportação completa dos processos filtrados",
                columns: TABLE_COLUMNS.map((column) => ({ key: column.key, label: column.label })),
                rows: visibleItems,
                orientation: "landscape",
              })
            }
          />
        </div>

        <div style={{ ...styles.card, margin: "16px" }}>
          <div style={styles.actions}>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar por RE, nome, parte, SIGMA, SEI ou APAFI" style={{ ...styles.input, ...styles.actionFieldWide }} />
            <select value={filterCia} onChange={(event) => setFilterCia(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              <option value="">Todas as CIAs</option>
              {units.map((unit) => (
                <option key={`filter-${unit.id}`} value={unit.name}>
                  {unit.display_name || unit.name}
                </option>
              ))}
            </select>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              <option value="">Todos os status</option>
              {[...STATUS_FIELD_OPTIONS.slice(1), ...CERT_OPTIONS.slice(1), ...COMP_RES_OPTIONS.slice(1)].filter(
                (option, index, array) => array.findIndex((entry) => entry.value === option.value) === index
              ).map((option) => (
                <option key={`status-${option.value}`} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input value={filterDateFrom} onChange={(event) => setFilterDateFrom(event.target.value)} placeholder="Entrada de (DD/MM/AAAA)" style={{ ...styles.input, ...styles.actionField }} />
            <input value={filterDateTo} onChange={(event) => setFilterDateTo(event.target.value)} placeholder="Entrada até (DD/MM/AAAA)" style={{ ...styles.input, ...styles.actionField }} />
            <button onClick={() => void loadItems()} style={{ ...styles.button, ...styles.primaryButton }}>
              Pesquisar
            </button>
          </div>
        </div>

        <div style={{ ...styles.tableWrap, overflowX: "auto" }}>
          <table style={{ ...styles.table, minWidth: "2400px" }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, position: "sticky", left: 0, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "80px" }}>VER</th>
                <th style={{ ...styles.th, position: "sticky", left: 80, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "120px" }}>RE</th>
                <th style={{ ...styles.th, position: "sticky", left: 200, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "260px" }}>NOME</th>
                {TABLE_COLUMNS.filter((column) => !["re_dc", "nome"].includes(column.key)).map((column) => (
                  <th key={column.key} style={styles.th}>{column.label}</th>
                ))}
                <th style={styles.th}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, index) => (
                <tr key={item.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                  <td style={{ ...styles.td, position: "sticky", left: 0, zIndex: 3, backgroundColor: index % 2 === 1 ? "var(--app-surface-muted)" : "var(--app-surface)" }}>
                    <button type="button" onClick={() => void handleView(item)} style={{ ...styles.button, ...styles.infoButton, padding: "8px 12px", minWidth: "52px" }}>
                      Ver
                    </button>
                  </td>
                  <td style={{ ...styles.td, position: "sticky", left: 80, zIndex: 2, backgroundColor: index % 2 === 1 ? "var(--app-surface-muted)" : "var(--app-surface)" }}>{item.re_dc || "-"}</td>
                  <td style={{ ...styles.td, position: "sticky", left: 200, zIndex: 2, backgroundColor: index % 2 === 1 ? "var(--app-surface-muted)" : "var(--app-surface)" }}>{item.nome || "-"}</td>
                  <td style={styles.td}>{item.posto_graduacao || "-"}</td>
                  <td style={styles.td}>{item.cia_entregou || "-"}</td>
                  <td style={styles.td}>{item.data_entrada || "-"}</td>
                  <td style={styles.td}>{item.parte || "-"}</td>
                  <td style={styles.td}>{item.sigma || "-"}</td>
                  <td style={styles.td}>{item.data_cadastro || "-"}</td>
                  <td style={styles.td}>{item.solic_consulta_pi || "-"}</td>
                  <td style={styles.td}>{item.sei || "-"}</td>
                  <td style={styles.td}>{item.envio_cprv_link || "-"}</td>
                  <td style={styles.td}>{item.cert_1 || "-"}</td>
                  <td style={styles.td}>{item.cert_2 || "-"}</td>
                  <td style={styles.td}>{item.cert_3 || "-"}</td>
                  <td style={styles.td}>{item.rg || "-"}</td>
                  <td style={styles.td}>{item.cpf || "-"}</td>
                  <td style={styles.td}>{item.comp_residencia || "-"}</td>
                  <td style={styles.td}>{item.boletim_geral || "-"}</td>
                  <td style={styles.td}>{item.apafi || "-"}</td>
                  <td style={styles.td}>{item.data_entrega || "-"}</td>
                  <td style={styles.td}>{item.observacao || "-"}</td>
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
              ))}
            </tbody>
          </table>
          {!loading && visibleItems.length === 0 ? <div style={styles.emptyState}>Nenhuma solicitação de APAF cadastrada.</div> : null}
          {loading ? <div style={styles.emptyState}>Carregando processos APAF...</div> : null}
        </div>
      </section>
    </div>
  );
}

export default ApafProcessPage;

