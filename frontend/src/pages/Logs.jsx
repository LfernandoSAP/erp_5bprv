import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import { getLogs } from "../services/logsService";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

function Logs({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  const actionCounts = useMemo(
    () =>
      logs.reduce((accumulator, log) => {
        const action = log.action || "OUTROS";
        accumulator[action] = (accumulator[action] || 0) + 1;
        return accumulator;
      }, {}),
    [logs]
  );

  const reportColumns = useMemo(
    () => [
      { key: "item", label: "Item", width: 24 },
      { key: "user", label: "Usuário", width: 22 },
      { key: "action", label: "Ação", width: 16 },
      { key: "details", label: "Detalhes", width: 30 },
      { key: "createdAt", label: "Data/Hora", width: 18 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      logs.map((log) => ({
        item: log.item_name ? `${log.item_name} (#${log.item_id})` : `#${log.item_id}`,
        user: log.user_name ? `${log.user_name} (#${log.user_id})` : `#${log.user_id}`,
        action: formatAction(log.action),
        details: log.details || "-",
        createdAt: formatDateTime(log.created_at),
      })),
    [logs]
  );

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        extraDetails: ["Histórico cronológico do sistema"],
      }),
    [reportRows.length]
  );

  async function loadLogs() {
    const data = await getLogs();
    setLogs(data);
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  const handleViewLog = (log) => {
    setSelectedLog(log);
  };

  const handleCloseLog = () => {
    setSelectedLog(null);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Histórico de ações</h1>
        <p style={styles.subtitle}>
          Consulte o registro cronológico das operações realizadas no sistema.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>
        </div>
      </section>

      <section style={styles.tableCard}>
        {selectedLog && (
          <section style={{ ...styles.card, margin: "20px 20px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <div>
                <h2 style={styles.sectionTitle}>Detalhes do log</h2>
                <p style={styles.sectionText}>
                  Consulte os metadados completos da ação selecionada.
                </p>
              </div>
              <div style={styles.tableHeaderActions}>
                <button
                  type="button"
                  onClick={handleCloseLog}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  ← Voltar
                </button>
              </div>
            </div>

            <DetailSection
              title="Registro"
              fields={[
                [
                  "Item",
                  selectedLog.item_name
                    ? `${selectedLog.item_name} (#${selectedLog.item_id})`
                    : `#${selectedLog.item_id}`,
                ],
                [
                  "Usuário",
                  selectedLog.user_name
                    ? `${selectedLog.user_name} (#${selectedLog.user_id})`
                    : `#${selectedLog.user_id}`,
                ],
                ["Ação", formatAction(selectedLog.action)],
                ["Data/Hora", formatDateTime(selectedLog.created_at)],
                ["Detalhes", selectedLog.details || "-"],
              ]}
            />
          </section>
        )}

        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Logs do sistema</h2>
            <p style={styles.tableMeta}>{logs.length} registro(s) encontrado(s)</p>
          </div>
          <ReportExportButtons
            disabled={reportRows.length === 0}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "logs-sistema",
                sheetName: "Logs",
                title: "Relatório de logs do sistema",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "logs-sistema",
                title: "Relatório de logs do sistema",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
                orientation: "landscape",
              })
            }
          />
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Registros</p>
              <p style={styles.summaryValue}>{logs.length}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Criações</p>
              <p style={styles.summaryValue}>{actionCounts.CREATE || 0}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Atualizações</p>
              <p style={styles.summaryValue}>{actionCounts.UPDATE || 0}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Movimentações</p>
              <p style={styles.summaryValue}>{actionCounts.MOVEMENT || 0}</p>
            </div>
          </div>
        </div>

        <div className="desktop-table-view" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>
                  Ver
                </th>
                <th style={{ ...styles.th, width: "260px", whiteSpace: "nowrap" }}>
                  Item
                </th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                  Usuário
                </th>
                <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>
                  Ação
                </th>
                <th style={{ ...styles.th, width: "170px", whiteSpace: "nowrap" }}>
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={log.id}
                  style={
                    index % 2 === 1
                      ? { backgroundColor: "var(--app-surface-muted)" }
                      : undefined
                  }
                >
                  <td style={{ ...styles.td, padding: "10px 12px" }}>
                    <button
                      type="button"
                      onClick={() => handleViewLog(log)}
                      style={{
                        ...styles.button,
                        ...styles.infoButton,

                        border: "1px solid var(--app-border-strong)",
                        padding: "8px 12px",
                        fontSize: "0.84rem",
                        minWidth: "52px",
                      }}
                    >
                      Ver
                    </button>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {log.item_name ? `${log.item_name} (#${log.item_id})` : `#${log.item_id}`}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {log.user_name ? `${log.user_name} (#${log.user_id})` : `#${log.user_id}`}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ ...styles.badge, ...styles.infoBadge }}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {formatDateTime(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div style={styles.emptyState}>Nenhum log encontrado.</div>
          )}
        </div>

        {logs.length > 0 && (
          <div className="mobile-card-view" style={styles.mobileCards}>
            {logs.map((log) => (
              <article key={log.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h3 style={styles.mobileCardTitle}>
                      {log.item_name ? `${log.item_name} (#${log.item_id})` : `#${log.item_id}`}
                    </h3>
                    <p style={styles.mobileCardMeta}>{formatAction(log.action)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewLog(log)}
                    style={{
                      ...styles.button,
                      ...styles.secondaryButton,
                      ...styles.tableActionButton,
                    }}
                  >
                    Ver
                  </button>
                </div>

                <div style={styles.mobileCardGrid}>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Usuário</p>
                    <p style={styles.mobileCardValue}>
                      {log.user_name ? `${log.user_name} (#${log.user_id})` : `#${log.user_id}`}
                    </p>
                  </div>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Data/Hora</p>
                    <p style={styles.mobileCardValue}>{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailSection({ title, fields }) {
  return (
    <section
      style={{
        padding: "18px",
        borderRadius: "18px",
        border: "1px solid var(--app-border)",
        backgroundColor: "var(--app-surface-muted)",
      }}
    >
      <h3 style={{ ...styles.sectionTitle, marginBottom: "14px", fontSize: "1rem" }}>
        {title}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        {fields.map(([label, value]) => (
          <div key={`${title}-${label}`} style={styles.field}>
            <span style={styles.label}>{label}</span>
            <div
              style={{
                ...styles.input,
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {value || "-"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatAction(action) {
  const actionMap = {
    CREATE: "Criação",
    UPDATE: "Atualização",
    DELETE: "Inativação",
    RESTORE: "Restauração",
    MOVEMENT: "Movimentação",
  };

  return actionMap[action] || action || "-";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR");
}

export default Logs;
