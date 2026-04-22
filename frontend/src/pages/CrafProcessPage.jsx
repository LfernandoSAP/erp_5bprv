import { useEffect, useMemo, useState } from "react";

import ReportExportButtons from "../components/ReportExportButtons";
import { appShellStyles as styles } from "../components/appShellStyles";
import {
  createCrafProcesso,
  deleteCrafProcesso,
  getCrafProcesso,
  getCrafProcessos,
  updateCrafProcesso,
} from "../services/crafProcessService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { readViewerAccess } from "../utils/authAccess";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

const TIPO_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "NOVO", label: "Novo" },
  { value: "EXTRAVIO", label: "Extravio" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "SOLICITADO", label: "Solicitado" },
  { value: "RECEBIDO", label: "Recebido" },
  { value: "NAO_SE_APLICA", label: "Não se aplica" },
];

const BOLETIM_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "EMITIDO", label: "Emitido" },
  { value: "ARQUIVADO", label: "Arquivado" },
  { value: "NAO_SE_APLICA", label: "Não se aplica" },
];

const XEROX_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "DIGITALIZADO", label: "Digitalizado" },
  { value: "NAO_SE_APLICA", label: "Não se aplica" },
];

const TABLE_COLUMNS = [
  { key: "tipo_craf", label: "TIPO", width: 12 },
  { key: "re_dc", label: "RE", width: 14 },
  { key: "posto_graduacao", label: "POSTO/GRAD.", width: 18 },
  { key: "nome", label: "NOME", width: 28 },
  { key: "data_entrada", label: "ENTRADA", width: 14 },
  { key: "parte", label: "PARTE", width: 16 },
  { key: "pm_l80", label: "PM L-80", width: 14 },
  { key: "nbi", label: "NBI", width: 14 },
  { key: "bol_int_res", label: "BOL INT RES", width: 18 },
  { key: "xerox_doc", label: "XEROX DOC", width: 18 },
  { key: "sigma", label: "SIGMA", width: 16 },
  { key: "bo", label: "BO", width: 18 },
  { key: "msg_cmb", label: "MSG CMB", width: 18 },
  { key: "data_processo", label: "DATA", width: 14 },
  { key: "observacao", label: "OBSERVAÇÃO", width: 30 },
];

function formatToday() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

