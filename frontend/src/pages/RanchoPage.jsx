import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { getUnits } from "../services/referenceDataService";
import {
  adicionarParticipante,
  buscarConfiguracao,
  buscarPoliciaisRancho,
  criarConfiguracao,
  exportarExcel,
  fecharConfiguracao,
  listarConfiguracoes,
  removerParticipante,
  salvarLancamento,
} from "../services/ranchoService";
import { readViewerAccess } from "../utils/authAccess";
import {
  buildHierarchicalUnitLabelMap,
  buildHierarchicalUnitOptions,
} from "../utils/unitOptions";

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const PERSON_TYPE_LABELS = {
  PM: "PM",
  CIVIL: "Civil",
  VISITANTE: "Visitante",
};

function emptyParticipantForm(nextOrder = "") {
  return {
    tipo_pessoa: "PM",
    re: "",
    rg: "",
    nome: "",
    graduacao: "",
    ordem: nextOrder,
  };
}

function formatMonthYear(mes, ano) {
  const month = MONTH_OPTIONS.find((item) => Number(item.value) === Number(mes));
  return `${month?.label || mes}/${ano}`;
}

function buildMonthDates(mes, ano) {
  const total = new Date(Number(ano), Number(mes), 0).getDate();

  return Array.from({ length: total }, (_, index) => {
    const day = index + 1;
    return `${ano}-${String(mes).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }).filter((isoDate) => {
    const date = new Date(`${isoDate}T00:00:00`);
    const weekday = date.getDay();
    return weekday !== 0 && weekday !== 6;
  });
}

function formatDateLabel(value) {
  const date = new Date(`${value}T00:00:00`);
  const weekday = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."][date.getDay()];
  const month = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."][date.getMonth()];

  return {
    top: weekday,
    bottom: `${date.getDate()}-${month}`,
  };
}

function statusBadge(fechado) {
  return fechado
    ? {
        backgroundColor: "rgba(148, 163, 184, 0.16)",
        color: "#cbd5e1",
        border: "1px solid rgba(148, 163, 184, 0.35)",
      }
    : {
        backgroundColor: "rgba(34, 197, 94, 0.16)",
        color: "#bbf7d0",
        border: "1px solid rgba(34, 197, 94, 0.35)",
      };
}

function stickyNameCell(isHeader = false) {
  return {
    position: "sticky",
    left: 0,
    zIndex: isHeader ? 6 : 4,
    backgroundColor: isHeader ? "var(--app-surface-muted)" : "var(--app-surface)",
    minWidth: "280px",
    boxShadow: "6px 0 12px rgba(15, 23, 42, 0.08)",
  };
}

function stickySummaryCell() {
  return {
    position: "sticky",
    left: 0,
    zIndex: 5,
    minWidth: "280px",
    backgroundColor: "#374151",
    color: "#fff",
    boxShadow: "6px 0 12px rgba(15, 23, 42, 0.12)",
    whiteSpace: "nowrap",
  };
}

function buildLaunchKey(participanteId, isoDate, field) {
  return `${participanteId}:${isoDate}:${field}`;
}

function getPersistedLaunch(participante, isoDate) {
  return participante.lancamentos?.find((item) => String(item.data) === isoDate) || null;
}

function buildLaunchDraft(detail) {
  if (!detail) return {};

  const dates = buildMonthDates(detail.mes, detail.ano);
  const draft = {};

  detail.participantes.forEach((participante) => {
    dates.forEach((isoDate) => {
      const launch = getPersistedLaunch(participante, isoDate);
      draft[buildLaunchKey(participante.id, isoDate, "cafe")] = Boolean(launch?.cafe);
      draft[buildLaunchKey(participante.id, isoDate, "almoco")] = Boolean(launch?.almoco);
    });
  });

  return draft;
}

function getDraftLaunchValue(draft, participante, isoDate, field) {
  return Boolean(draft[buildLaunchKey(participante.id, isoDate, field)]);
}

function countPendingChanges(detail, draft, detailDates) {
  if (!detail) return 0;

  let count = 0;

  detail.participantes.forEach((participante) => {
    detailDates.forEach((isoDate) => {
      const persisted = getPersistedLaunch(participante, isoDate);
      const persistedCafe = Boolean(persisted?.cafe);
      const persistedAlmoco = Boolean(persisted?.almoco);
      const draftCafe = getDraftLaunchValue(draft, participante, isoDate, "cafe");
      const draftAlmoco = getDraftLaunchValue(draft, participante, isoDate, "almoco");

      if (persistedCafe !== draftCafe || persistedAlmoco !== draftAlmoco) {
        count += 1;
      }
    });
  });

  return count;
}

function normalizeOfficerSearchResult(item) {
  return {
    id: item.policial_id || item.id || item.re_dc || item.re,
    nome: item.nome_completo || item.nome || item.nome_guerra || "",
    nomeGuerra: item.nome_guerra || item.nome_completo || item.nome || "",
    re: item.re_dc || item.re || "",
    graduacao: item.posto_graduacao || item.graduacao || item.rank || "",
    unidade: item.unidade || "",
  };
}

function formatParticipantPreview(officer) {
  if (!officer) return "";
  return `Encontrado: ${officer.graduacao || "-"} ${officer.nomeGuerra || officer.nome} | RE ${officer.re}`;
}

function totalForDate(totals, isoDate, field) {
  const item = totals?.find((entry) => String(entry.data) === isoDate);
  if (!item) return 0;
  return field === "cafe" ? item.total_cafe : item.total_almoco;
}

function nextParticipantOrder(detail) {
  return String(
    (detail?.participantes || []).reduce((max, participante) => Math.max(max, Number(participante.ordem || 0)), 0) + 1,
  );
}

export default function RanchoPage({ onBack }) {
  const viewer = readViewerAccess();
  const isAdmin = viewer.isAdmin || ["ADMIN_GLOBAL", "ADMIN_UNIDADE"].includes(viewer.roleCode);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGrid, setSavingGrid] = useState(false);
  const [editingGrid, setEditingGrid] = useState(false);
  const [mode, setMode] = useState("list");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [records, setRecords] = useState([]);
  const [units, setUnits] = useState([]);
  const [detail, setDetail] = useState(null);
  const [launchDraft, setLaunchDraft] = useState({});
  const [pmResult, setPmResult] = useState(null);
  const [selectedPm, setSelectedPm] = useState(null);
  const [searchingPm, setSearchingPm] = useState(false);
  const [pmSearchResults, setPmSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    mes: String(currentMonth),
    ano: String(currentYear),
    unidade_id: viewer.unitId ? String(viewer.unitId) : "",
  });
  const [createForm, setCreateForm] = useState({
    mes: String(currentMonth),
    ano: String(currentYear),
    unidade_id: viewer.unitId ? String(viewer.unitId) : "",
  });
  const [participantForm, setParticipantForm] = useState(emptyParticipantForm("1"));

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);
  const unitLabelMap = useMemo(() => buildHierarchicalUnitLabelMap(units), [units]);
  const detailDates = useMemo(() => (detail ? buildMonthDates(detail.mes, detail.ano) : []), [detail]);
  const pendingGridChanges = useMemo(
    () => countPendingChanges(detail, launchDraft, detailDates),
    [detail, launchDraft, detailDates],
  );

  const totalsForLabel = useMemo(
    () => ({
      pm: detail?.totais_pm || [],
      civil: detail?.totais_civil || [],
      visitante: detail?.totais_visitante || [],
      geral: detail?.totais_geral || [],
    }),
    [detail],
  );

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function applyDetailState(data) {
    setDetail(data);
    setLaunchDraft(buildLaunchDraft(data));
    setEditingGrid(false);
    setParticipantForm(emptyParticipantForm(nextParticipantOrder(data)));
    setPmResult(null);
    setSelectedPm(null);
    setPmSearchResults([]);
  }

  async function refreshList(customFilters = filters) {
    const data = await listarConfiguracoes(customFilters);
    setRecords(Array.isArray(data) ? data : []);
  }

  // Carregamento inicial orientado pela sessão atual.
  useEffect(() => {
    async function bootstrapPage() {
      setLoading(true);
      try {
        const initialFilters = {
          mes: String(currentMonth),
          ano: String(currentYear),
          unidade_id: viewer.unitId ? String(viewer.unitId) : "",
        };
        const [unitsData, listData] = await Promise.all([getUnits(), listarConfiguracoes(initialFilters)]);
        setUnits(unitsData);
        setRecords(Array.isArray(listData) ? listData : []);
        clearMessages();
      } catch (loadError) {
        setError(loadError.message || "Erro ao carregar a Previsão de Rancho.");
      } finally {
        setLoading(false);
      }
    }

    void bootstrapPage();
  }, [currentMonth, currentYear, viewer.unitId]);

  useEffect(() => {
    if (participantForm.tipo_pessoa !== "PM") {
      setSearchingPm(false);
      setPmSearchResults([]);
      return undefined;
    }

    const term = participantForm.re.trim();
    if (term.length < 2) {
      setSearchingPm(false);
      setPmSearchResults([]);
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchingPm(true);
        const results = await buscarPoliciaisRancho(term);
        if (!active) return;
        setPmSearchResults(Array.isArray(results) ? results.map(normalizeOfficerSearchResult) : []);
      } catch {
        if (active) {
          setPmSearchResults([]);
        }
      } finally {
        if (active) {
          setSearchingPm(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [participantForm.re, participantForm.tipo_pessoa]);

  function handleParticipantTypeChange(tipo) {
    setParticipantForm((current) => ({
      ...emptyParticipantForm(current.ordem || nextParticipantOrder(detail)),
      tipo_pessoa: tipo,
      ordem: current.ordem || nextParticipantOrder(detail),
    }));
    setPmResult(null);
    setSelectedPm(null);
    setPmSearchResults([]);
    clearMessages();
  }

  function applySelectedPm(officer) {
    setSelectedPm(officer);
    setPmResult(officer);
    setParticipantForm((current) => ({
      ...current,
      re: officer.re || "",
      nome: officer.nome || "",
      graduacao: officer.graduacao || "",
    }));
    setPmSearchResults([]);
    clearMessages();
  }

  async function openDetail(configId) {
    try {
      setLoading(true);
      clearMessages();
      const data = await buscarConfiguracao(configId);
      applyDetailState(data);
      setMode("detail");
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar o planejamento.");
    } finally {
      setLoading(false);
    }
  }

  function resetCreateForm() {
    setCreateForm({
      mes: String(currentMonth),
      ano: String(currentYear),
      unidade_id: viewer.unitId ? String(viewer.unitId) : "",
    });
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      clearMessages();
      const data = await criarConfiguracao({
        mes: Number(createForm.mes),
        ano: Number(createForm.ano),
        unidade_id: createForm.unidade_id ? Number(createForm.unidade_id) : null,
      });
      applyDetailState(data);
      setMode("detail");
      setSuccess("Planejamento criado com sucesso.");
      await refreshList();
      resetCreateForm();
    } catch (submitError) {
      setError(submitError.message || "Não foi possível criar o planejamento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddParticipant(event) {
    event.preventDefault();
    if (!detail) return;

    try {
      setSaving(true);
      clearMessages();

      const payload = {
        tipo_pessoa: participantForm.tipo_pessoa,
        ordem: participantForm.ordem ? Number(participantForm.ordem) : null,
      };

      if (participantForm.tipo_pessoa === "PM") {
        if (!selectedPm?.re) {
          throw new Error("Selecione um policial a partir da busca por nome ou RE.");
        }
        payload.re = selectedPm.re;
      }

      if (participantForm.tipo_pessoa === "CIVIL") {
        if (!participantForm.rg.trim() || !participantForm.nome.trim()) {
          throw new Error("Informe RG e nome para Funcionários Civis.");
        }
        payload.rg = participantForm.rg.trim();
        payload.nome = participantForm.nome.trim();
        payload.graduacao = participantForm.graduacao.trim() || null;
      }

      if (participantForm.tipo_pessoa === "VISITANTE") {
        if (!participantForm.nome.trim()) {
          throw new Error("Informe o nome do visitante.");
        }
        payload.nome = participantForm.nome.trim();
      }

      const data = await adicionarParticipante(detail.id, payload);
      applyDetailState(data);
      setSuccess("Participante adicionado com sucesso.");
    } catch (submitError) {
      setError(submitError.message || "Não foi possível adicionar o participante.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveParticipant(participante) {
    if (!detail) return;
    const confirmed = window.confirm(`Remover ${participante.display_name || participante.nome}?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      clearMessages();
      const data = await removerParticipante(detail.id, participante.id);
      applyDetailState(data);
      setSuccess("Participante removido com sucesso.");
    } catch (submitError) {
      setError(submitError.message || "Não foi possível remover o participante.");
    } finally {
      setSaving(false);
    }
  }

  function handleEditGrid() {
    if (!detail) return;
    clearMessages();
    setLaunchDraft(buildLaunchDraft(detail));
    setEditingGrid(true);
  }

  function handleCancelEdit() {
    if (!detail) return;
    clearMessages();
    setLaunchDraft(buildLaunchDraft(detail));
    setEditingGrid(false);
  }

  function toggleDraftLaunch(participante, isoDate, field) {
    if (!editingGrid) return;

    setLaunchDraft((current) => {
      const key = buildLaunchKey(participante.id, isoDate, field);
      return {
        ...current,
        [key]: !current[key],
      };
    });
  }

  async function handleSaveGrid() {
    if (!detail) return;

    try {
      setSavingGrid(true);
      clearMessages();

      const changes = [];

      detail.participantes.forEach((participante) => {
        detailDates.forEach((isoDate) => {
          const persisted = getPersistedLaunch(participante, isoDate);
          const nextCafe = getDraftLaunchValue(launchDraft, participante, isoDate, "cafe");
          const nextAlmoco = getDraftLaunchValue(launchDraft, participante, isoDate, "almoco");
          const currentCafe = Boolean(persisted?.cafe);
          const currentAlmoco = Boolean(persisted?.almoco);

          if (nextCafe !== currentCafe || nextAlmoco !== currentAlmoco) {
            changes.push({
              participante_id: participante.id,
              data: isoDate,
              cafe: nextCafe,
              almoco: nextAlmoco,
            });
          }
        });
      });

      if (changes.length === 0) {
        setSuccess("Nenhuma alteração pendente para salvar.");
        setEditingGrid(false);
        return;
      }

      await Promise.all(changes.map((payload) => salvarLancamento(detail.id, payload)));
      const refreshed = await buscarConfiguracao(detail.id);
      applyDetailState(refreshed);
      setSuccess("Marcações salvas com sucesso.");
    } catch (submitError) {
      setError(submitError.message || "Não foi possível salvar as marcações.");
    } finally {
      setSavingGrid(false);
    }
  }

  async function handleClosePlanning() {
    if (!detail || detail.fechado) return;

    const confirmed = window.confirm(
      "Após fechar, o planejamento ficará marcado como fechado. Confirmar fechamento?",
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      clearMessages();
      const data = await fecharConfiguracao(detail.id);
      applyDetailState(data);
      setSuccess("Planejamento fechado com sucesso. A edição continua disponível para ajustes de última hora.");
      await refreshList();
    } catch (submitError) {
      setError(submitError.message || "Não foi possível fechar o planejamento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportExcel() {
    if (!detail) return;
    try {
      clearMessages();
      await exportarExcel(detail.id);
    } catch (exportError) {
      setError(exportError.message || "Não foi possível exportar o Excel.");
    }
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
        <h1 style={styles.title}>Previsão de Rancho</h1>
        <p style={styles.subtitle}>Gerencie o planejamento mensal de café e almoço em dias úteis.</p>
      </section>

      {error ? <div style={{ ...styles.card, ...styles.dangerButton, marginBottom: "18px" }}>{error}</div> : null}
      {success ? (
        <div style={{ ...styles.card, marginBottom: "18px", borderColor: "rgba(34,197,94,0.35)", color: "#bbf7d0" }}>
          {success}
        </div>
      ) : null}

      {mode === "list" ? (
        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>Planejamentos cadastrados</h2>
              <p style={styles.tableMeta}>{records.length} registro(s) localizado(s).</p>
            </div>
            <div style={styles.tableHeaderActions}>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode("create");
                }}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                Novo Planejamento
              </button>
            </div>
          </div>

          <div style={{ ...styles.card, margin: "16px" }}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Mês</label>
                <select
                  value={filters.mes}
                  onChange={(event) => setFilters((current) => ({ ...current, mes: event.target.value }))}
                  style={styles.input}
                >
                  <option value="">Todos</option>
                  {MONTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Ano</label>
                <input
                  type="number"
                  value={filters.ano}
                  onChange={(event) => setFilters((current) => ({ ...current, ano: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Unidade</label>
                <select
                  value={filters.unidade_id}
                  onChange={(event) => setFilters((current) => ({ ...current, unidade_id: event.target.value }))}
                  style={styles.input}
                  disabled={!isAdmin}
                >
                  <option value="">Todas</option>
                  {unitOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.footerActions}>
              <button
                type="button"
                onClick={() => {
                  const reset = {
                    mes: String(currentMonth),
                    ano: String(currentYear),
                    unidade_id: viewer.unitId ? String(viewer.unitId) : "",
                  };
                  setFilters(reset);
                  void refreshList(reset);
                }}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Limpar Filtros
              </button>
              <button type="button" onClick={() => void refreshList(filters)} style={{ ...styles.button, ...styles.primaryButton }}>
                Filtrar
              </button>
            </div>
          </div>

          {loading ? <div style={styles.emptyState}>Carregando planejamentos...</div> : null}
          {!loading && records.length === 0 ? <div style={styles.emptyState}>Nenhum planejamento de rancho cadastrado.</div> : null}

          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Mês/Ano</th>
                  <th style={styles.th}>Unidade</th>
                  <th style={styles.th}>Participantes</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td style={styles.td}>{formatMonthYear(record.mes, record.ano)}</td>
                    <td style={styles.td}>{record.unit_label || unitLabelMap[record.unit_id] || "-"}</td>
                    <td style={styles.td}>{record.total_participantes}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...statusBadge(record.fechado) }}>{record.fechado ? "Fechado" : "Aberto"}</span>
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={() => void openDetail(record.id)}
                        style={{ ...styles.button, ...styles.secondaryButton, padding: "8px 12px" }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {mode === "create" ? (
        <section style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h2 style={styles.sectionTitle}>Novo planejamento</h2>
              <p style={styles.sectionText}>Crie o mês base para iniciar as marcações do rancho.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setMode("list");
              }}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Voltar para lista
            </button>
          </div>

          <form onSubmit={handleCreateSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Mês</label>
                <select
                  value={createForm.mes}
                  onChange={(event) => setCreateForm((current) => ({ ...current, mes: event.target.value }))}
                  style={styles.input}
                >
                  {MONTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Ano</label>
                <input
                  type="number"
                  value={createForm.ano}
                  onChange={(event) => setCreateForm((current) => ({ ...current, ano: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Unidade</label>
                <select
                  value={createForm.unidade_id}
                  onChange={(event) => setCreateForm((current) => ({ ...current, unidade_id: event.target.value }))}
                  style={styles.input}
                  disabled={!isAdmin}
                >
                  <option value="">Selecione</option>
                  {unitOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.footerActions}>
              <button type="submit" disabled={saving} style={{ ...styles.button, ...styles.primaryButton }}>
                Criar Planejamento
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {mode === "detail" && detail ? (
        <>
          <section style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h2 style={styles.sectionTitle}>{formatMonthYear(detail.mes, detail.ano)}</h2>
                <p style={styles.sectionText}>
                  Unidade: <strong>{detail.unit_label || unitLabelMap[detail.unit_id] || "-"}</strong>
                  {" | "}
                  Status: <span style={{ ...styles.badge, ...statusBadge(detail.fechado) }}>{detail.fechado ? "Fechado" : "Aberto"}</span>
                </p>
              </div>
              <div style={styles.tableHeaderActions}>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode("list");
                    setDetail(null);
                    setEditingGrid(false);
                  }}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Voltar
                </button>
                <button type="button" onClick={() => void handleExportExcel()} style={{ ...styles.button, ...styles.secondaryButton }}>
                  Exportar Excel
                </button>
                {!editingGrid ? (
                  <button type="button" onClick={handleEditGrid} style={{ ...styles.button, ...styles.secondaryButton }}>
                    Editar
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={handleCancelEdit} style={{ ...styles.button, ...styles.secondaryButton }}>
                      Cancelar edição
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveGrid()}
                      disabled={savingGrid}
                      style={{ ...styles.button, ...styles.primaryButton }}
                    >
                      {savingGrid ? "Salvando..." : "Salvar"}
                    </button>
                  </>
                )}
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => void handleClosePlanning()}
                    disabled={detail.fechado || saving || editingGrid}
                    style={{ ...styles.button, ...styles.dangerButton }}
                  >
                    {detail.fechado ? "Planejamento fechado" : "Fechar planejamento"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section style={{ ...styles.card, marginTop: "18px" }}>
            <h3 style={styles.sectionTitle}>Adicionar participante</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
              {["PM", "CIVIL", "VISITANTE"].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleParticipantTypeChange(tipo)}
                  style={{
                    ...styles.button,
                    ...(participantForm.tipo_pessoa === tipo ? styles.primaryButton : styles.secondaryButton),
                    padding: "10px 18px",
                  }}
                >
                  {PERSON_TYPE_LABELS[tipo]}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddParticipant}>
              <div style={styles.formGrid}>
                {participantForm.tipo_pessoa === "PM" ? (
                  <>
                    <div style={styles.field}>
                      <label style={styles.label}>RE ou nome *</label>
                      <input
                        value={participantForm.re}
                        onChange={(event) => {
                          const value = event.target.value;
                          setParticipantForm((current) => ({ ...current, re: value }));
                          setSelectedPm(null);
                          setPmResult(null);
                        }}
                        placeholder="Digite o RE ou nome"
                        style={styles.input}
                      />
                      <span style={styles.helperText}>A busca aceita RE parcial e também nome do policial.</span>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Ordem</label>
                      <input
                        value={participantForm.ordem}
                        onChange={(event) =>
                          setParticipantForm((current) => ({
                            ...current,
                            ordem: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Busca</label>
                      <button type="button" disabled style={{ ...styles.button, ...styles.secondaryButton, height: "50px" }}>
                        {searchingPm ? "Buscando..." : "Busca automática"}
                      </button>
                    </div>
                  </>
                ) : null}

                {participantForm.tipo_pessoa === "CIVIL" ? (
                  <>
                    <div style={styles.field}>
                      <label style={styles.label}>RG *</label>
                      <input
                        value={participantForm.rg}
                        onChange={(event) => setParticipantForm((current) => ({ ...current, rg: event.target.value }))}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Nome *</label>
                      <input
                        value={participantForm.nome}
                        onChange={(event) => setParticipantForm((current) => ({ ...current, nome: event.target.value }))}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Graduação / Cargo</label>
                      <input
                        value={participantForm.graduacao}
                        onChange={(event) => setParticipantForm((current) => ({ ...current, graduacao: event.target.value }))}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Ordem</label>
                      <input
                        value={participantForm.ordem}
                        onChange={(event) =>
                          setParticipantForm((current) => ({
                            ...current,
                            ordem: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        style={styles.input}
                      />
                    </div>
                  </>
                ) : null}

                {participantForm.tipo_pessoa === "VISITANTE" ? (
                  <>
                    <div style={styles.field}>
                      <label style={styles.label}>Nome *</label>
                      <input
                        value={participantForm.nome}
                        onChange={(event) => setParticipantForm((current) => ({ ...current, nome: event.target.value }))}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Ordem</label>
                      <input
                        value={participantForm.ordem}
                        onChange={(event) =>
                          setParticipantForm((current) => ({
                            ...current,
                            ordem: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        style={styles.input}
                      />
                    </div>
                  </>
                ) : null}
              </div>

              {participantForm.tipo_pessoa === "PM" && pmSearchResults.length > 0 ? (
                <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                  {pmSearchResults.map((officer) => (
                    <button
                      key={officer.id}
                      type="button"
                      onClick={() => applySelectedPm(officer)}
                      style={{
                        ...styles.card,
                        padding: "14px 16px",
                        textAlign: "left",
                        border: selectedPm?.re === officer.re ? "1px solid rgba(45, 212, 191, 0.7)" : "1px solid var(--app-border)",
                        cursor: "pointer",
                      }}
                    >
                      <strong>{officer.graduacao || "-"}</strong> {officer.nomeGuerra}
                      <div style={{ color: "var(--app-text-muted)", marginTop: "4px" }}>
                        {officer.re} | {officer.nome} | {officer.unidade || "-"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {pmResult ? <div style={{ ...styles.infoBox, marginTop: "12px" }}>{formatParticipantPreview(pmResult)}</div> : null}

              <div style={styles.footerActions}>
                <button type="submit" disabled={saving || editingGrid} style={{ ...styles.button, ...styles.primaryButton }}>
                  Adicionar
                </button>
              </div>
            </form>
          </section>

          <section style={{ ...styles.tableCard, marginTop: "18px" }}>
            <div style={styles.tableHeader}>
              <div>
                <h3 style={styles.tableTitle}>Planejamento mensal</h3>
                <p style={styles.tableMeta}>
                  {detail.participantes.length} participante(s) | Use <strong>Editar</strong> para marcar ou desmarcar <strong>C</strong> de café e <strong>A</strong> de almoço. Sábados e domingos ficam fora da grade porque não há expediente de rancho.
                </p>
                <p style={{ ...styles.tableMeta, marginTop: "6px" }}>
                  {editingGrid
                    ? `${pendingGridChanges} alteração(ões) pendente(s) para salvar.`
                    : "A grade fica protegida até você entrar em modo de edição."}
                </p>
                {detail.fechado ? (
                  <p style={{ ...styles.tableMeta, marginTop: "6px" }}>
                    Planejamento fechado, mas ainda liberado para ajustes de última hora.
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ overflowX: "auto", maxHeight: "72vh", borderRadius: "16px" }}>
              <table style={{ ...styles.table, minWidth: `${320 + detailDates.length * 88}px` }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ ...styles.th, ...stickyNameCell(true) }}>
                      Nome
                    </th>
                    {detailDates.map((isoDate) => {
                      const label = formatDateLabel(isoDate);
                      return (
                        <th key={isoDate} colSpan={2} style={{ ...styles.th, textAlign: "center" }}>
                          <div>{label.top}</div>
                          <div>{label.bottom}</div>
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    {detailDates.flatMap((isoDate) => [
                      <th key={`${isoDate}-c`} style={{ ...styles.th, textAlign: "center", padding: "10px 8px" }}>
                        C
                      </th>,
                      <th key={`${isoDate}-a`} style={{ ...styles.th, textAlign: "center", padding: "10px 8px" }}>
                        A
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {detail.participantes.map((participante) => (
                    <tr key={participante.id}>
                      <td style={{ ...styles.td, ...stickyNameCell(false), fontWeight: 700 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                          <div>
                            <div>{participante.display_name}</div>
                            <div style={{ color: "var(--app-text-muted)", fontSize: "0.82rem" }}>
                              {PERSON_TYPE_LABELS[participante.tipo_pessoa] || participante.tipo_pessoa}
                              {participante.re ? ` | RE ${participante.re}` : participante.rg ? ` | RG ${participante.rg}` : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={editingGrid || saving}
                            onClick={() => void handleRemoveParticipant(participante)}
                            style={{ ...styles.button, ...styles.dangerButton, padding: "8px 10px", minWidth: "48px" }}
                            title="Remover participante"
                          >
                            {"\u2715"}
                          </button>
                        </div>
                      </td>

                      {detailDates.flatMap((isoDate) => {
                        const cafeMarked = getDraftLaunchValue(launchDraft, participante, isoDate, "cafe");
                        const almocoMarked = getDraftLaunchValue(launchDraft, participante, isoDate, "almoco");

                        return [
                          <td key={`${participante.id}-${isoDate}-c`} style={{ ...styles.td, textAlign: "center", padding: "0" }}>
                            <button
                              type="button"
                              disabled={!editingGrid || savingGrid}
                              onClick={() => toggleDraftLaunch(participante, isoDate, "cafe")}
                              title={cafeMarked ? "Desmarcar café" : "Marcar café"}
                              style={{
                                width: "100%",
                                minHeight: "42px",
                                border: "none",
                                backgroundColor: cafeMarked ? "#C6EFCE" : "transparent",
                                color: cafeMarked ? "#276221" : "var(--app-text-muted)",
                                fontWeight: 800,
                                cursor: !editingGrid || savingGrid ? "not-allowed" : "pointer",
                                transition: "background-color 120ms ease, color 120ms ease",
                              }}
                            >
                              {cafeMarked ? "X" : ""}
                            </button>
                          </td>,
                          <td key={`${participante.id}-${isoDate}-a`} style={{ ...styles.td, textAlign: "center", padding: "0" }}>
                            <button
                              type="button"
                              disabled={!editingGrid || savingGrid}
                              onClick={() => toggleDraftLaunch(participante, isoDate, "almoco")}
                              title={almocoMarked ? "Desmarcar almoço" : "Marcar almoço"}
                              style={{
                                width: "100%",
                                minHeight: "42px",
                                border: "none",
                                backgroundColor: almocoMarked ? "#C6EFCE" : "transparent",
                                color: almocoMarked ? "#276221" : "var(--app-text-muted)",
                                fontWeight: 800,
                                cursor: !editingGrid || savingGrid ? "not-allowed" : "pointer",
                                transition: "background-color 120ms ease, color 120ms ease",
                              }}
                            >
                              {almocoMarked ? "X" : ""}
                            </button>
                          </td>,
                        ];
                      })}
                    </tr>
                  ))}

                  {[
                    ["TOTAL EFETIVO", totalsForLabel.pm],
                    ["FUNCIONÁRIOS CIVIS", totalsForLabel.civil],
                    ["AVULSOS", totalsForLabel.visitante],
                    ["TOTAL GERAL", totalsForLabel.geral],
                  ].map(([label, totals]) => (
                    <tr key={label}>
                      <td style={{ ...styles.td, ...stickySummaryCell(), fontWeight: 800 }}>{label}</td>
                      {detailDates.flatMap((isoDate) => [
                        <td
                          key={`${label}-${isoDate}-c`}
                          style={{ ...styles.td, textAlign: "center", backgroundColor: "#374151", color: "#fff", fontWeight: 800 }}
                        >
                          {totalForDate(totals, isoDate, "cafe")}
                        </td>,
                        <td
                          key={`${label}-${isoDate}-a`}
                          style={{ ...styles.td, textAlign: "center", backgroundColor: "#374151", color: "#fff", fontWeight: 800 }}
                        >
                          {totalForDate(totals, isoDate, "almoco")}
                        </td>,
                      ])}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}










