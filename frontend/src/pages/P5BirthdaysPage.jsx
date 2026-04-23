import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { getUnits } from "../services/referenceDataService";
import {
  getMonthlyBirthdays,
  getUpcomingBirthdays,
  getWeeklyBirthdays,
} from "../services/relacoesPublicasService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { readViewerAccess } from "../utils/authAccess";
import {
  buildHierarchicalUnitLabelMap,
  buildHierarchicalUnitOptions,
} from "../utils/unitOptions";

const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Marco" },
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

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatBirthdayDay(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function emptyData(referenceDate) {
  return {
    reference_date: referenceDate,
    period_start: referenceDate,
    period_end: referenceDate,
    period_label: "-",
    total: 0,
    items: [],
  };
}

function getTodayCount(items) {
  return items.filter((item) => item.is_today).length;
}

function getNextBirthday(items) {
  if (!items.length) return null;
  return [...items].sort((a, b) => a.days_until_birthday - b.days_until_birthday)[0];
}

function formatNextBirthday(item) {
  if (!item) return "-";
  if (item.is_today) return `${item.war_name} faz aniversario hoje`;
  return `${item.war_name} em ${item.days_until_birthday} dia(s)`;
}

function groupBirthdaysByDay(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = item.birthday_date;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });

  return Array.from(groups.entries()).map(([dateKey, groupedItems]) => ({
    dateKey,
    label: formatBirthdayDay(dateKey),
    isToday: groupedItems.some((item) => item.is_today),
    items: groupedItems,
  }));
}

function buildExportRows(items) {
  return items.map((item) => ({
    data: formatBirthdayDay(item.birthday_date),
    destaque: item.is_today ? "Hoje" : "",
    nome_guerra: item.war_name,
    nome_completo: item.full_name,
    posto_graduacao: item.rank || "-",
    re: item.re_with_digit,
    unidade: item.unit_label || "-",
    nascimento: formatDate(item.birth_date),
    idade_atual: `${item.current_age} anos`,
    vai_completar: `${item.age_turning} anos`,
  }));
}

function SummaryCard({ label, value, helper }) {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <p style={styles.summaryValue}>{value}</p>
      {helper ? <p style={{ ...styles.summaryValue, ...styles.summaryValueSoft, marginTop: "4px" }}>{helper}</p> : null}
    </div>
  );
}

function getExportMeta(tab) {
  if (tab === "week") {
    return {
      fileSuffix: "semana",
      sheetName: "Semana",
      title: "Aniversariantes da Semana",
      tableTitle: "Aniversariantes da semana",
    };
  }

  if (tab === "month") {
    return {
      fileSuffix: "mes",
      sheetName: "Mes",
      title: "Aniversariantes do Mes",
      tableTitle: "Aniversariantes do mes",
    };
  }

  return {
    fileSuffix: "proximos-dias",
    sheetName: "Proximos",
    title: "Proximos Aniversariantes",
    tableTitle: "Proximos aniversariantes",
  };
}

