import { useCallback, useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { apiFetch } from "../services/api";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

const statusColors = {
  SUCCESS: { background: "var(--app-active-bg)", color: "var(--app-active-text)" },
  FAILED: { background: "var(--app-danger-bg)", color: "var(--app-danger-text)" },
  DENIED: { background: "var(--app-error-bg)", color: "var(--app-error-text)" },
};

const columns = [
  { key: "created_at", label: "Data/Hora", width: 20 },
  { key: "module", label: "Módulo", width: 16 },
  { key: "action", label: "Ação", width: 24 },
  { key: "status", label: "Status", width: 14 },
  { key: "actor", label: "Ator", width: 22 },
  { key: "target", label: "Alvo", width: 22 },
  { key: "ip_address", label: "IP", width: 18 },
  { key: "details", label: "Detalhes", width: 38 },
];

function AuditEventsPage({ onBack }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (moduleFilter) params.set("module", moduleFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "150");
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await apiFetch(`/telematica/audit-events/${query}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao consultar auditoria.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, searchTerm, statusFilter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const summary = useMemo(() => {
    const total = events.length;
    const failed = events.filter((event) => event.status === "FAILED").length;
    const denied = events.filter((event) => event.status === "DENIED").length;
    const recentThreshold = Date.now() - 24 * 60 * 60 * 1000;
    const recentCritical = events.filter((event) => {
      const eventTime = new Date(event.created_at).getTime();
      return eventTime >= recentThreshold && ["FAILED", "DENIED"].includes(event.status);
    });
    return { total, failed, denied, recentCritical };
  }, [events]);

  const reportRows = useMemo(
    () =>
      events.map((event) => ({
        created_at: new Date(event.created_at).toLocaleString("pt-BR"),
        module: event.module,
        action: event.action,
        status: event.status,
        actor: event.actor_name || event.actor_cpf || "-",
        target: event.target_name || event.target_cpf || "-",
        ip_address: event.ip_address || "-",
        details: event.details ? JSON.stringify(event.details) : "-",
      })),
    [events]
  );

  const reportSubtitle = useMemo(() => {
    const filters = [];
    if (searchTerm.trim()) filters.push(`Busca: ${searchTerm.trim()}`);
    if (moduleFilter) filters.push(`Módulo: ${moduleFilter}`);
    if (statusFilter) filters.push(`Status: ${statusFilter}`);
    return filters.join(" | ");
  }, [moduleFilter, searchTerm, statusFilter]);

  async function handleExportExcel() {
    await exportExcelReport({
      fileBaseName: "auditoria-seguranca",
      sheetName: "Auditoria",
      title: "Auditoria de Segurança",
      subtitle: reportSubtitle,
      columns,
      rows: reportRows,
    });
  }

  async function handleExportPdf() {
    await exportPdfReport({
      fileBaseName: "auditoria-seguranca",
      title: "Auditoria de Segurança",
      subtitle: reportSubtitle,
      columns,
      rows: reportRows,
      orientation: "landscape",
      summaryItems: [
        `Eventos carregados: ${summary.total}`,
        `FAILED: ${summary.failed}`,
        `DENIED: ${summary.denied}`,
      ],
    });
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Auditoria de Segurança</h1>
        <p style={styles.subtitle}>
          Consulte eventos sensíveis de autenticação e gestão de usuários.
        </p>

        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button onClick={loadEvents} style={{ ...styles.button, ...styles.primaryButton }}>
            Atualizar auditoria
          </button>
        </div>
      </section>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      {summary.recentCritical.length > 0 ? (
        <section
          style={{
            ...styles.card,
            marginBottom: "18px",
            borderColor: "var(--app-danger-border)",
            backgroundColor: "var(--app-danger-bg)",
          }}
        >
          <h2 style={{ ...styles.sectionTitle, color: "var(--app-danger-text)" }}>
            Alertas recentes
          </h2>
          <p style={{ ...styles.sectionText, color: "var(--app-danger-text)" }}>
            Há {summary.recentCritical.length} evento(s) FAILED/DENIED nas últimas 24 horas.
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            {summary.recentCritical.slice(0, 5).map((event) => (
              <div
                key={event.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "14px",
                  border: "1px solid var(--app-danger-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <strong>{event.action}</strong> em <strong>{event.module}</strong>
                {" · "}
                {new Date(event.created_at).toLocaleString("pt-BR")}
                {" · "}
                {event.actor_name || event.actor_cpf || "Ator não identificado"}
                {event.ip_address ? ` · IP ${event.ip_address}` : ""}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtros</h2>
        <div style={styles.formGrid}>
          <div style={styles.fieldFull}>
            <SearchInputAction
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={loadEvents}
              placeholder="Pesquisar por ação, módulo, CPF ou usuário"
              buttonLabel="Pesquisar"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Módulo</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={styles.input}
            >
              <option value="">Todos</option>
              <option value="AUTH">AUTH</option>
              <option value="TELEMATICA">TELEMATICA</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.input}
            >
              <option value="">Todos</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>
        </div>
      </section>

      <section style={{ ...styles.card, marginTop: "18px" }}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.sectionText}>Eventos carregados</p>
            <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>{summary.total}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.sectionText}>FAILED</p>
            <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>{summary.failed}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.sectionText}>DENIED</p>
            <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>{summary.denied}</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <ReportExportButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={events.length === 0}
          />
        </div>

        {!loading && events.length === 0 ? (
          <div style={styles.infoBox}>Nenhum evento encontrado com os filtros atuais.</div>
        ) : null}

        {loading ? <div style={styles.infoBox}>Carregando auditoria...</div> : null}

        {events.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1080px" }}>
              <thead>
                <tr>
                  {["Data/Hora", "Módulo", "Ação", "Status", "Ator", "Alvo", "IP", "Detalhes"].map(
                    (label) => (
                      <th
                        key={label}
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom: "1px solid var(--app-border)",
                          color: "var(--app-text-soft)",
                          fontSize: "0.86rem",
                        }}
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td style={cellStyle}>{new Date(event.created_at).toLocaleString("pt-BR")}</td>
                    <td style={cellStyle}>{event.module}</td>
                    <td style={cellStyle}>{event.action}</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontWeight: 700,
                          ...(statusColors[event.status] || {
                            background: "var(--app-neutral-bg)",
                            color: "var(--app-neutral-text)",
                          }),
                        }}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td style={cellStyle}>{event.actor_name || event.actor_cpf || "-"}</td>
                    <td style={cellStyle}>{event.target_name || event.target_cpf || "-"}</td>
                    <td style={cellStyle}>{event.ip_address || "-"}</td>
                    <td style={cellStyle}>
                      <code style={{ whiteSpace: "pre-wrap", fontSize: "0.82rem" }}>
                        {event.details ? JSON.stringify(event.details) : "-"}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid var(--app-border)",
  verticalAlign: "top",
};

export default AuditEventsPage;
