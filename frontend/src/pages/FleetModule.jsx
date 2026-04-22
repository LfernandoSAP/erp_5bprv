import ModuleCard, { moduleCardGridStyle } from "../components/ModuleCard";
import { appShellStyles as styles } from "../components/appShellStyles";
import palette from "../constants/moduleCardPalette";

const actionCards = [
  {
    key: "insert",
    label: "Cadastrar",
    description: "Abra o formulário para inserir novos registros desta categoria.",
    icon: "form",
    color: palette.blue,
  },
  {
    key: "consult",
    label: "Consultar",
    description: "Liste os registros cadastrados para visualizar, editar ou movimentar.",
    icon: "doc",
    color: palette.green,
  },
  {
    key: "movements",
    label: "Movimentações",
    description: "Acompanhe o histórico operacional e os destinos desta categoria.",
    icon: "swap",
    color: palette.orange,
  },
];

function FleetModule({ categoryLabel, onBack, onInsert, onConsult, onMovements }) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={{ marginBottom: "14px" }}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar para frota
          </button>
        </div>

        <h1 style={styles.title}>{categoryLabel}</h1>
        <p style={styles.subtitle}>
          Use os cards abaixo para cadastrar, consultar ou acompanhar as movimentações do submódulo.
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Ações do submódulo</h2>
        <p style={styles.sectionText}>
          A partir deste ponto, o sistema direciona para cadastro, consulta ou histórico operacional da categoria selecionada.
        </p>

        <div style={moduleCardGridStyle}>
          {actionCards.map((card) => (
            <ModuleCard
              key={card.key}
              title={card.label}
              description={card.description}
              icon={card.icon}
              color={card.color}
              onClick={() => {
                if (card.key === "insert") onInsert();
                if (card.key === "consult") onConsult();
                if (card.key === "movements") onMovements();
              }}
              minHeight="128px"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default FleetModule;
