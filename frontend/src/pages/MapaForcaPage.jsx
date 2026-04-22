import { useCallback, useEffect, useMemo, useState } from "react";

import ReportExportButtons from "../components/ReportExportButtons";
import { appShellStyles as styles } from "../components/appShellStyles";
import {
  buscarViaturasMapaForca,
  createMapaForca,
  getMapaForca,
  getMapaForcaExportExcel,
  getMapaForcaExportPdf,
  getMapaForcaResumo,
  updateMapaForca,
} from "../services/mapaForcaService";
import { exportPdfReport } from "../utils/reportExport";

const GRAFISMO_OPTIONS = ["SIM", "NÃO", "DESCARACTERIZADA"];
const TAG_OPTIONS = ["SIM", "NÃO"];
const GROUP_ORDER = [
  "1. TRANSPORTE FUNCIONAL",
  "3. TRANSPORTE MISTO",
  "6. TRANSPORTE CARGA SECA",
  "7. TRANSPORTE COL MICRO",
  "8. VEÍCULO SERVIÇO RESERVADO",
  "11. ROCAM",
  "13. GUINCHO",
  "15. VEÍCULOS ESPECIAIS",
  "19. MOTO ESTAFETA",
  "20. FT (TOR)",
  "21. CMT BTL",
  "21. CMT CIA",
  "21. CFP",
  "21. CGP",
  "21. RP",
  "21. RP Rv Est",
  "21. APOIO BOP",
  "21. COP (Coord Op)",
  "22. TRANSPORTE PESSOAL",
  "26. APOIO OPERACIONAL",
];
const TYPE_ORDER = [
  "AUTOMÓVEL",
  "UTILITÁRIO",
  "MOTOCICLETA",
  "CAMINHÃO",
  "CAMIONETA",
  "CAMINHONETE",
  "REBOQUE OU SEMI REB",
  "TRAILER",
  "MICRO-ÔNIBUS",
  "ÔNIBUS",
];
const ORGAOS = ["PMESP", "DER", "CONCESSIONÁRIA"];
const SITUACOES = ["OPERANDO", "RESERVA", "BAIXADA", "PROCESSO DESCARGA", "DESCARREGADA"];

const emptyFilters = {
  cia: "",
  pel: "",
  grupo: "",
  situacao: "",
  orgao: "",
  tipo_veiculo: "",
  grafismo: "",
  tag_sem_parar: "",
  telemetria: "",
  q: "",
};

