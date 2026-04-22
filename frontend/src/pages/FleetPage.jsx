import { appShellStyles as styles } from "../components/appShellStyles";

function FleetPage({ title, description, onBack }) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{description}</p>

        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Submódulo em preparação</h2>
        <p style={styles.sectionText}>
          Esta página já faz parte da estrutura modular da frota e está pronta
          para receber cadastro, consulta, movimentação e regras específicas.
        </p>

        <div
          style={{
            padding: "18px",
            borderRadius: "18px",
            backgroundColor: "var(--app-surface-muted)",
            border: "1px solid var(--app-border)",
            color: "var(--app-text-muted)",
            lineHeight: 1.7,
          }}
        >
          A partir desta base, poderemos evoluir o módulo com permissão por
          perfil, filtros por unidade e submódulos adicionais sem precisar
          reestruturar a navegação novamente.
        </div>
      </section>
    </div>
  );
}

export default FleetPage;
