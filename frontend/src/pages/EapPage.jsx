import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import {
  atualizarEapModulo,
  buscarPoliciaisEap,
  criarEapModulo,
  excluirEapModulo,
  incluirParticipanteEap,
  listarEapModulos,
  obterEapModulo,
  removerParticipanteEap,
} from "../services/eapService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

const TEXT = {
  title: "EAP 5o BPRv",
  subtitle: "Crie o modulo uma vez e depois inclua os policiais por RE na turma correspondente.",
  listError: "Nao foi possivel carregar os modulos do EAP.",
  saveError: "Nao foi possivel salvar o modulo do EAP.",
  deleteError: "Nao foi possivel excluir o modulo do EAP.",
  participantError: "Nao foi possivel atualizar os participantes do modulo.",
};

const MODULO_OPTIONS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
];

const LOCAL_OPTIONS = ["5o BPRv EM", "GT/CPRv", "4o BPRv"];
const TIPO_OPTIONS = ["Cb/Sd", "Sub Ten/Sgt"];

const emptyModuleForm = {
  modulo: "",
  tipo: "",
  local: "",
  periodo_ead_inicio: "",
  periodo_ead_fim: "",
  periodo_presencial_inicio: "",
  periodo_presencial_fim: "",
  outros: "",
};

function normalizeOfficer(item) {
  return {
    id: item.policial_id || item.id || item.re_dc || item.re,
    re: item.re_dc || item.re || "",
    nome: item.nome_completo || item.nome || item.nome_guerra || "",
    posto: item.posto_graduacao || item.graduacao || item.rank || "",
    unidade: item.unidade || "",
  };
}

