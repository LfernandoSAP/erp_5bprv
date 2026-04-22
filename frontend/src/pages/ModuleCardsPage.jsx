import ModuleCard, { moduleCardGridStyle } from "../components/ModuleCard";
import { appShellStyles as styles } from "../components/appShellStyles";

function ModuleCardsPage({
  title,
  subtitle = "Selecione um módulo para acessar.",
  cards,
  onNavigate,
  onBack,
  breadcrumb,
}) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        {breadcrumb ? (
          <p
            style={{
              ...styles.helperText,
              margin: "0 0 14px",
              fontSize: "0.86rem",
              letterSpacing: "0.01em",
            }}
          >
            {breadcrumb}
          </p>
        ) : null}

        {onBack ? (
          <div style={{ marginBottom: "16px" }}>
            <button
              type="button"
              onClick={onBack}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              ← Voltar
            </button>
          </div>
        ) : null}

        <h1 style={{ ...styles.title, marginBottom: "12px" }}>{title}</h1>
        <p style={styles.subtitle}>{subtitle}</p>
      </section>

      <section style={styles.card}>
        <div style={moduleCardGridStyle}>
          {cards.map((card) => (
            <ModuleCard
              key={card.key}
              title={card.label}
              description={card.description}
              icon={card.icon}
              color={card.color}
              onClick={() => onNavigate(card.key)}
              minHeight="128px"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ModuleCardsPage;