function createInitialForm() {
  return {
    policeOfficerId: "",
    tipo_craf: "",
    re_dc: "",
    posto_graduacao: "",
    nome: "",
    data_entrada: "",
    parte: "",
    pm_l80: "",
    nbi: "",
    bol_int_res: "",
    xerox_doc: "",
    sigma: "",
    bo: "",
    msg_cmb: "",
    data_processo: formatToday(),
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

function buildTipoBadge(tipo) {
  if (tipo === "EXTRAVIO") {
    return {
      backgroundColor: "rgba(240, 82, 82, 0.14)",
      border: "1px solid rgba(240, 82, 82, 0.35)",
      color: "#ff9f9f",
    };
  }

  return {
    backgroundColor: "rgba(74, 158, 255, 0.14)",
    border: "1px solid rgba(74, 158, 255, 0.35)",
    color: "#9fd1ff",
  };
}

function CrafProcessPage({ onBack, startWithForm = false }) {
  const access = readViewerAccess();
  const [showForm, setShowForm] = useState(startWithForm);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [form, setForm] = useState(createInitialForm());
  const [officerSuggestions, setOfficerSuggestions] = useState([]);
  const [officerSearchTerm, setOfficerSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setShowForm(startWithForm);
  }, [startWithForm]);

  useEffect(() => {
    if (officerSearchTerm.trim().length < 3 || form.policeOfficerId || !form.tipo_craf) {
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
  }, [officerSearchTerm, form.policeOfficerId, form.tipo_craf]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType && item.tipo_craf !== filterType) return false;
      if (filterDateFrom && (item.data_entrada || "") < filterDateFrom) return false;
      if (filterDateTo && (item.data_entrada || "") > filterDateTo) return false;
      return true;
    });
  }, [items, filterType, filterDateFrom, filterDateTo]);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const data = await getCrafProcessos(searchTerm.trim(), filterType);
      setItems(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar processos CRAF.");
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
    }));
    setOfficerSearchTerm(officer.re_with_digit || officer.full_name || "");
    setOfficerSuggestions([]);
  }

  function handleClearOfficer(nextTerm = "") {
    setForm((current) => ({
      ...current,
      policeOfficerId: "",
      re_dc: "",
      posto_graduacao: "",
      nome: "",
    }));
    setOfficerSearchTerm(nextTerm);
    setOfficerSuggestions([]);
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.tipo_craf) {
      setError("Selecione o tipo de CRAF para continuar.");
      return;
    }

    if (form.tipo_craf === "EXTRAVIO" && !form.bo.trim()) {
      setError("B.O. obrigatório para processos de Extravio.");
      return;
    }

    if (form.tipo_craf === "EXTRAVIO" && !form.sigma.trim()) {
      setError("SIGMA obrigatório para processos de Extravio.");
      return;
    }

    try {
      const payload = {
        unit_id: Number(access.unitId || "0") || 1,
        police_officer_id: form.policeOfficerId ? Number(form.policeOfficerId) : null,
        tipo_craf: form.tipo_craf,
        re_dc: form.re_dc,
        posto_graduacao: form.posto_graduacao,
        nome: form.nome,
        data_entrada: form.data_entrada,
        parte: form.parte,
        pm_l80: form.pm_l80,
        nbi: form.nbi,
        bol_int_res: form.bol_int_res,
        xerox_doc: form.xerox_doc,
        sigma: form.sigma,
        bo: form.bo,
        msg_cmb: form.msg_cmb,
        data_processo: form.data_processo,
        observacao: form.observacao,
        is_active: true,
      };

      if (editingId) {
        await updateCrafProcesso(editingId, payload);
        setSuccess("Processo CRAF atualizado com sucesso.");
      } else {
        await createCrafProcesso(payload);
        setSuccess("Processo CRAF cadastrado com sucesso.");
      }

      setForm(createInitialForm());
      setOfficerSearchTerm("");
      setOfficerSuggestions([]);
      setEditingId(null);
      setSelectedItem(null);
      setShowForm(false);
      await loadItems();
    } catch (saveError) {
      setError(saveError.message || "Erro ao salvar processo CRAF.");
    }
  }

  async function handleView(item) {
    try {
      const details = await getCrafProcesso(item.id);
      setSelectedItem(details);
    } catch (detailError) {
      setError(detailError.message || "Erro ao carregar processo CRAF.");
    }
  }

  async function handleEdit(item) {
    const details = await getCrafProcesso(item.id);
    setEditingId(details.id);
    setForm({
      policeOfficerId: details.police_officer_id ? String(details.police_officer_id) : "",
      tipo_craf: details.tipo_craf || "",
      re_dc: details.re_dc || "",
      posto_graduacao: details.posto_graduacao || "",
      nome: details.nome || "",
      data_entrada: details.data_entrada || "",
      parte: details.parte || "",
      pm_l80: details.pm_l80 || "",
      nbi: details.nbi || "",
      bol_int_res: details.bol_int_res || "",
      xerox_doc: details.xerox_doc || "",
      sigma: details.sigma || "",
      bo: details.bo || "",
      msg_cmb: details.msg_cmb || "",
      data_processo: details.data_processo || formatToday(),
      observacao: details.observacao || "",
    });
    setOfficerSearchTerm(details.re_dc || details.nome || "");
    setOfficerSuggestions([]);
    setSelectedItem(null);
    setShowForm(true);
  }

  async function handleDelete(item) {
    try {
      await deleteCrafProcesso(item.id);
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      setSuccess("Processo CRAF removido da listagem.");
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao excluir processo CRAF.");
    }
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>CRAF</h1>
        <p style={styles.subtitle}>Gerencie os processos de CRAF dentro de Processos de Armas.</p>
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
            + Novo Cadastro
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {showForm ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>{editingId ? "Editar processo CRAF" : "Cadastrar processo CRAF"}</h2>
          <form onSubmit={handleSave}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Tipo de CRAF *</label>
                <select
                  value={form.tipo_craf}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setForm((current) => ({ ...current, tipo_craf: nextType }));
                    if (!nextType) {
                      handleClearOfficer("");
                    }
                  }}
                  style={styles.input}
                >
                  {TIPO_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!form.tipo_craf ? (
              <div style={{ ...styles.infoBox, marginTop: "16px" }}>
                Selecione o tipo de CRAF para continuar.
              </div>
            ) : (
              <>
                <div style={{ ...styles.formGrid, marginTop: "16px" }}>
                  <div style={{ ...styles.field, position: "relative" }}>
                    <label style={styles.label}>RE *</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        value={officerSearchTerm}
                        onChange={(event) => {
                          const nextTerm = event.target.value;
                          if (form.policeOfficerId) {
                            handleClearOfficer(nextTerm);
                            return;
                          }
                          setOfficerSearchTerm(nextTerm);
                        }}
                        placeholder="Digite 3+ caracteres do RE"
                        style={styles.input}
                        required
                      />
                      {(form.policeOfficerId || officerSearchTerm) ? (
                        <button
                          type="button"
                          onClick={() => handleClearOfficer("")}
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
                            {`${officer.re_with_digit} | ${officer.full_name} | ${officer.rank || "-"}`}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>POSTO/GRAD. (importado)</label>
                    <input value={form.posto_graduacao} readOnly style={styles.input} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>NOME (importado)</label>
                    <input value={form.nome} readOnly style={styles.input} />
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
                    <label style={styles.label}>Data do Processo</label>
                    <input value={form.data_processo} onChange={(event) => setForm((current) => ({ ...current, data_processo: event.target.value }))} placeholder="DD/MM/AAAA" style={styles.input} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>PM L-80</label>
                    <select value={form.pm_l80} onChange={(event) => setForm((current) => ({ ...current, pm_l80: event.target.value }))} style={styles.input}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={`pm-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>NBI</label>
                    <select value={form.nbi} onChange={(event) => setForm((current) => ({ ...current, nbi: event.target.value }))} style={styles.input}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={`nbi-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Boletim Interno Reservado</label>
                    <select value={form.bol_int_res} onChange={(event) => setForm((current) => ({ ...current, bol_int_res: event.target.value }))} style={styles.input}>
                      {BOLETIM_OPTIONS.map((option) => (
                        <option key={`bol-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Xerox dos Documentos</label>
                    <select value={form.xerox_doc} onChange={(event) => setForm((current) => ({ ...current, xerox_doc: event.target.value }))} style={styles.input}>
                      {XEROX_OPTIONS.map((option) => (
                        <option key={`xerox-${option.value || "empty"}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>{form.tipo_craf === "EXTRAVIO" ? "Nº SIGMA *" : "Nº SIGMA"}</label>
                    <input value={form.sigma} onChange={(event) => setForm((current) => ({ ...current, sigma: event.target.value }))} placeholder="Nº do registro no SIGMA" style={styles.input} />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>{form.tipo_craf === "EXTRAVIO" ? "Nº do B.O. *" : "Nº do B.O."}</label>
                    <input
                      value={form.bo}
                      onChange={(event) => setForm((current) => ({ ...current, bo: event.target.value }))}
                      placeholder="Nº do Boletim de Ocorrência"
                      style={{ ...styles.input, borderColor: form.tipo_craf === "EXTRAVIO" && !form.bo ? "rgba(240, 82, 82, 0.7)" : "var(--app-border-strong)" }}
                    />
                    {form.tipo_craf === "EXTRAVIO" ? (
                      <span style={{ ...styles.helperText, color: "#ffb4b4" }}>B.O. obrigatório para processos de Extravio.</span>
                    ) : null}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Mensagem CMB</label>
                    <input value={form.msg_cmb} onChange={(event) => setForm((current) => ({ ...current, msg_cmb: event.target.value }))} placeholder="Nº ou referência da mensagem CMB" style={styles.input} />
                  </div>

                  <div style={styles.fieldFull}>
                    <label style={styles.label}>Observação</label>
                    <textarea value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Informações adicionais sobre o processo CRAF" style={styles.textarea} />
                  </div>
                </div>

                {form.policeOfficerId ? (
                  <p style={{ ...styles.helperText, marginTop: "12px" }}>Dados importados do cadastro P1 · Editar cadastro do policial</p>
                ) : null}

                <div style={styles.footerActions}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ ...styles.button, ...styles.secondaryButton }}>Cancelar</button>
                  <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>Salvar</button>
                </div>
              </>
            )}
          </form>
        </section>
      ) : null}

      {selectedItem ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes do CRAF</h2>
              <p style={styles.sectionText}>Visualização completa do processo selecionado.</p>
            </div>
            <div style={styles.tableHeaderActions}>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
              <button type="button" onClick={() => void handleEdit(selectedItem)} style={{ ...styles.button, ...styles.primaryButton }}>Editar</button>
            </div>
          </div>
          <div style={styles.formGrid}>
            {TABLE_COLUMNS.map((column) => (
              <DetailField
                key={column.key}
                label={column.label}
                value={selectedItem[column.key]}
                fullWidth={column.key === "observacao" || column.key === "nome" || column.key === "msg_cmb"}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Listagem de CRAF</h2>
            <p style={styles.tableMeta}>{visibleItems.length} registro(s) encontrado(s)</p>
          </div>
          <ReportExportButtons
            disabled={!visibleItems.length}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "processos_craf",
                sheetName: "CRAF",
                title: "Processos de CRAF",
                subtitle: "Exportação completa dos processos filtrados",
                columns: TABLE_COLUMNS.map((column) => ({ key: column.key, label: column.label, width: column.width })),
                rows: visibleItems,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "processos_craf",
                title: "Processos de CRAF",
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
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar por RE, nome, parte, SIGMA, BO ou mensagem CMB" style={{ ...styles.input, ...styles.actionFieldWide }} />
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)} style={{ ...styles.input, ...styles.actionField }}>
              {TIPO_OPTIONS.map((option) => (
                <option key={`filter-${option.value || "empty"}`} value={option.value}>
                  {option.label === "Selecione" ? "Todos os tipos" : option.label}
                </option>
              ))}
            </select>
            <input value={filterDateFrom} onChange={(event) => setFilterDateFrom(event.target.value)} placeholder="Entrada de (DD/MM/AAAA)" style={{ ...styles.input, ...styles.actionField }} />
            <input value={filterDateTo} onChange={(event) => setFilterDateTo(event.target.value)} placeholder="Entrada até (DD/MM/AAAA)" style={{ ...styles.input, ...styles.actionField }} />
            <button onClick={() => void loadItems()} style={{ ...styles.button, ...styles.primaryButton }}>Pesquisar</button>
          </div>
        </div>

        <div style={{ ...styles.tableWrap, overflowX: "auto" }}>
          <table style={{ ...styles.table, minWidth: "2000px" }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, position: "sticky", left: 0, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "80px" }}>VER</th>
                <th style={{ ...styles.th, position: "sticky", left: 80, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "120px" }}>TIPO</th>
                <th style={{ ...styles.th, position: "sticky", left: 200, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "120px" }}>RE</th>
                <th style={{ ...styles.th, position: "sticky", left: 320, zIndex: 4, backgroundColor: "var(--app-surface-soft)", width: "260px" }}>NOME</th>
                {TABLE_COLUMNS.filter((column) => !["tipo_craf", "re_dc", "nome"].includes(column.key)).map((column) => (
                  <th key={column.key} style={styles.th}>{column.label}</th>
                ))}
                <th style={styles.th}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, index) => {
                const rowBackground = index % 2 === 1 ? "var(--app-surface-muted)" : "var(--app-surface)";
                const tipoBadge = buildTipoBadge(item.tipo_craf);
                return (
                  <tr key={item.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                    <td style={{ ...styles.td, position: "sticky", left: 0, zIndex: 3, backgroundColor: rowBackground }}>
                      <button type="button" onClick={() => void handleView(item)} style={{ ...styles.button, ...styles.infoButton, padding: "8px 12px", minWidth: "52px" }}>Ver</button>
                    </td>
                    <td style={{ ...styles.td, position: "sticky", left: 80, zIndex: 3, backgroundColor: rowBackground }}>
                      <span style={{ padding: "6px 10px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700, ...tipoBadge }}>
                        {item.tipo_craf === "EXTRAVIO" ? "Extravio" : "Novo"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, position: "sticky", left: 200, zIndex: 3, backgroundColor: rowBackground }}>{item.re_dc || "-"}</td>
                    <td style={{ ...styles.td, position: "sticky", left: 320, zIndex: 3, backgroundColor: rowBackground }}>{item.nome || "-"}</td>
                    <td style={styles.td}>{item.posto_graduacao || "-"}</td>
                    <td style={styles.td}>{item.data_entrada || "-"}</td>
                    <td style={styles.td}>{item.parte || "-"}</td>
                    <td style={styles.td}>{item.pm_l80 || "-"}</td>
                    <td style={styles.td}>{item.nbi || "-"}</td>
                    <td style={styles.td}>{item.bol_int_res || "-"}</td>
                    <td style={styles.td}>{item.xerox_doc || "-"}</td>
                    <td style={styles.td}>{item.sigma || "-"}</td>
                    <td style={styles.td}>{item.bo || "-"}</td>
                    <td style={styles.td}>{item.msg_cmb || "-"}</td>
                    <td style={styles.td}>{item.data_processo || "-"}</td>
                    <td style={styles.td}>{item.observacao || "-"}</td>
                    <td style={styles.td}>
                      <div style={styles.tableActionGroup}>
                        <button type="button" onClick={() => void handleEdit(item)} style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}>Editar</button>
                        <button type="button" onClick={() => void handleDelete(item)} style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && visibleItems.length === 0 ? <div style={styles.emptyState}>Nenhum processo CRAF cadastrado.</div> : null}
          {loading ? <div style={styles.emptyState}>Carregando processos CRAF...</div> : null}
        </div>
      </section>
    </div>
  );
}

export default CrafProcessPage;