function officerLabel(item) {
  return [item.re, item.posto, item.nome].filter(Boolean).join(" | ");
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatPeriod(start, end) {
  if (!start && !end) return "-";
  return `${formatDate(start)} ate ${formatDate(end)}`;
}

export default function EapPage({ onBack }) {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingModule, setSavingModule] = useState(false);
  const [savingParticipant, setSavingParticipant] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantResults, setParticipantResults] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  async function loadModules(nextQuery = "", keepSelected = false) {
    try {
      setLoading(true);
      const data = await listarEapModulos({ q: nextQuery });
      const items = Array.isArray(data) ? data : [];
      setModules(items);

      if (keepSelected && selectedModule?.id) {
        const detail = await obterEapModulo(selectedModule.id);
        setSelectedModule(detail);
      } else if (selectedModule?.id) {
        const nextSelected = items.find((item) => item.id === selectedModule.id);
        if (!nextSelected) {
          setSelectedModule(null);
        }
      }
      setError("");
    } catch (loadError) {
      setError(loadError.message || TEXT.listError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadModules();
  }, []);

  useEffect(() => {
    if (participantSearch.trim().length < 2) {
      setParticipantResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const data = await buscarPoliciaisEap(participantSearch.trim());
        if (!active) return;
        setParticipantResults(
          Array.isArray(data)
            ? data.map(normalizeOfficer).filter((item) => item.re || item.nome)
            : []
        );
      } catch {
        if (active) setParticipantResults([]);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [participantSearch]);

  const visibleModules = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return modules;
    return modules.filter((item) =>
      `${item.modulo} ${item.tipo || ""} ${item.local} ${item.unit_label || ""} ${item.outros || ""}`.toLowerCase().includes(term)
    );
  }, [modules, query]);

  const selectedModuleReportColumns = useMemo(
    () => [
      { key: "re_dc", label: "RE", width: 14 },
      { key: "policial_nome", label: "Nome", width: 34 },
      { key: "posto_graduacao", label: "Posto/Graduacao", width: 18 },
      { key: "unidade_policial", label: "Unidade", width: 24 },
    ],
    []
  );

  const selectedModuleReportRows = useMemo(
    () =>
      (selectedModule?.participantes || []).map((item) => ({
        re_dc: item.re_dc || "-",
        policial_nome: item.policial_nome || "-",
        posto_graduacao: item.posto_graduacao || "-",
        unidade_policial: item.unidade_policial || "-",
      })),
    [selectedModule]
  );

  function resetModuleForm() {
    setEditingModuleId(null);
    setModuleForm(emptyModuleForm);
  }

  function beginCreateModule() {
    resetModuleForm();
    setShowModuleForm(true);
    setError("");
    setSuccess("");
  }

  function beginEditModule(item) {
    setEditingModuleId(item.id);
    setModuleForm({
      modulo: item.modulo || "",
      tipo: item.tipo || "",
      local: item.local || "",
      periodo_ead_inicio: item.periodo_ead_inicio || "",
      periodo_ead_fim: item.periodo_ead_fim || "",
      periodo_presencial_inicio: item.periodo_presencial_inicio || "",
      periodo_presencial_fim: item.periodo_presencial_fim || "",
      outros: item.outros || "",
    });
    setShowModuleForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmitModule(event) {
    event.preventDefault();
    try {
      setSavingModule(true);
      setError("");
      if (editingModuleId) {
        const detail = await atualizarEapModulo(editingModuleId, moduleForm);
        setSelectedModule(detail);
        setSuccess("Modulo EAP atualizado com sucesso.");
      } else {
        const detail = await criarEapModulo(moduleForm);
        setSelectedModule(detail);
        setSuccess("Modulo EAP criado com sucesso.");
      }
      setShowModuleForm(false);
      resetModuleForm();
      await loadModules(query, true);
    } catch (saveError) {
      setError(saveError.message || TEXT.saveError);
    } finally {
      setSavingModule(false);
    }
  }

  async function handleSelectModule(item) {
    try {
      setLoading(true);
      const detail = await obterEapModulo(item.id);
      setSelectedModule(detail);
      setError("");
    } catch (loadError) {
      setError(loadError.message || TEXT.listError);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteModule(item) {
    try {
      await excluirEapModulo(item.id);
      if (selectedModule?.id === item.id) {
        setSelectedModule(null);
      }
      setSuccess("Modulo EAP excluido com sucesso.");
      await loadModules(query);
    } catch (deleteError) {
      setError(deleteError.message || TEXT.deleteError);
    }
  }

  async function handleAddParticipant() {
    if (!selectedModule?.id || !selectedOfficer?.re) {
      setError("Selecione um modulo e um policial para incluir.");
      return;
    }
    try {
      setSavingParticipant(true);
      setError("");
      const detail = await incluirParticipanteEap(selectedModule.id, { re_dc: selectedOfficer.re });
      setSelectedModule(detail);
      setParticipantSearch("");
      setSelectedOfficer(null);
      setParticipantResults([]);
      setSuccess("Policial incluido no modulo com sucesso.");
      await loadModules(query);
    } catch (participantError) {
      setError(participantError.message || TEXT.participantError);
    } finally {
      setSavingParticipant(false);
    }
  }

  async function handleRemoveParticipant(participantId) {
    if (!selectedModule?.id) return;
    try {
      setSavingParticipant(true);
      setError("");
      const detail = await removerParticipanteEap(selectedModule.id, participantId);
      setSelectedModule(detail);
      setSuccess("Policial removido do modulo com sucesso.");
      await loadModules(query);
    } catch (participantError) {
      setError(participantError.message || TEXT.participantError);
    } finally {
      setSavingParticipant(false);
    }
  }

  async function handleExportExcel() {
    if (!selectedModule) return;
    await exportExcelReport({
      fileBaseName: `eap_modulo_${selectedModule.modulo}`,
      sheetName: `EAP ${selectedModule.modulo}`,
      title: `EAP 5o BPRv - Modulo ${selectedModule.modulo}`,
      subtitle: `${selectedModule.tipo || "-"} | ${selectedModule.local || "-"} | EAD: ${formatPeriod(
        selectedModule.periodo_ead_inicio,
        selectedModule.periodo_ead_fim
      )} | Presencial: ${formatPeriod(
        selectedModule.periodo_presencial_inicio,
        selectedModule.periodo_presencial_fim
      )}`,
      columns: selectedModuleReportColumns,
      rows: selectedModuleReportRows,
    });
  }

  async function handleExportPdf() {
    if (!selectedModule) return;
    await exportPdfReport({
      fileBaseName: `eap_modulo_${selectedModule.modulo}`,
      title: `EAP 5o BPRv - Modulo ${selectedModule.modulo}`,
      subtitle: `${selectedModule.tipo || "-"} | ${selectedModule.local || "-"} | EAD: ${formatPeriod(
        selectedModule.periodo_ead_inicio,
        selectedModule.periodo_ead_fim
      )} | Presencial: ${formatPeriod(
        selectedModule.periodo_presencial_inicio,
        selectedModule.periodo_presencial_fim
      )}`,
      columns: selectedModuleReportColumns,
      rows: selectedModuleReportRows,
      summaryItems: [
        `Policiais incluidos: ${selectedModule.total_policiais || 0}`,
        `Unidade responsavel: ${selectedModule.unit_label || "-"}`,
      ],
    });
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button type="button" onClick={beginCreateModule} style={{ ...styles.button, ...styles.primaryButton }}>
            + Novo Modulo EAP
          </button>
        </div>
        <h1 style={styles.title}>{TEXT.title}</h1>
        <p style={styles.subtitle}>{TEXT.subtitle}</p>
      </section>

      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {success ? <div style={styles.successBox}>{success}</div> : null}

      <section style={styles.card}>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Busca de modulos</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por modulo, tipo, local ou observacao"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Acao</label>
            <button type="button" onClick={() => void loadModules(query)} style={{ ...styles.button, ...styles.primaryButton, height: "50px" }}>
              Atualizar
            </button>
          </div>
        </div>
        <div style={{ ...styles.summaryGrid, marginTop: "18px" }}>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Modulos cadastrados</p>
            <p style={styles.summaryValue}>{modules.length}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Modulo selecionado</p>
            <p style={styles.summaryValue}>{selectedModule ? `Modulo ${selectedModule.modulo}` : "-"}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Policiais no modulo</p>
            <p style={styles.summaryValue}>{selectedModule?.total_policiais ?? 0}</p>
          </div>
        </div>
      </section>

      {showModuleForm ? (
        <section style={{ ...styles.card, marginTop: "18px" }}>
          <h2 style={styles.sectionTitle}>{editingModuleId ? "Editar modulo EAP" : "Novo modulo EAP"}</h2>
          <form onSubmit={handleSubmitModule}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Modulo</label>
                <select
                  value={moduleForm.modulo}
                  onChange={(event) => setModuleForm((current) => ({ ...current, modulo: event.target.value }))}
                  style={styles.input}
                  required
                >
                  <option value="">Selecione</option>
                  {MODULO_OPTIONS.map((option) => (
                    <option key={option} value={option}>{`Modulo ${option}`}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tipo</label>
                <select
                  value={moduleForm.tipo}
                  onChange={(event) => setModuleForm((current) => ({ ...current, tipo: event.target.value }))}
                  style={styles.input}
                  required
                >
                  <option value="">Selecione</option>
                  {TIPO_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Local</label>
                <select
                  value={moduleForm.local}
                  onChange={(event) => setModuleForm((current) => ({ ...current, local: event.target.value }))}
                  style={styles.input}
                  required
                >
                  <option value="">Selecione</option>
                  {LOCAL_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Periodo EAD - inicio</label>
                <input
                  type="date"
                  value={moduleForm.periodo_ead_inicio}
                  onChange={(event) => setModuleForm((current) => ({ ...current, periodo_ead_inicio: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Periodo EAD - fim</label>
                <input
                  type="date"
                  value={moduleForm.periodo_ead_fim}
                  onChange={(event) => setModuleForm((current) => ({ ...current, periodo_ead_fim: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Periodo Presencial - inicio</label>
                <input
                  type="date"
                  value={moduleForm.periodo_presencial_inicio}
                  onChange={(event) => setModuleForm((current) => ({ ...current, periodo_presencial_inicio: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Periodo Presencial - fim</label>
                <input
                  type="date"
                  value={moduleForm.periodo_presencial_fim}
                  onChange={(event) => setModuleForm((current) => ({ ...current, periodo_presencial_fim: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Outros</label>
                <textarea
                  value={moduleForm.outros}
                  onChange={(event) => setModuleForm((current) => ({ ...current, outros: event.target.value }))}
                  placeholder="Observacoes complementares do modulo"
                  style={{ ...styles.textarea, minHeight: "110px" }}
                />
              </div>
            </div>
            <div style={styles.footerActions}>
              <button type="button" onClick={() => setShowModuleForm(false)} style={{ ...styles.button, ...styles.secondaryButton }}>
                Cancelar
              </button>
              <button type="submit" disabled={savingModule} style={{ ...styles.button, ...styles.primaryButton }}>
                {savingModule ? "Salvando..." : editingModuleId ? "Salvar modulo" : "Criar modulo"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section style={{ ...styles.card, marginTop: "18px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ver</th>
                <th style={styles.th}>Modulo</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Local</th>
                <th style={styles.th}>EAD</th>
                <th style={styles.th}>Presencial</th>
                <th style={styles.th}>Unidade</th>
                <th style={styles.th}>Policiais</th>
                <th style={styles.th}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={styles.td} colSpan={9}>Carregando modulos EAP...</td>
                </tr>
              ) : visibleModules.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={9}>Nenhum modulo EAP cadastrado.</td>
                </tr>
              ) : (
                visibleModules.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <button type="button" onClick={() => void handleSelectModule(item)} style={{ ...styles.button, ...styles.secondaryButton }}>
                        Ver
                      </button>
                    </td>
                    <td style={styles.td}>{`Modulo ${item.modulo}`}</td>
                    <td style={styles.td}>{item.tipo || "-"}</td>
                    <td style={styles.td}>{item.local || "-"}</td>
                    <td style={styles.td}>{formatPeriod(item.periodo_ead_inicio, item.periodo_ead_fim)}</td>
                    <td style={styles.td}>{formatPeriod(item.periodo_presencial_inicio, item.periodo_presencial_fim)}</td>
                    <td style={styles.td}>{item.unit_label || "-"}</td>
                    <td style={styles.td}>{item.total_policiais ?? 0}</td>
                    <td style={styles.td}>
                      <div style={styles.tableActionGroup}>
                        <button type="button" onClick={() => beginEditModule(item)} style={{ ...styles.button, ...styles.primaryButton, ...styles.tableActionButton }}>
                          Editar
                        </button>
                        <button type="button" onClick={() => void handleDeleteModule(item)} style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedModule ? (
        <section style={{ ...styles.card, marginTop: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <h2 style={styles.sectionTitle}>{`Modulo ${selectedModule.modulo}`}</h2>
              <p style={styles.sectionText}>
                {selectedModule.tipo || "-"} | {selectedModule.local || "-"} | {selectedModule.unit_label || "-"} | {selectedModule.total_policiais || 0} policiais incluidos
              </p>
            </div>
            <div style={styles.tableHeaderActions}>
              <ReportExportButtons
                onExportExcel={handleExportExcel}
                onExportPdf={handleExportPdf}
                disabled={!selectedModuleReportRows.length}
              />
              <button type="button" onClick={() => beginEditModule(selectedModule)} style={{ ...styles.button, ...styles.primaryButton }}>
                Editar modulo
              </button>
            </div>
          </div>

          <div style={{ ...styles.formGrid, marginTop: "8px" }}>
            <div style={styles.field}><label style={styles.label}>Tipo</label><div style={styles.input}>{selectedModule.tipo || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>Periodo EAD</label><div style={styles.input}>{formatPeriod(selectedModule.periodo_ead_inicio, selectedModule.periodo_ead_fim)}</div></div>
            <div style={styles.field}><label style={styles.label}>Periodo Presencial</label><div style={styles.input}>{formatPeriod(selectedModule.periodo_presencial_inicio, selectedModule.periodo_presencial_fim)}</div></div>
            <div style={styles.fieldFull}><label style={styles.label}>Outros</label><div style={styles.input}>{selectedModule.outros || "-"}</div></div>
          </div>

          <div style={{ ...styles.card, marginTop: "18px", backgroundColor: "var(--app-surface-muted)" }}>
            <h3 style={styles.sectionTitle}>Incluir policial no modulo</h3>
            <div style={styles.formGrid}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Buscar por RE ou nome</label>
                <input
                  value={participantSearch}
                  onChange={(event) => {
                    setParticipantSearch(event.target.value);
                    setSelectedOfficer(null);
                  }}
                  placeholder="Digite o RE ou nome do policial"
                  style={styles.input}
                />
                {participantResults.length > 0 ? (
                  <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
                    {participantResults.slice(0, 6).map((item) => (
                      <button
                        key={`${item.id}-${item.re}`}
                        type="button"
                        onClick={() => {
                          setSelectedOfficer(item);
                          setParticipantSearch(officerLabel(item));
                          setParticipantResults([]);
                        }}
                        style={{ ...styles.card, textAlign: "left", padding: "10px 12px", cursor: "pointer" }}
                      >
                        <strong>{item.re || "-"}</strong>
                        <div style={{ color: "var(--app-text-muted)", marginTop: "4px" }}>
                          {[item.posto, item.nome, item.unidade].filter(Boolean).join(" | ")}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {selectedOfficer ? (
              <div style={{ ...styles.formGrid, marginTop: "16px" }}>
                <div style={styles.field}><label style={styles.label}>Nome completo</label><div style={styles.input}>{selectedOfficer.nome || "-"}</div></div>
                <div style={styles.field}><label style={styles.label}>Posto/Graduacao</label><div style={styles.input}>{selectedOfficer.posto || "-"}</div></div>
                <div style={styles.field}><label style={styles.label}>RE-DC</label><div style={styles.input}>{selectedOfficer.re || "-"}</div></div>
                <div style={styles.field}><label style={styles.label}>Unidade</label><div style={styles.input}>{selectedOfficer.unidade || "-"}</div></div>
              </div>
            ) : null}

            <div style={styles.footerActions}>
              <button
                type="button"
                disabled={savingParticipant || !selectedOfficer}
                onClick={() => void handleAddParticipant()}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                {savingParticipant ? "Incluindo..." : "Incluir policial"}
              </button>
            </div>
          </div>

          <section style={{ ...styles.card, marginTop: "18px" }}>
            <h3 style={styles.sectionTitle}>Policiais incluidos</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>RE</th>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Posto/Graduacao</th>
                    <th style={styles.th}>Unidade</th>
                    <th style={styles.th}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedModule.participantes || []).length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={5}>Nenhum policial incluido neste modulo.</td>
                    </tr>
                  ) : (
                    selectedModule.participantes.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.re_dc || "-"}</td>
                        <td style={styles.td}>{item.policial_nome || "-"}</td>
                        <td style={styles.td}>{item.posto_graduacao || "-"}</td>
                        <td style={styles.td}>{item.unidade_policial || "-"}</td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            onClick={() => void handleRemoveParticipant(item.id)}
                            style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}