export default function P5BirthdaysPage({ onBack }) {
  const viewer = readViewerAccess();
  const today = useMemo(() => new Date(), []);
  const [tab, setTab] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [units, setUnits] = useState([]);
  const [filters, setFilters] = useState({
    unit_id: viewer.unitId ? String(viewer.unitId) : "",
    reference_date: isoToday(),
    upcoming_days: "7",
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
  });
  const [weeklyData, setWeeklyData] = useState(emptyData(isoToday()));
  const [monthlyData, setMonthlyData] = useState(emptyData(isoToday()));
  const [upcomingData, setUpcomingData] = useState(emptyData(isoToday()));

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);
  const unitLabelMap = useMemo(() => buildHierarchicalUnitLabelMap(units), [units]);
  const activeData = tab === "week" ? weeklyData : tab === "month" ? monthlyData : upcomingData;
  const todayCount = useMemo(() => getTodayCount(activeData.items), [activeData.items]);
  const nextBirthday = useMemo(() => getNextBirthday(activeData.items), [activeData.items]);
  const groupedBirthdays = useMemo(() => groupBirthdaysByDay(activeData.items), [activeData.items]);
  const exportMeta = useMemo(() => getExportMeta(tab), [tab]);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError("");
      try {
        const [unitsData, weekData, monthData, nextData] = await Promise.all([
          getUnits(),
          getWeeklyBirthdays({
            reference_date: filters.reference_date,
            unit_id: filters.unit_id || null,
          }),
          getMonthlyBirthdays({
            year: filters.year,
            month: filters.month,
            unit_id: filters.unit_id || null,
          }),
          getUpcomingBirthdays({
            reference_date: filters.reference_date,
            days: filters.upcoming_days,
            unit_id: filters.unit_id || null,
          }),
        ]);
        setUnits(unitsData);
        setWeeklyData(weekData);
        setMonthlyData(monthData);
        setUpcomingData(nextData);
      } catch (loadError) {
        setError(loadError.message || "Nao foi possivel carregar os aniversariantes.");
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
    // Executa apenas no carregamento inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshWeek() {
    setLoading(true);
    setError("");
    try {
      const data = await getWeeklyBirthdays({
        reference_date: filters.reference_date,
        unit_id: filters.unit_id || null,
      });
      setWeeklyData(data);
    } catch (loadError) {
      setError(loadError.message || "Nao foi possivel carregar a lista semanal.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshMonth() {
    setLoading(true);
    setError("");
    try {
      const data = await getMonthlyBirthdays({
        year: filters.year,
        month: filters.month,
        unit_id: filters.unit_id || null,
      });
      setMonthlyData(data);
    } catch (loadError) {
      setError(loadError.message || "Nao foi possivel carregar a lista mensal.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshUpcoming() {
    setLoading(true);
    setError("");
    try {
      const data = await getUpcomingBirthdays({
        reference_date: filters.reference_date,
        days: filters.upcoming_days,
        unit_id: filters.unit_id || null,
      });
      setUpcomingData(data);
    } catch (loadError) {
      setError(loadError.message || "Nao foi possivel carregar a lista dos proximos dias.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportExcel() {
    await exportExcelReport({
      fileBaseName: `aniversariantes-${exportMeta.fileSuffix}`,
      sheetName: exportMeta.sheetName,
      title: exportMeta.title,
      subtitle: `${activeData.period_label} | Unidade: ${
        filters.unit_id ? unitLabelMap[Number(filters.unit_id)] || "Selecionada" : "Todas acessiveis"
      }`,
      columns: [
        { key: "data", label: "Data", width: 12 },
        { key: "destaque", label: "Hoje", width: 10 },
        { key: "nome_guerra", label: "Nome de Guerra", width: 24 },
        { key: "nome_completo", label: "Nome Completo", width: 30 },
        { key: "posto_graduacao", label: "Posto/Graduacao", width: 18 },
        { key: "re", label: "RE", width: 14 },
        { key: "unidade", label: "Unidade", width: 22 },
        { key: "nascimento", label: "Nascimento", width: 14 },
        { key: "idade_atual", label: "Idade Atual", width: 14 },
        { key: "vai_completar", label: "Vai Completar", width: 14 },
      ],
      rows: buildExportRows(activeData.items),
    });
  }

  async function handleExportPdf() {
    await exportPdfReport({
      fileBaseName: `aniversariantes-${exportMeta.fileSuffix}`,
      title: exportMeta.title,
      subtitle: `${activeData.period_label} | Unidade: ${
        filters.unit_id ? unitLabelMap[Number(filters.unit_id)] || "Selecionada" : "Todas acessiveis"
      }`,
      columns: [
        { key: "data", label: "Data" },
        { key: "destaque", label: "Hoje" },
        { key: "nome_guerra", label: "Nome de Guerra" },
        { key: "posto_graduacao", label: "Posto/Graduacao" },
        { key: "re", label: "RE" },
        { key: "unidade", label: "Unidade" },
        { key: "idade_atual", label: "Idade Atual" },
        { key: "vai_completar", label: "Vai Completar" },
      ],
      rows: buildExportRows(activeData.items),
      orientation: "landscape",
      summaryItems: [
        `Periodo: ${activeData.period_label}`,
        `Aniversariam hoje: ${todayCount}`,
        `Total de aniversariantes: ${activeData.total}`,
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
        </div>
        <h1 style={styles.title}>Aniversariantes do Efetivo</h1>
        <p style={styles.subtitle}>
          Consulte aniversariantes da semana, do mes e dos proximos dias no P5 - Relacoes Publicas, usando a data de
          nascimento ja cadastrada no policial.
        </p>
      </section>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <section style={styles.card}>
        <div style={{ ...styles.actions, marginTop: 0 }}>
          <button
            type="button"
            onClick={() => setTab("week")}
            style={{ ...styles.button, ...(tab === "week" ? styles.primaryButton : styles.secondaryButton) }}
          >
            Lista Semanal
          </button>
          <button
            type="button"
            onClick={() => setTab("month")}
            style={{ ...styles.button, ...(tab === "month" ? styles.primaryButton : styles.secondaryButton) }}
          >
            Lista Mensal
          </button>
          <button
            type="button"
            onClick={() => setTab("next")}
            style={{ ...styles.button, ...(tab === "next" ? styles.primaryButton : styles.secondaryButton) }}
          >
            Proximos 7 dias
          </button>
        </div>

        <div style={{ ...styles.formGrid, marginTop: "18px" }}>
          <div style={styles.field}>
            <label style={styles.label}>Unidade</label>
            <select
              value={filters.unit_id}
              onChange={(event) => setFilters((current) => ({ ...current, unit_id: event.target.value }))}
              style={styles.input}
            >
              <option value="">Todas as unidades acessiveis</option>
              {unitOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {tab === "week" ? (
            <div style={styles.field}>
              <label style={styles.label}>Data de referencia</label>
              <input
                type="date"
                value={filters.reference_date}
                onChange={(event) => setFilters((current) => ({ ...current, reference_date: event.target.value }))}
                style={styles.input}
              />
            </div>
          ) : null}

          {tab === "next" ? (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Data inicial</label>
                <input
                  type="date"
                  value={filters.reference_date}
                  onChange={(event) => setFilters((current) => ({ ...current, reference_date: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Janela de dias</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={filters.upcoming_days}
                  onChange={(event) => setFilters((current) => ({ ...current, upcoming_days: event.target.value }))}
                  style={styles.input}
                />
              </div>
            </>
          ) : null}

          {tab === "month" ? (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Mes</label>
                <select
                  value={filters.month}
                  onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}
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
                  value={filters.year}
                  onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
                  style={styles.input}
                />
              </div>
            </>
          ) : null}
        </div>

        <div style={styles.footerActions}>
          <button
            type="button"
            onClick={() => void (tab === "week" ? refreshWeek() : tab === "month" ? refreshMonth() : refreshUpcoming())}
            disabled={loading}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {loading ? "Atualizando..." : "Atualizar lista"}
          </button>
        </div>
      </section>

      <section style={{ ...styles.card, marginTop: "18px" }}>
        <div style={styles.summaryGrid}>
          <SummaryCard label="Periodo" value={activeData.period_label} />
          <SummaryCard label="Total" value={String(activeData.total)} />
          <SummaryCard label="Aniversariam hoje" value={String(todayCount)} />
          <SummaryCard
            label="Proximo destaque"
            value={nextBirthday ? nextBirthday.war_name : "-"}
            helper={formatNextBirthday(nextBirthday)}
          />
          <SummaryCard
            label="Inicio"
            value={formatDate(activeData.period_start)}
            helper={`Fim: ${formatDate(activeData.period_end)}`}
          />
          <SummaryCard
            label="Unidade"
            value={filters.unit_id ? unitLabelMap[Number(filters.unit_id)] || "Unidade selecionada" : "Todas acessiveis"}
          />
        </div>
      </section>

      <section style={{ ...styles.tableCard, marginTop: "18px" }}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>{exportMeta.tableTitle}</h2>
            <p style={styles.tableMeta}>
              {activeData.total} registro(s) encontrado(s) para {activeData.period_label}.
            </p>
          </div>
          <div style={styles.tableHeaderActions}>
            <button
              type="button"
              onClick={() => void handleExportExcel()}
              disabled={loading || activeData.items.length === 0}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Exportar Excel
            </button>
            <button
              type="button"
              onClick={() => void handleExportPdf()}
              disabled={loading || activeData.items.length === 0}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingCard}>Carregando aniversariantes...</div>
        ) : activeData.items.length === 0 ? (
          <div style={styles.emptyStateCard}>
            <p style={styles.emptyStateTitle}>Nenhum aniversariante encontrado</p>
            <p style={styles.emptyStateText}>Nao ha policiais ativos com aniversario no periodo filtrado.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px", padding: "16px" }}>
            {groupedBirthdays.map((group) => (
              <div key={group.dateKey} style={{ ...styles.card, padding: "16px 18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <h3 style={{ ...styles.sectionTitle, marginBottom: "4px" }}>{group.label}</h3>
                    <p style={{ ...styles.sectionText, marginBottom: 0 }}>{group.items.length} aniversariante(s) neste dia.</p>
                  </div>
                  {group.isToday ? <span style={{ ...styles.badge, ...styles.activeBadge }}>Hoje</span> : null}
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  {group.items.map((item) => (
                    <div
                      key={`${tab}-${item.id}-${item.birthday_date}`}
                      style={{
                        border: "1px solid var(--app-border)",
                        borderRadius: "16px",
                        padding: "14px 16px",
                        backgroundColor: item.is_today ? "var(--app-active-bg)" : "var(--app-surface-muted)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800 }}>{item.war_name}</div>
                          <div style={{ color: "var(--app-text-muted)", marginTop: "4px" }}>{item.full_name}</div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {item.is_today ? <span style={{ ...styles.badge, ...styles.activeBadge }}>Hoje</span> : null}
                          <span style={{ ...styles.badge, ...styles.neutralBadge }}>{item.re_with_digit}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "10px",
                          marginTop: "14px",
                        }}
                      >
                        <div>
                          <p style={styles.summaryLabel}>Posto/Graduacao</p>
                          <p style={{ ...styles.summaryValue, fontSize: "0.95rem" }}>{item.rank || "-"}</p>
                        </div>
                        <div>
                          <p style={styles.summaryLabel}>Unidade</p>
                          <p style={{ ...styles.summaryValue, fontSize: "0.95rem" }}>{item.unit_label || "-"}</p>
                        </div>
                        <div>
                          <p style={styles.summaryLabel}>Nascimento</p>
                          <p style={{ ...styles.summaryValue, fontSize: "0.95rem" }}>{formatDate(item.birth_date)}</p>
                        </div>
                        <div>
                          <p style={styles.summaryLabel}>Idade Atual</p>
                          <p style={{ ...styles.summaryValue, fontSize: "0.95rem" }}>{item.current_age} anos</p>
                        </div>
                        <div>
                          <p style={styles.summaryLabel}>Vai Completar</p>
                          <p style={{ ...styles.summaryValue, fontSize: "0.95rem" }}>{item.age_turning} anos</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
