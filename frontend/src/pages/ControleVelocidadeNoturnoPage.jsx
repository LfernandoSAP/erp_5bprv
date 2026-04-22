import { useCallback, useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import { getUnits } from "../services/referenceDataService";
import {
  createControleVelocidadeNoturno,
  deleteControleVelocidadeNoturno,
  getControlesVelocidadeNoturno,
  getResumoControlesVelocidadeNoturno,
} from "../services/controleVelocidadeNoturnoService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";

const emptyForm = {
  data_registro: "",
  unit_id: "",
  quantidade_autuados: "",
};

const MONTH_OPTIONS = [
  { value: "1", label: "Jan" },
  { value: "2", label: "Fev" },
  { value: "3", label: "Mar" },
  { value: "4", label: "Abr" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Jul" },
  { value: "8", label: "Ago" },
  { value: "9", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getPerformanceTone(total, maxTotal) {
  if (!total || !maxTotal) {
    return {
      background: "var(--app-neutral-bg)",
      color: "var(--app-neutral-text)",
      border: "1px solid var(--app-border)",
    };
  }

  const ratio = total / maxTotal;
  if (ratio >= 0.75) {
    return {
      background: "linear-gradient(180deg, rgba(34,197,94,0.9), rgba(22,163,74,0.82))",
      color: "#dcfce7",
      border: "1px solid rgba(134,239,172,0.45)",
    };
  }
  if (ratio >= 0.5) {
    return {
      background: "linear-gradient(180deg, rgba(59,130,246,0.9), rgba(29,78,216,0.82))",
      color: "#dbeafe",
      border: "1px solid rgba(147,197,253,0.45)",
    };
  }
  if (ratio >= 0.25) {
    return {
      background: "linear-gradient(180deg, rgba(245,158,11,0.9), rgba(217,119,6,0.82))",
      color: "#fef3c7",
      border: "1px solid rgba(252,211,77,0.45)",
    };
  }
  return {
    background: "linear-gradient(180deg, rgba(239,68,68,0.88), rgba(185,28,28,0.82))",
    color: "#fee2e2",
    border: "1px solid rgba(252,165,165,0.45)",
  };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function stickyCell(left = 0, isHeader = false) {
  return {
    position: "sticky",
    left,
    zIndex: isHeader ? 4 : 2,
    backgroundColor: isHeader ? "var(--app-surface-muted)" : "var(--app-surface)",
    boxShadow: left > 0 ? "6px 0 12px rgba(15, 23, 42, 0.06)" : "none",
  };
}

function unitDivider(index) {
  return index > 0 ? "2px solid rgba(148, 163, 184, 0.38)" : "1px solid var(--app-border)";
}

function monthValue(point, maxTotal) {
  if (!maxTotal) return 0;
  return Math.max(10, Math.round((point.total / maxTotal) * 100));
}

function isWeekend(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatGridUnitLabel(label) {
  const normalized = String(label || "").trim();
  const shortMap = {
    "5BPRv-EM": "EM",
    "5BPRV-EM": "EM",
    "1Cia": "1ª Cia",
    "2Cia": "2ª Cia",
    "3Cia": "3ª Cia",
    "4Cia": "4ª Cia",
  };
  return shortMap[normalized] || normalized;
}

export default function ControleVelocidadeNoturnoPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total_registros: 0, total_autuados: 0, total_mes_atual: 0, total_unidades: 0, monthly: [] });
  const [units, setUnits] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({
    year: String(new Date().getFullYear()),
    unit_id: "",
    month: String(new Date().getMonth() + 1),
  });
  const [form, setForm] = useState({
    ...emptyForm,
    data_registro: new Date().toISOString().slice(0, 10),
  });

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);
  const unitLabelMap = useMemo(
    () => Object.fromEntries(unitOptions.map((option) => [String(option.id), option.label])),
    [unitOptions]
  );
  const maxMonthly = useMemo(
    () => summary.monthly.reduce((acc, point) => Math.max(acc, point.total), 0),
    [summary.monthly]
  );
  const topMonth = useMemo(
    () => summary.monthly.reduce((best, point) => (point.total > (best?.total || 0) ? point : best), null),
    [summary.monthly]
  );
  const reportRows = useMemo(
    () => records.map((record) => ({
      data: formatDate(record.data_registro),
      mes: record.month_label,
      unidade: record.unit_label || unitLabelMap[String(record.unit_id)] || "-",
      quantidade: record.quantidade_autuados ?? 0,
      criadoEm: record.created_at ? new Date(record.created_at).toLocaleString("pt-BR") : "-",
    })),
    [records, unitLabelMap]
  );
  const reportColumns = useMemo(
    () => [
      { key: "data", label: "Data", width: 14 },
      { key: "mes", label: "Mês", width: 12 },
      { key: "unidade", label: "Unidade", width: 30 },
      { key: "quantidade", label: "Autuados", width: 14 },
      { key: "criadoEm", label: "Criado em", width: 20 },
    ],
    []
  );
  const selectedMonth = Number(filters.month || new Date().getMonth() + 1);
  const selectedYear = Number(filters.year || new Date().getFullYear());
  const monthlyGridRecords = useMemo(
    () => records.filter((record) => {
      const [year, month] = String(record.data_registro || "").split("-");
      return Number(year) === selectedYear && Number(month) === selectedMonth;
    }),
    [records, selectedMonth, selectedYear]
  );
  const gridUnitColumns = useMemo(() => {
    if (filters.unit_id) {
      return unitOptions.filter((option) => String(option.id) === String(filters.unit_id));
    }
    return unitOptions;
  }, [filters.unit_id, unitOptions]);
  const gridRows = useMemo(() => {
    const totalDays = daysInMonth(selectedYear, selectedMonth);
    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const isoDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const values = Object.fromEntries(
        gridUnitColumns.map((option) => {
          const record = monthlyGridRecords.find(
            (item) => String(item.unit_id) === String(option.id) && item.data_registro === isoDate
          );
          return [String(option.id), record?.quantidade_autuados ?? 0];
        })
      );
      return {
        isoDate,
        label: `${String(day).padStart(2, "0")}/${String(selectedMonth).padStart(2, "0")}/${selectedYear}`,
        values,
      };
    });
  }, [gridUnitColumns, monthlyGridRecords, selectedMonth, selectedYear]);
  const gridColumnTotals = useMemo(
    () => Object.fromEntries(
      gridUnitColumns.map((option) => [
        String(option.id),
        gridRows.reduce((acc, row) => acc + (row.values[String(option.id)] || 0), 0),
      ])
    ),
    [gridRows, gridUnitColumns]
  );
  const gridMaxValue = useMemo(
    () => Math.max(0, ...gridRows.flatMap((row) => gridUnitColumns.map((option) => row.values[String(option.id)] || 0))),
    [gridRows, gridUnitColumns]
  );
  const gridMonthTotal = useMemo(
    () => Object.values(gridColumnTotals).reduce((acc, value) => acc + (Number(value) || 0), 0),
    [gridColumnTotals]
  );
  const selectedMonthLabel = useMemo(
    () => MONTH_OPTIONS.find((option) => Number(option.value) === selectedMonth)?.label || String(selectedMonth).padStart(2, "0"),
    [selectedMonth]
  );

  const loadData = useCallback(async (nextFilters) => {
    try {
      setLoading(true);
      const [unitsData, recordsData, summaryData] = await Promise.all([
        getUnits(),
        getControlesVelocidadeNoturno(nextFilters),
        getResumoControlesVelocidadeNoturno({
          year: nextFilters.year,
          unit_id: nextFilters.unit_id,
        }),
      ]);
      setUnits(unitsData);
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setSummary(summaryData || { total_registros: 0, total_autuados: 0, total_mes_atual: 0, total_unidades: 0, monthly: [] });
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar o controle de velocidade noturno.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData({ year: filters.year, unit_id: filters.unit_id });
  }, [filters.year, filters.unit_id, loadData]);

  function beginCreate() {
    setForm({
      ...emptyForm,
      data_registro: new Date().toISOString().slice(0, 10),
      unit_id: filters.unit_id || "",
    });
    setShowForm(true);
    setSuccess("");
    setError("");
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!form.data_registro || !form.unit_id) {
      setError("Preencha data e unidade para lançar o registro.");
      return;
    }
    if (form.quantidade_autuados === "" || Number(form.quantidade_autuados) < 0) {
      setError("Informe a quantidade de números autuados.");
      return;
    }

    try {
      setSaving(true);
      await createControleVelocidadeNoturno({
        data_registro: form.data_registro,
        unit_id: Number(form.unit_id),
        quantidade_autuados: Number(form.quantidade_autuados),
      });
      setSuccess("Registro lançado com sucesso.");
      setShowForm(false);
      setForm(emptyForm);
      await loadData(filters);
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar o lançamento.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(record) {
    if (!window.confirm(`Excluir o lançamento de ${formatDate(record.data_registro)} da unidade ${record.unit_label}?`)) {
      return;
    }
    try {
      await deleteControleVelocidadeNoturno(record.id);
      setSuccess("Registro removido com sucesso.");
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
      }
      await loadData(filters);
    } catch (removeError) {
      setError(removeError.message || "Erro ao excluir o lançamento.");
    }
  }

  async function handleExportExcel() {
    await exportExcelReport({
      fileBaseName: "controle-velocidade-noturno",
      sheetName: "Velocidade Noturno",
      title: "Controle de Velocidade Noturno",
      subtitle: `Ano ${filters.year}${filters.unit_id ? ` | ${unitLabelMap[filters.unit_id] || "Unidade selecionada"}` : " | Todas as unidades"}`,
      columns: reportColumns,
      rows: reportRows,
    });
  }

  async function handleExportPdf() {
    await exportPdfReport({
      fileBaseName: "controle-velocidade-noturno",
      title: "Controle de Velocidade Noturno",
      subtitle: `Ano ${filters.year}${filters.unit_id ? ` | ${unitLabelMap[filters.unit_id] || "Unidade selecionada"}` : " | Todas as unidades"}`,
      orientation: "landscape",
      columns: reportColumns,
      rows: reportRows,
      summaryItems: [
        `Total de lançamentos: ${summary.total_registros}`,
        `Autuados no ano: ${summary.total_autuados}`,
        `Mês atual: ${summary.total_mes_atual}`,
        `Unidades envolvidas: ${summary.total_unidades}`,
      ],
    });
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Controle de Velocidade Noturno</h1>
        <p style={styles.subtitle}>Acompanhe os lançamentos por unidade e a evolução mensal do controle no P3.</p>
        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
          <button type="button" onClick={beginCreate} style={{ ...styles.button, ...styles.primaryButton }}>+ Novo Lançamento</button>
        </div>
      </section>

      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {success ? <div style={styles.successBox}>{success}</div> : null}

      <section style={styles.statsGrid}>
        <div style={{ ...styles.statCard, ...styles.statAccentCard }}>
          <p style={styles.statLabel}>AUTUADOS NO ANO</p>
          <p style={styles.statValue}>{summary.total_autuados}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>AUTUADOS NO MÊS ATUAL</p>
          <p style={styles.statValue}>{summary.total_mes_atual}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>UNIDADES ENVOLVIDAS</p>
          <p style={styles.statValue}>{summary.total_unidades}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>PICO MENSAL DE AUTUADOS</p>
          <p style={styles.statValue}>{topMonth ? topMonth.total : 0}</p>
          <p style={styles.helperText}>{topMonth ? topMonth.month_label : "-"}</p>
        </div>
      </section>

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Filtros e dashboard mensal</h2>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Ano</label>
            <select value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))} style={styles.input}>
              {[0, 1, 2, 3].map((offset) => {
                const year = String(new Date().getFullYear() - offset);
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Unidade</label>
            <select value={filters.unit_id} onChange={(event) => setFilters((current) => ({ ...current, unit_id: event.target.value }))} style={styles.input}>
              <option value="">Todas</option>
              {unitOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mês da grade</label>
            <select value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} style={styles.input}>
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.footerActions}>
          <button type="button" onClick={() => { const reset = { year: String(new Date().getFullYear()), unit_id: "", month: String(new Date().getMonth() + 1) }; setFilters(reset); void loadData(reset); }} style={{ ...styles.button, ...styles.secondaryButton }}>Limpar Filtros</button>
          <button type="button" onClick={() => void loadData(filters)} style={{ ...styles.button, ...styles.primaryButton }}>Atualizar Dashboard</button>
        </div>

        <div style={{ ...styles.card, marginTop: "18px", backgroundColor: "var(--app-surface-muted)", padding: "18px" }}>
          <h3 style={styles.sectionTitle}>Lançamentos por mês</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(44px, 1fr))", gap: "12px", alignItems: "end", minHeight: "220px", marginTop: "18px" }}>
            {summary.monthly.map((point) => (
              <div key={point.month_key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: 700, color: "var(--app-text-soft)" }}>{point.total}</span>
                <div style={{ height: "140px", width: "100%", display: "flex", alignItems: "flex-end" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${monthValue(point, maxMonthly)}%`,
                      borderRadius: "14px 14px 8px 8px",
                      background: getPerformanceTone(point.total, maxMonthly).background,
                      border: getPerformanceTone(point.total, maxMonthly).border,
                      minHeight: point.total > 0 ? "16px" : "8px",
                      boxShadow: "var(--app-shadow-soft)",
                    }}
                    title={`${point.month_label}: ${point.total}`}
                  />
                </div>
                <span style={{ fontSize: "0.84rem", color: "var(--app-text-muted)" }}>{point.month_label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...styles.card, marginTop: "18px", backgroundColor: "var(--app-surface-muted)", padding: "18px" }}>
          <h3 style={styles.sectionTitle}>Grade mensal por dia e unidade</h3>
          <p style={styles.sectionText}>
            Verde indica volumes mais altos, azul volumes medianos, laranja volumes baixos e vermelho os menores volumes registrados no recorte.
          </p>
          <div
            style={{
              marginBottom: "14px",
              borderRadius: "10px",
              overflow: "hidden",
              border: "2px solid rgba(250, 204, 21, 0.75)",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.2)",
            }}
          >
            <div
              style={{
                background: "#facc15",
                color: "#111827",
                padding: "10px 16px",
                fontWeight: 900,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                textAlign: "center",
                borderBottom: "2px solid rgba(15, 23, 42, 0.35)",
              }}
            >
              Controle de Velocidade Noturno
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                padding: "10px 16px",
                background: "rgba(248, 250, 252, 0.02)",
              }}
            >
              <span style={{ color: "var(--app-text)", fontWeight: 800 }}>
                Grade mensal: {selectedMonthLabel}/{selectedYear}
              </span>
              <span style={{ color: "var(--app-text-soft)", fontWeight: 700 }}>
                Total do mês: {gridMonthTotal}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            {[
              ["Maior volume", getPerformanceTone(gridMaxValue || 1, gridMaxValue || 1)],
              ["Volume mediano", getPerformanceTone(Math.max(1, Math.round((gridMaxValue || 1) * 0.55)), gridMaxValue || 1)],
              ["Volume baixo", getPerformanceTone(Math.max(1, Math.round((gridMaxValue || 1) * 0.3)), gridMaxValue || 1)],
              ["Menor volume", getPerformanceTone(1, gridMaxValue || 1)],
            ].map(([label, tone]) => (
              <div
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: "1px solid var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "999px",
                    background: tone.background,
                    border: tone.border,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "0.84rem", color: "var(--app-text-soft)" }}>{label}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              overflowX: "auto",
              maxHeight: "680px",
              borderRadius: "16px",
              border: "1px solid var(--app-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            <table style={{ ...styles.table, minWidth: `${160 + gridUnitColumns.length * 132}px` }}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...styles.th,
                      ...stickyCell(0, true),
                      position: "sticky",
                      top: 0,
                      zIndex: 6,
                      minWidth: "118px",
                      background: "#e5e7eb",
                      color: "#111827",
                      fontWeight: 900,
                      textTransform: "none",
                      letterSpacing: "0.01em",
                      borderRight: "2px solid rgba(15, 23, 42, 0.45)",
                      boxShadow: "0 8px 18px rgba(15, 23, 42, 0.22)",
                    }}
                  >
                    Data
                  </th>
                  {gridUnitColumns.map((option, index) => (
                    <th
                      key={option.id}
                      style={{
                        ...styles.th,
                        position: "sticky",
                        top: 0,
                        zIndex: 5,
                        background: "#e5e7eb",
                        color: "#111827",
                        fontWeight: 900,
                        textTransform: "none",
                        letterSpacing: "0.01em",
                        borderLeft: index > 0 ? "2px solid rgba(15, 23, 42, 0.45)" : "1px solid rgba(15, 23, 42, 0.22)",
                        boxShadow: "0 8px 18px rgba(15, 23, 42, 0.22)",
                      }}
                    >
                      {formatGridUnitLabel(option.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row) => (
                  <tr
                    key={row.isoDate}
                    style={{
                      backgroundColor: isWeekend(row.isoDate)
                        ? "rgba(250, 204, 21, 0.08)"
                        : gridRows.indexOf(row) % 2 === 1
                          ? "rgba(15, 23, 42, 0.08)"
                          : "transparent",
                    }}
                  >
                    <td
                      style={{
                        ...styles.td,
                        ...stickyCell(0, false),
                        minWidth: "118px",
                        fontWeight: 700,
                        borderRight: "2px solid rgba(148, 163, 184, 0.28)",
                        backgroundColor: isWeekend(row.isoDate) ? "rgba(250, 204, 21, 0.12)" : "var(--app-surface)",
                        color: isWeekend(row.isoDate) ? "#fde68a" : "var(--app-text)",
                      }}
                    >
                      {row.label}
                    </td>
                    {gridUnitColumns.map((option, index) => {
                      const value = row.values[String(option.id)] || 0;
                      const tone = getPerformanceTone(value, gridMaxValue);
                      return (
                        <td
                          key={`${row.isoDate}-${option.id}`}
                          style={{
                            ...styles.td,
                            textAlign: "center",
                            fontWeight: 700,
                            background: value > 0 ? tone.background : "var(--app-surface)",
                            color: value > 0 ? tone.color : "var(--app-text-muted)",
                            border: value > 0 ? tone.border : "1px solid var(--app-border)",
                            borderLeft: unitDivider(index),
                          }}
                        >
                          {value > 0 ? value : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr
                  style={{
                    background: "#dc2626",
                  }}
                >
                  <td
                    style={{
                      ...styles.td,
                      ...stickyCell(0, false),
                      minWidth: "118px",
                      fontWeight: 900,
                      background: "#dc2626",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRight: "2px solid rgba(255, 255, 255, 0.28)",
                    }}
                  >
                    Total
                  </td>
                  {gridUnitColumns.map((option, index) => {
                    const total = gridColumnTotals[String(option.id)] || 0;
                    return (
                      <td
                        key={`total-${option.id}`}
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          fontWeight: 900,
                          background: "#dc2626",
                          color: "#ffffff",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderLeft: index > 0 ? "2px solid rgba(255, 255, 255, 0.28)" : "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        {total}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td
                    colSpan={gridUnitColumns.length + 1}
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      fontWeight: 800,
                      background: "rgba(220, 38, 38, 0.16)",
                      color: "#fee2e2",
                    }}
                  >
                    Total geral do mês: {gridMonthTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showForm ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>Novo Lançamento</h2>
          <form onSubmit={submitForm}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Data *</label>
                <input type="date" value={form.data_registro} onChange={(event) => setForm((current) => ({ ...current, data_registro: event.target.value }))} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Unidade *</label>
                <select value={form.unit_id} onChange={(event) => setForm((current) => ({ ...current, unit_id: event.target.value }))} style={styles.input}>
                  <option value="">Selecione</option>
                  {unitOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Quantidade de números autuados *</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantidade_autuados}
                  onChange={(event) => setForm((current) => ({ ...current, quantidade_autuados: event.target.value.replace(/\D/g, "") }))}
                  placeholder="Ex: 38"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.footerActions}>
              <button type="button" onClick={() => setShowForm(false)} style={{ ...styles.button, ...styles.secondaryButton }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ ...styles.button, ...styles.primaryButton }}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </section>
      ) : null}

      {selectedRecord ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>Lançamento selecionado</h2>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Data</p><p style={styles.summaryValue}>{formatDate(selectedRecord.data_registro)}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Mês</p><p style={styles.summaryValue}>{selectedRecord.month_label}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Unidade</p><p style={styles.summaryValue}>{selectedRecord.unit_label}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Autuados</p><p style={styles.summaryValue}>{selectedRecord.quantidade_autuados ?? 0}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Criado em</p><p style={styles.summaryValue}>{selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString("pt-BR") : "-"}</p></div>
          </div>
        </section>
      ) : null}

      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Lançamentos do controle</h2>
            <p style={styles.tableMeta}>{records.length} registro(s) encontrado(s).</p>
          </div>
          <ReportExportButtons
            disabled={records.length === 0}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        </div>
        {loading ? <div style={styles.emptyState}>Carregando lançamentos...</div> : null}
        {!loading && records.length === 0 ? <div style={styles.emptyState}>Nenhum lançamento cadastrado para o recorte selecionado.</div> : null}
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ver</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Mês</th>
                <th style={styles.th}>Unidade</th>
                <th style={styles.th}>Autuados</th>
                <th style={styles.th}>Criado em</th>
                <th style={styles.th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                  <td style={styles.td}>
                    <button type="button" onClick={() => setSelectedRecord(record)} style={{ ...styles.button, ...styles.secondaryButton, padding: "8px 12px", fontSize: "0.84rem" }}>Ver</button>
                  </td>
                  <td style={styles.td}>{formatDate(record.data_registro)}</td>
                  <td style={styles.td}>{record.month_label}</td>
                  <td style={styles.td}>{record.unit_label || unitLabelMap[String(record.unit_id)] || "-"}</td>
                  <td style={styles.td}>{record.quantidade_autuados ?? 0}</td>
                  <td style={styles.td}>{record.created_at ? new Date(record.created_at).toLocaleString("pt-BR") : "-"}</td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => void removeRecord(record)} style={{ ...styles.button, ...styles.dangerButton, padding: "8px 12px", fontSize: "0.84rem" }}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}




