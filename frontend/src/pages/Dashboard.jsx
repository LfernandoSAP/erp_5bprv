import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { getDashboardSummary } from "../services/dashboardService";

function Dashboard({ onOpenItems }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const topCategory = useMemo(() => {
    if (!data?.by_category?.length) {
      return null;
    }

    return [...data.by_category].sort((left, right) => right.count - left.count)[0];
  }, [data]);

  const topStatus = useMemo(() => {
    if (!data?.by_status?.length) {
      return null;
    }

    return [...data.by_status].sort((left, right) => right.count - left.count)[0];
  }, [data]);

  async function loadDashboard() {
    try {
      setError("");
      const result = await getDashboardSummary();
      setData(result);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError(err.message || "Erro ao carregar dashboard.");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <strong>Erro:</strong> {error}
        </div>
        <button
          onClick={loadDashboard}
          style={{ ...styles.button, ...styles.secondaryButton }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          Carregando painel e consolidando os indicadores principais...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          Visualize rapidamente os principais indicadores do sistema e acesse o
          módulo de materiais.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onOpenItems}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Ver materiais
          </button>
        </div>
      </section>

      <section style={styles.statsGrid}>
        <div style={{ ...styles.statCard, ...styles.statAccentCard }}>
          <p style={styles.statLabel}>Total de materiais</p>
          <p style={styles.statValue}>{data.total_items}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Materiais ativos</p>
          <p style={styles.statValue}>{data.active_items}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Materiais inativos</p>
          <p style={styles.statValue}>{data.inactive_items}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Categoria com mais registros</p>
          <p style={styles.statValue}>{topCategory?.category || "-"}</p>
          <p style={styles.helperText}>
            {topCategory ? `${topCategory.count} registro(s)` : "Sem dados consolidados"}
          </p>
        </div>
      </section>

      <section style={styles.statsGrid}>
        <section style={{ ...styles.card, ...styles.cardFill }}>
          <h2 style={styles.sectionTitle}>Materiais por categoria</h2>
          <p style={styles.sectionText}>
            Distribuicao atual das categorias cadastradas.
          </p>
          <div style={styles.listStack}>
            {data.by_category?.length ? (
              data.by_category.map((item, index) => (
                <div key={index} style={styles.listRow}>
                  <span style={styles.listRowLabel}>{item.category}</span>
                  <span style={{ ...styles.badge, ...styles.infoBadge }}>
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <div style={styles.emptyStateCard}>
                <p style={styles.emptyStateTitle}>Sem categorias consolidadas</p>
                <p style={styles.emptyStateText}>
                  Os totais por categoria aparecerao aqui quando houver materiais cadastrados.
                </p>
              </div>
            )}
          </div>
        </section>

        <section style={{ ...styles.card, ...styles.cardFill }}>
          <h2 style={styles.sectionTitle}>Materiais por status</h2>
          <p style={styles.sectionText}>
            Situação operacional dos materiais registrados.
          </p>
          <div style={{ ...styles.infoBox, marginBottom: "16px" }}>
            Status predominante:{" "}
            <strong>{topStatus ? formatItemStatus(topStatus.status) : "-"}</strong>
            {topStatus ? ` (${topStatus.count} registro(s))` : ""}
          </div>
          <div style={styles.listStack}>
            {data.by_status?.length ? (
              data.by_status.map((item, index) => (
                <div key={index} style={styles.listRow}>
                  <span style={styles.listRowLabel}>
                    {formatItemStatus(item.status)}
                  </span>
                  <span
                    style={{
                      ...styles.badge,
                      ...(item.status === "EM_USO"
                        ? styles.activeBadge
                        : item.status === "BAIXADO"
                          ? styles.inactiveBadge
                          : styles.neutralBadge),
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <div style={styles.emptyStateCard}>
                <p style={styles.emptyStateTitle}>Sem status consolidados</p>
                <p style={styles.emptyStateText}>
                  Assim que existirem registros no sistema, esta visão mostrará a distribuição operacional.
                </p>
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

export default Dashboard;

function formatItemStatus(status) {
  const statusMap = {
    EM_USO: "Em uso",
    EM_ESTOQUE: "Em estoque",
    MANUTENCAO: "Manutenção",
    BAIXADO: "Baixado",
  };

  return statusMap[status] || status || "-";
}