const emptyForm = {
  id: null,
  viatura_id: null,
  seq: "",
  bprv: 5,
  cia: 0,
  pel: 0,
  grafismo: "",
  tag_sem_parar: "",
  observacao: "",
  prefixLookup: "",
  auto: null,
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function statusBadge(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPERANDO") {
    return { backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
  }
  if (normalized === "RESERVA") {
    return { backgroundColor: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd" };
  }
  if (normalized === "BAIXADA") {
    return { backgroundColor: "#e5e7eb", color: "#374151", border: "1px solid #cbd5e1" };
  }
  if (normalized === "PROCESSO DESCARGA") {
    return { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" };
  }
  if (normalized === "DESCARREGADA") {
    return { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
  }
  return { backgroundColor: "var(--app-neutral-bg)", color: "var(--app-neutral-text)", border: "1px solid var(--app-border)" };
}

function statusRowTint(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPERANDO") {
    return { backgroundColor: "rgba(34, 197, 94, 0.07)" };
  }
  if (normalized === "RESERVA") {
    return { backgroundColor: "rgba(59, 130, 246, 0.07)" };
  }
  if (normalized === "BAIXADA") {
    return { backgroundColor: "rgba(148, 163, 184, 0.1)" };
  }
  if (normalized === "PROCESSO DESCARGA") {
    return { backgroundColor: "rgba(245, 158, 11, 0.08)" };
  }
  if (normalized === "DESCARREGADA") {
    return { backgroundColor: "rgba(239, 68, 68, 0.08)" };
  }
  return {};
}

function SummaryMiniTable({ title, headers, rows, getValue }) {
  return (
    <section style={{ ...styles.card, marginBottom: "18px" }}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} style={styles.th}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.grupo || row.tipo || row.status || index}
                style={row.grupo === "TOTAL" ? { backgroundColor: "rgba(45, 212, 191, 0.08)", fontWeight: 700 } : undefined}
              >
                {headers.map((header) => (
                  <td key={header} style={styles.td}>{getValue(row, header)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label} 🔒</label>
      <div style={{ ...styles.input, backgroundColor: "var(--app-surface-soft)" }}>{value || "-"}</div>
    </div>
  );
}

function stickyColumn(left, minWidth, isHeader = false) {
  return {
    position: "sticky",
    left,
    zIndex: isHeader ? 4 : 2,
    backgroundColor: isHeader ? "var(--app-surface-muted)" : "var(--app-surface)",
    minWidth,
    boxShadow: left > 0 ? "6px 0 12px rgba(15, 23, 42, 0.06)" : "none",
  };
}

function MapaForcaPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    byGroup: [],
    byType: [],
    byGrafismo: { SIM: {}, "NÃO": {} },
    descaracterizadas: {},
    byTag: { SIM: {}, "NÃO": {} },
    byTelemetria: { SIM: {}, "NÃO": {} },
    ultima_atualizacao: null,
    total_registros: 0,
  });
  const [selectedRow, setSelectedRow] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [suggestions, setSuggestions] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  function mapSummary(payload) {
    return {
      byGroup: payload?.tabela_grupo_situacao_orgao || [],
      byType: payload?.tabela_tipo_orgao || [],
      byGrafismo: payload?.tabela_grafismo || { SIM: {}, "NÃO": {} },
      descaracterizadas: payload?.tabela_descaracterizadas || {},
      byTag: payload?.tabela_tag || { SIM: {}, "NÃO": {} },
      byTelemetria: payload?.tabela_telemetria || { SIM: {}, "NÃO": {} },
      ultima_atualizacao: payload?.ultima_atualizacao || null,
      total_registros: payload?.total_registros || 0,
    };
  }

  const loadRecords = useCallback(async (nextFilters = emptyFilters) => {
    try {
      setLoading(true);
      const [data, summaryData] = await Promise.all([
        getMapaForca(nextFilters),
        getMapaForcaResumo(nextFilters),
      ]);
      setRecords(Array.isArray(data) ? data : []);
      setSummary(mapSummary(summaryData));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar o mapa força.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords(emptyFilters);
  }, [loadRecords]);

  useEffect(() => {
    const prefix = form.prefixLookup.trim();
    if (!showForm || prefix.length < 2 || form.viatura_id) {
      setSuggestions([]);
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLookupLoading(true);
        const result = await buscarViaturasMapaForca(prefix);
        if (active) {
          setSuggestions(result);
        }
      } catch {
        if (active) {
          setSuggestions([]);
        }
      } finally {
        if (active) {
          setLookupLoading(false);
        }
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.prefixLookup, form.viatura_id, showForm]);

  const stats = useMemo(() => ({
    total: records.length,
    operando: records.filter((row) => row.situacao === "OPERANDO").length,
    reserva: records.filter((row) => row.situacao === "RESERVA").length,
    baixadas: records.filter((row) => row.situacao === "BAIXADA").length,
  }), [records]);

  const latestUpdate = useMemo(() => (
    summary.ultima_atualizacao ? formatDateTime(summary.ultima_atualizacao) : "-"
  ), [summary.ultima_atualizacao]);

  const distinctGroups = useMemo(() => Array.from(new Set(records.map((row) => row.grupo).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")), [records]);
  const distinctTypes = useMemo(() => Array.from(new Set(records.map((row) => row.tipo_veiculo).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")), [records]);
  const nextAvailableSeq = useMemo(() => {
    const maxSeq = records.reduce((acc, row) => Math.max(acc, Number(row.seq) || 0), 0);
    return maxSeq + 1;
  }, [records]);
  const isDuplicateSeq = useMemo(() => {
    const targetSeq = Number(form.seq);
    if (!targetSeq) return false;
    return records.some((row) => Number(row.seq) === targetSeq && row.id !== form.id);
  }, [form.id, form.seq, records]);

  function beginNew() {
    setForm({ ...emptyForm, seq: String(nextAvailableSeq) });
    setSelectedRow(null);
    setSuggestions([]);
    setShowForm(true);
    setSuccess("");
    setError("");
  }

  function selectVehicleSuggestion(suggestion) {
    loadIntoForm(suggestion);
  }

  function loadIntoForm(row) {
    setSelectedRow(row);
    setForm({
      id: row.id ?? null,
      viatura_id: row.viatura_id,
      seq: row.seq ?? "",
      bprv: row.bprv ?? 5,
      cia: row.cia ?? 0,
      pel: row.pel ?? 0,
      grafismo: row.grafismo && row.grafismo !== "-" ? row.grafismo : "",
      tag_sem_parar: row.tag_sem_parar && row.tag_sem_parar !== "-" ? row.tag_sem_parar : "",
      observacao: row.observacao || "",
      prefixLookup: row.prefixo || "",
      auto: row,
    });
    setSuggestions([]);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.viatura_id) {
      setError("Selecione uma viatura pelo prefixo.");
      return;
    }
    if (isDuplicateSeq) {
      setError("A sequência informada já está em uso no mapa força.");
      return;
    }

    const payload = {
      viatura_id: form.viatura_id,
      seq: form.seq ? Number(form.seq) : null,
      pel: Number(form.pel || 0),
      grafismo: form.grafismo || null,
      tag_sem_parar: form.tag_sem_parar || null,
      observacao: form.observacao.trim() || null,
    };

    try {
      setSaving(true);
      if (form.id) {
        await updateMapaForca(form.id, payload);
        setSuccess("Registro do mapa força atualizado com sucesso.");
      } else {
        await createMapaForca(payload);
        setSuccess("Viatura vinculada ao mapa força com sucesso.");
      }
      setShowForm(false);
      setForm(emptyForm);
      await loadRecords(filters);
      setError("");
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar o mapa força.");
    } finally {
      setSaving(false);
    }
  }

  async function exportExcel() {
    const exportData = await getMapaForcaExportExcel(filters);
    const exportRows = Array.isArray(exportData?.rows) ? exportData.rows : records;
    const exportSummary = mapSummary(exportData?.summary || summary);
    const exportLatestUpdate = exportData?.ultima_atualizacao ? formatDateTime(exportData.ultima_atualizacao) : latestUpdate;
    const XLSX = await import("xlsx");
    const aoa = [
      ["COMANDO DE POLICIAMENTO RODOVIÁRIO — 5º BPRv"],
      ["MAPA FORÇA DE VIATURAS"],
      [`ÚLTIMA ATUALIZAÇÃO: ${exportLatestUpdate}`],
      [],
      ["TABELA 1 — POR GRUPO X SITUAÇÃO X ÓRGÃO"],
      ["GRUPO", "PM-OPER", "PM-RES", "PM-BAIX", "PM-PROC", "PM-DESC", "DER-OPER", "DER-RES", "DER-BAIX", "DER-PROC", "DER-DESC", "CONC-OPER", "CONC-RES", "CONC-BAIX", "CONC-PROC", "CONC-DESC"],
      ...exportSummary.byGroup.map((row) => [row.grupo, row["PM-OPER"], row["PM-RES"], row["PM-BAIX"], row["PM-PROC"], row["PM-DESC"], row["DER-OPER"], row["DER-RES"], row["DER-BAIX"], row["DER-PROC"], row["DER-DESC"], row["CONC-OPER"], row["CONC-RES"], row["CONC-BAIX"], row["CONC-PROC"], row["CONC-DESC"]]),
      [],
      ["TABELA 2 — POR TIPO DE VEÍCULO X ÓRGÃO"],
      ["TIPO", "PMESP", "DER", "CONCESSIONÁRIA"],
      ...exportSummary.byType.map((row) => [row.tipo_veiculo || row.tipo, row.PMESP, row.DER, row["CONCESSIONÁRIA"]]),
      [],
      ["TABELA 3 — GRAFISMO"],
      ["STATUS", "PMESP", "DER", "CONCESSIONÁRIA"],
      ["SIM", exportSummary.byGrafismo?.SIM?.PMESP ?? 0, exportSummary.byGrafismo?.SIM?.DER ?? 0, exportSummary.byGrafismo?.SIM?.["CONCESSIONÁRIA"] ?? 0],
      ["NÃO", exportSummary.byGrafismo?.["NÃO"]?.PMESP ?? 0, exportSummary.byGrafismo?.["NÃO"]?.DER ?? 0, exportSummary.byGrafismo?.["NÃO"]?.["CONCESSIONÁRIA"] ?? 0],
      [],
      ["TABELA 4 — DESCARACTERIZADAS"],
      ["TIPO", "PMESP", "DER", "CONCESSIONÁRIA"],
      ["DESCARACTERIZADA", exportSummary.descaracterizadas?.PMESP ?? 0, exportSummary.descaracterizadas?.DER ?? 0, exportSummary.descaracterizadas?.["CONCESSIONÁRIA"] ?? 0],
      [],
      ["TABELA 5 — TAG SEM PARAR"],
      ["STATUS", "PMESP", "DER", "CONCESSIONÁRIA"],
      ["SIM", exportSummary.byTag?.SIM?.PMESP ?? 0, exportSummary.byTag?.SIM?.DER ?? 0, exportSummary.byTag?.SIM?.["CONCESSIONÁRIA"] ?? 0],
      ["NÃO", exportSummary.byTag?.["NÃO"]?.PMESP ?? 0, exportSummary.byTag?.["NÃO"]?.DER ?? 0, exportSummary.byTag?.["NÃO"]?.["CONCESSIONÁRIA"] ?? 0],
      [],
      ["TABELA 6 — TELEMETRIA"],
      ["STATUS", "PMESP", "DER", "CONCESSIONÁRIA"],
      ["SIM", exportSummary.byTelemetria?.SIM?.PMESP ?? 0, exportSummary.byTelemetria?.SIM?.DER ?? 0, exportSummary.byTelemetria?.SIM?.["CONCESSIONÁRIA"] ?? 0],
      ["NÃO", exportSummary.byTelemetria?.["NÃO"]?.PMESP ?? 0, exportSummary.byTelemetria?.["NÃO"]?.DER ?? 0, exportSummary.byTelemetria?.["NÃO"]?.["CONCESSIONÁRIA"] ?? 0],
      [],
      ["LISTAGEM"],
      ["SEQ", "BPRv", "CIA", "PEL", "GRUPO", "SITUAÇÃO", "PREFIXO", "PLACA", "MARCA", "MODELO", "TIPO VEÍCULO", "RODAS", "COR", "CHASSI", "RENAVAM", "ANO FAB", "ANO MOD", "ÓRGÃO", "PATRIMÔNIO", "LOCADORA", "GRAFISMO", "TAG SEM PARAR", "TELEMETRIA", "OBSERVAÇÃO"],
      ...exportRows.map((row) => [row.seq, row.bprv, row.cia, row.pel, row.grupo, row.situacao, row.prefixo, row.placa, row.marca, row.modelo, row.tipo_veiculo, row.rodas, row.cor, row.chassi, row.renavam, row.ano_fab, row.ano_mod, row.orgao, row.patrimonio, row.locadora, row.grafismo, row.tag_sem_parar, row.telemetria, row.observacao]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet["!cols"] = Array.from({ length: 24 }, (_, index) => ({ wch: index < 6 ? 16 : 18 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mapa Força");
    XLSX.writeFile(workbook, `mapa_forca_viaturas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function exportPdf() {
    const exportData = await getMapaForcaExportPdf(filters);
    const exportRows = Array.isArray(exportData?.rows) ? exportData.rows : records;
    const exportLatestUpdate = exportData?.ultima_atualizacao ? formatDateTime(exportData.ultima_atualizacao) : latestUpdate;
    const exportStats = {
      total: exportRows.length,
      operando: exportRows.filter((row) => row.situacao === "OPERANDO").length,
      reserva: exportRows.filter((row) => row.situacao === "RESERVA").length,
      baixadas: exportRows.filter((row) => row.situacao === "BAIXADA").length,
      processoDescarga: exportRows.filter((row) => row.situacao === "PROCESSO DESCARGA").length,
      descarregadas: exportRows.filter((row) => row.situacao === "DESCARREGADA").length,
    };
    await exportPdfReport({
      fileBaseName: "mapa-forca-viaturas",
      title: "COMANDO DE POLICIAMENTO RODOVIÁRIO — 5º BPRv",
      subtitle: "MAPA FORÇA DE VIATURAS",
      orientation: "landscape",
      summaryItems: [
        `Última atualização: ${exportLatestUpdate}`,
        `Total de viaturas: ${exportStats.total}`,
        `Operando: ${exportStats.operando} | Reserva: ${exportStats.reserva} | Baixadas: ${exportStats.baixadas}`,
        `Processo descarga: ${exportStats.processoDescarga} | Descarregadas: ${exportStats.descarregadas}`,
      ],
      columns: [
        { key: "seq", label: "SEQ" },
        { key: "bprv", label: "BPRv" },
        { key: "cia", label: "CIA" },
        { key: "pel", label: "PEL" },
        { key: "grupo", label: "GRUPO" },
        { key: "situacao", label: "SITUAÇÃO" },
        { key: "prefixo", label: "PREFIXO" },
        { key: "placa", label: "PLACA" },
        { key: "marca", label: "MARCA" },
        { key: "modelo", label: "MODELO" },
        { key: "tipo_veiculo", label: "TIPO VEÍCULO" },
        { key: "orgao", label: "ÓRGÃO" },
        { key: "grafismo", label: "GRAFISMO" },
        { key: "tag_sem_parar", label: "TAG" },
        { key: "telemetria", label: "TELEMETRIA" },
      ],
      rows: exportRows,
    });
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Mapa Força de Viaturas</h1>
        <p style={styles.subtitle}>Comando de Policiamento Rodoviário — 5º BPRv</p>
        <p style={{ ...styles.helperText, marginTop: "12px" }}>Última Atualização: {latestUpdate}</p>
        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
          <button type="button" onClick={beginNew} style={{ ...styles.button, ...styles.primaryButton }}>+ Vincular Viatura</button>
        </div>
      </section>

      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {success ? <div style={styles.successBox}>{success}</div> : null}

      <section style={styles.statsGrid}>
        {[["TOTAL VIATURAS", stats.total, true], ["OPERANDO", stats.operando, false], ["RESERVA", stats.reserva, false], ["BAIXADAS", stats.baixadas, false]].map(([label, value, accent]) => (
          <div key={label} style={{ ...styles.statCard, ...(accent ? styles.statAccentCard : {}) }}>
            <p style={styles.statLabel}>{label}</p>
            <p style={styles.statValue}>{value}</p>
          </div>
        ))}
      </section>

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Legenda operacional</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {SITUACOES.map((status) => (
            <div
              key={status}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "999px",
                border: "1px solid var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <span style={{ ...styles.badge, ...statusBadge(status) }}>{status}</span>
              <span style={{ color: "var(--app-text-muted)", fontSize: "0.9rem" }}>
                leitura destacada na tabela
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Filtros</h2>
        <div style={styles.formGrid}>
          <div style={styles.field}><label style={styles.label}>CIA</label><select value={filters.cia} onChange={(event) => setFilters((current) => ({ ...current, cia: event.target.value }))} style={styles.input}><option value="">Todos</option><option value="0">EM</option><option value="1">1Cia</option><option value="2">2Cia</option><option value="3">3Cia</option><option value="4">4Cia</option></select></div>
          <div style={styles.field}><label style={styles.label}>PEL</label><select value={filters.pel} onChange={(event) => setFilters((current) => ({ ...current, pel: event.target.value }))} style={styles.input}><option value="">Todos</option><option value="0">Sem pelotão</option><option value="1">1Pel</option><option value="2">2Pel</option></select></div>
          <div style={styles.field}><label style={styles.label}>Grupo</label><select value={filters.grupo} onChange={(event) => setFilters((current) => ({ ...current, grupo: event.target.value }))} style={styles.input}><option value="">Todos</option>{distinctGroups.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Situação</label><select value={filters.situacao} onChange={(event) => setFilters((current) => ({ ...current, situacao: event.target.value }))} style={styles.input}><option value="">Todas</option>{SITUACOES.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Órgão</label><select value={filters.orgao} onChange={(event) => setFilters((current) => ({ ...current, orgao: event.target.value }))} style={styles.input}><option value="">Todos</option>{ORGAOS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Tipo Veículo</label><select value={filters.tipo_veiculo} onChange={(event) => setFilters((current) => ({ ...current, tipo_veiculo: event.target.value }))} style={styles.input}><option value="">Todos</option>{distinctTypes.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Grafismo</label><select value={filters.grafismo} onChange={(event) => setFilters((current) => ({ ...current, grafismo: event.target.value }))} style={styles.input}><option value="">Todos</option>{GRAFISMO_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Tag Sem Parar</label><select value={filters.tag_sem_parar} onChange={(event) => setFilters((current) => ({ ...current, tag_sem_parar: event.target.value }))} style={styles.input}><option value="">Todos</option>{TAG_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Telemetria</label><select value={filters.telemetria} onChange={(event) => setFilters((current) => ({ ...current, telemetria: event.target.value }))} style={styles.input}><option value="">Todos</option>{TAG_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Busca livre</label><input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Prefixo, placa, marca ou modelo" style={styles.input} /></div>
        </div>
        <div style={styles.footerActions}>
          <button type="button" onClick={() => { setFilters(emptyFilters); void loadRecords(emptyFilters); }} style={{ ...styles.button, ...styles.secondaryButton }}>Limpar Filtros</button>
          <button type="button" onClick={() => void loadRecords(filters)} style={{ ...styles.button, ...styles.primaryButton }}>Atualizar dados</button>
        </div>
      </section>

      {selectedRow ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>Viatura selecionada</h2>
          <p style={styles.sectionText}>Detalhe rápido da viatura atualmente aberta para edição no mapa força.</p>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Prefixo</p><p style={styles.summaryValue}>{selectedRow.prefixo || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Placa</p><p style={styles.summaryValue}>{selectedRow.placa || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Situação</p><p style={styles.summaryValue}>{selectedRow.situacao || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Órgão</p><p style={styles.summaryValue}>{selectedRow.orgao || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Grupo</p><p style={styles.summaryValue}>{selectedRow.grupo || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Unidade</p><p style={styles.summaryValue}>{selectedRow.unidade_label || "-"}</p></div>
          </div>
        </section>
      ) : null}

      {showForm ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>{form.id ? "Editar Viatura no Mapa Força" : "Vincular Viatura ao Mapa Força"}</h2>
          <p style={styles.sectionText}>Preencha a linha do mapa força e confirme os dados automáticos trazidos do cadastro principal de viaturas.</p>
          <form onSubmit={handleSubmit}>
            <section style={{ ...styles.card, marginBottom: "18px", padding: "18px", backgroundColor: "var(--app-surface-muted)" }}>
              <h3 style={styles.sectionTitle}>Linha do mapa força</h3>
              <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                  <p style={styles.summaryLabel}>Próxima sequência sugerida</p>
                  <p style={styles.summaryValue}>{nextAvailableSeq}</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={styles.summaryLabel}>Última sequência usada</p>
                  <p style={styles.summaryValue}>{Math.max(nextAvailableSeq - 1, 0)}</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={styles.summaryLabel}>Registros no recorte atual</p>
                  <p style={styles.summaryValue}>{records.length}</p>
                </div>
              </div>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Prefixo *</label>
                  <input value={form.prefixLookup} onChange={(event) => setForm((current) => ({ ...current, prefixLookup: event.target.value, viatura_id: null, auto: null }))} placeholder="Digite 2+ caracteres do prefixo" style={styles.input} />
                  {lookupLoading ? <p style={styles.helperText}>Buscando viaturas...</p> : null}
                  {suggestions.length > 0 ? (
                    <div style={{ ...styles.listStack, marginTop: "8px" }}>
                      {suggestions.map((item) => (
                        <button key={item.viatura_id} type="button" onClick={() => selectVehicleSuggestion(item)} style={{ ...styles.button, ...styles.secondaryButton, textAlign: "left", justifyContent: "flex-start", borderRadius: "14px" }}>
                          {item.prefixo} | {item.placa || "-"} | {item.modelo || "-"} | {item.situacao || "-"}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>SEQ</label>
                  <input value={form.seq} onChange={(event) => setForm((current) => ({ ...current, seq: event.target.value.replace(/\D/g, "") }))} placeholder="Sequência da linha" style={{ ...styles.input, ...(isDuplicateSeq ? { borderColor: "var(--app-error-border)", color: "var(--app-error-text)" } : {}) }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                    <p style={styles.helperText}>Use a ordem da planilha para manter a leitura operacional.</p>
                    <button type="button" onClick={() => setForm((current) => ({ ...current, seq: String(nextAvailableSeq) }))} style={{ ...styles.button, ...styles.secondaryButton, padding: "8px 12px", fontSize: "0.82rem" }}>Usar próxima sequência</button>
                  </div>
                  {isDuplicateSeq ? <p style={{ ...styles.helperText, color: "var(--app-error-text)" }}>Já existe outra viatura com essa sequência no mapa força.</p> : null}
                </div>
                <div style={styles.field}><label style={styles.label}>BPRv 🔒</label><div style={{ ...styles.input, backgroundColor: "var(--app-surface-soft)" }}>{form.bprv}</div></div>
                <div style={styles.field}><label style={styles.label}>CIA 🔒</label><div style={{ ...styles.input, backgroundColor: "var(--app-surface-soft)" }}>{form.cia}</div></div>
                <div style={styles.field}><label style={styles.label}>PEL</label><select value={form.pel} onChange={(event) => setForm((current) => ({ ...current, pel: Number(event.target.value) }))} style={styles.input}><option value="0">0</option><option value="1">1</option><option value="2">2</option></select></div>
                <div style={styles.field}><label style={styles.label}>Grafismo</label><select value={form.grafismo} onChange={(event) => setForm((current) => ({ ...current, grafismo: event.target.value }))} style={styles.input}><option value="">Selecione</option>{GRAFISMO_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                <div style={styles.field}><label style={styles.label}>Tag Sem Parar</label><select value={form.tag_sem_parar} onChange={(event) => setForm((current) => ({ ...current, tag_sem_parar: event.target.value }))} style={styles.input}><option value="">Selecione</option>{TAG_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
              </div>
              <div style={{ ...styles.fieldFull, marginTop: "16px" }}>
                <label style={styles.label}>Observação</label>
                <textarea value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Observações da viatura" style={{ ...styles.textarea, minHeight: "120px" }} />
              </div>
            </section>

            {form.auto ? (
              <section style={{ marginTop: "22px" }}>
                <h3 style={styles.sectionTitle}>Ficha automática da Frota</h3>
                <p style={styles.sectionText}>Campos trazidos do cadastro principal e mantidos em somente leitura para preservar a consistência do mapa.</p>
                <div style={{ ...styles.card, marginBottom: "16px", padding: "18px", backgroundColor: "var(--app-surface-muted)" }}>
                  <h4 style={{ ...styles.sectionTitle, fontSize: "0.98rem" }}>Identificação da viatura</h4>
                  <div style={styles.formGrid}>
                    <ReadOnlyField label="Prefixo" value={form.auto.prefixo} />
                    <ReadOnlyField label="Placa" value={form.auto.placa} />
                    <ReadOnlyField label="Marca" value={form.auto.marca} />
                    <ReadOnlyField label="Modelo" value={form.auto.modelo} />
                    <ReadOnlyField label="Tipo Veículo" value={form.auto.tipo_veiculo} />
                    <ReadOnlyField label="Grupo" value={form.auto.grupo} />
                    <ReadOnlyField label="Situação" value={form.auto.situacao} />
                    <ReadOnlyField label="Unidade" value={form.auto.unidade_label} />
                  </div>
                </div>
                <div style={{ ...styles.card, padding: "18px", backgroundColor: "var(--app-surface-muted)" }}>
                  <h4 style={{ ...styles.sectionTitle, fontSize: "0.98rem" }}>Cadastro e rastreio</h4>
                  <div style={styles.formGrid}>
                    <ReadOnlyField label="Rodas" value={form.auto.rodas} />
                    <ReadOnlyField label="Cor" value={form.auto.cor} />
                    <ReadOnlyField label="Chassi" value={form.auto.chassi} />
                    <ReadOnlyField label="Renavam" value={form.auto.renavam} />
                    <ReadOnlyField label="Ano Fab" value={form.auto.ano_fab} />
                    <ReadOnlyField label="Ano Mod" value={form.auto.ano_mod} />
                    <ReadOnlyField label="Órgão" value={form.auto.orgao} />
                    <ReadOnlyField label="Patrimônio" value={form.auto.patrimonio} />
                    <ReadOnlyField label="Locadora" value={form.auto.locadora} />
                    <ReadOnlyField label="Telemetria" value={form.auto.telemetria} />
                  </div>
                </div>
              </section>
            ) : null}

            <div style={styles.footerActions}>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setSuggestions([]); }} style={{ ...styles.button, ...styles.secondaryButton }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ ...styles.button, ...styles.primaryButton }}>{saving ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar"}</button>
            </div>
          </form>
        </section>
      ) : null}

      <SummaryMiniTable title="Tabela 1 — Por Grupo x Situação x Órgão" headers={["GRUPO", "PM-OPER", "PM-RES", "PM-BAIX", "PM-PROC", "PM-DESC", "DER-OPER", "DER-RES", "DER-BAIX", "DER-PROC", "DER-DESC", "CONC-OPER", "CONC-RES", "CONC-BAIX", "CONC-PROC", "CONC-DESC"]} rows={summary.byGroup} getValue={(row, header) => (header === "GRUPO" ? row.grupo : row[header] ?? 0)} />

      <SummaryMiniTable title="Tabela 2 — Por Tipo de Veículo x Órgão" headers={["TIPO", "PMESP", "DER", "CONCESSIONÁRIA"]} rows={summary.byType} getValue={(row, header) => (header === "TIPO" ? row.tipo_veiculo || row.tipo : row[header] ?? 0)} />

      <div style={styles.formGrid}>
        <SummaryMiniTable title="Tabela 3 — Grafismo" headers={["STATUS", "PMESP", "DER", "CONCESSIONÁRIA"]} rows={[{ status: "SIM", ...summary.byGrafismo.SIM }, { status: "NÃO", ...summary.byGrafismo["NÃO"] }]} getValue={(row, header) => (header === "STATUS" ? row.status : row[header] ?? 0)} />
        <SummaryMiniTable title="Tabela 4 — Descaracterizadas" headers={["TIPO", "PMESP", "DER", "CONCESSIONÁRIA"]} rows={[{ tipo: "DESCARACTERIZADA", ...summary.descaracterizadas }]} getValue={(row, header) => (header === "TIPO" ? row.tipo : row[header] ?? 0)} />
      </div>

      <div style={styles.formGrid}>
        <SummaryMiniTable title="Tabela 5 — Tag Sem Parar" headers={["STATUS", "PMESP", "DER", "CONCESSIONÁRIA"]} rows={[{ status: "SIM", ...summary.byTag.SIM }, { status: "NÃO", ...summary.byTag["NÃO"] }]} getValue={(row, header) => (header === "STATUS" ? row.status : row[header] ?? 0)} />
        <SummaryMiniTable title="Tabela 6 — Telemetria" headers={["STATUS", "PMESP", "DER", "CONCESSIONÁRIA"]} rows={[{ status: "SIM", ...summary.byTelemetria.SIM }, { status: "NÃO", ...summary.byTelemetria["NÃO"] }]} getValue={(row, header) => (header === "STATUS" ? row.status : row[header] ?? 0)} />
      </div>

      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Viaturas do mapa força</h2>
            <p style={styles.tableMeta}>{records.length} registro(s) filtrado(s).</p>
          </div>
          <ReportExportButtons disabled={records.length === 0} onExportExcel={exportExcel} onExportPdf={exportPdf} />
        </div>
        {loading ? <div style={styles.emptyState}>Carregando mapa força...</div> : null}
        {!loading && records.length === 0 ? <div style={styles.emptyState}>Nenhuma viatura encontrada para os filtros aplicados.</div> : null}
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...stickyColumn(0, 72, true) }}>SEQ</th>
                <th style={styles.th}>BPRv</th>
                <th style={styles.th}>CIA</th>
                <th style={styles.th}>PEL</th>
                <th style={styles.th}>GRUPO</th>
                <th style={{ ...styles.th, ...stickyColumn(72, 150, true) }}>PREFIXO</th>
                <th style={{ ...styles.th, ...stickyColumn(222, 150, true) }}>PLACA</th>
                <th style={{ ...styles.th, ...stickyColumn(372, 170, true) }}>SITUAÇÃO</th>
                <th style={styles.th}>MARCA</th>
                <th style={styles.th}>MODELO</th>
                <th style={styles.th}>TIPO VEÍ</th>
                <th style={styles.th}>RODAS</th>
                <th style={styles.th}>COR</th>
                <th style={styles.th}>CHASSI</th>
                <th style={styles.th}>RENAVAM</th>
                <th style={styles.th}>ANO FAB</th>
                <th style={styles.th}>ANO MOD</th>
                <th style={styles.th}>ÓRGÃO</th>
                <th style={styles.th}>PATRIMÔNIO</th>
                <th style={styles.th}>LOCADORA</th>
                <th style={styles.th}>GRAFISMO</th>
                <th style={styles.th}>TAG</th>
                <th style={styles.th}>TELEMETRIA</th>
                <th style={styles.th}>OBS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr
                  key={`${row.viatura_id}-${row.id || "novo"}`}
                  onClick={() => loadIntoForm(row)}
                  style={{ cursor: "pointer", ...statusRowTint(row.situacao) }}
                >
                  <td style={{ ...styles.td, ...stickyColumn(0, 72) }}>{row.seq}</td>
                  <td style={styles.td}>{row.bprv}</td>
                  <td style={styles.td}>{row.cia}</td>
                  <td style={styles.td}>{row.pel}</td>
                  <td style={styles.td}>{row.grupo}</td>
                  <td style={{ ...styles.td, ...stickyColumn(72, 150) }}>{row.prefixo}</td>
                  <td style={{ ...styles.td, ...stickyColumn(222, 150) }}>{row.placa || "-"}</td>
                  <td style={{ ...styles.td, ...stickyColumn(372, 170) }}><span style={{ ...styles.badge, ...statusBadge(row.situacao) }}>{row.situacao}</span></td>
                  <td style={styles.td}>{row.marca || "-"}</td>
                  <td style={styles.td}>{row.modelo || "-"}</td>
                  <td style={styles.td}>{row.tipo_veiculo || "-"}</td>
                  <td style={styles.td}>{row.rodas || "-"}</td>
                  <td style={styles.td}>{row.cor || "-"}</td>
                  <td style={styles.td}>{row.chassi || "-"}</td>
                  <td style={styles.td}>{row.renavam || "-"}</td>
                  <td style={styles.td}>{row.ano_fab || "-"}</td>
                  <td style={styles.td}>{row.ano_mod || "-"}</td>
                  <td style={styles.td}>{row.orgao || "-"}</td>
                  <td style={styles.td}>{row.patrimonio || "-"}</td>
                  <td style={styles.td}>{row.locadora || "-"}</td>
                  <td style={styles.td}>{row.grafismo || "-"}</td>
                  <td style={styles.td}>{row.tag_sem_parar || "-"}</td>
                  <td style={styles.td}>{row.telemetria || "-"}</td>
                  <td style={styles.td}>{row.observacao || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default MapaForcaPage;


