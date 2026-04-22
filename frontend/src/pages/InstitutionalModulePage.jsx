import { appShellStyles as styles } from "../components/appShellStyles";

function InstitutionalModulePage({ title, description, onBack, highlights = [] }) {
  const infoListStyle = {
    display: "grid",
    gap: "12px",
  };

  const infoCardStyle = {
    padding: "16px 18px",
    borderRadius: "16px",
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface-muted)",
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>
          {description ||
            "Este módulo institucional já está reservado na nova arquitetura do ERP e será evoluído em etapas futuras."}
        </p>

        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Módulo reservado</h2>
        <p style={styles.sectionText}>
          A estrutura institucional da navegação já foi ajustada para refletir a
          organização real da unidade. Este espaço fica pronto para receber as
          telas específicas do setor no momento da implementação.
        </p>
      </section>

      {highlights.length > 0 ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Próximos desdobramentos</h2>
          <div style={infoListStyle}>
            {highlights.map((highlight) => (
              <div key={highlight} style={infoCardStyle}>
                <p style={styles.sectionText}>{highlight}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default InstitutionalModulePage;
