import ModuleCard, { moduleCardGridStyle } from "../components/ModuleCard";
import { appShellStyles as styles } from "../components/appShellStyles";
import palette from "../constants/moduleCardPalette";

const actionCards = [
  {
    key: "insert",
    label: "Novo material",
    description: "Abra o formulário para inserir um novo registro da categoria.",
    icon: "form",
    color: palette.blue,
  },
  {
    key: "consult",
    label: "Consultar materiais",
    description: "Liste materiais cadastrados para editar, movimentar e acompanhar vínculos.",
    icon: "doc",
    color: palette.green,
  },
];

function MaterialBelicoModule({ categoryLabel, onBack, onInsert, onConsult }) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={{ marginBottom: "14px" }}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar ao material bélico
          </button>
        </div>

        <h1 style={styles.title}>{categoryLabel}</h1>
        <p style={styles.subtitle}>
          Use os cards abaixo para inserir novos registros ou consultar os dados já cadastrados.
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Ações do submódulo</h2>
        <p style={styles.sectionText}>
          A partir deste ponto, o sistema direciona para o cadastro ou para a consulta dos registros da categoria selecionada.
        </p>

        <div style={moduleCardGridStyle}>
          {actionCards.map((card) => (
            <ModuleCard
              key={card.key}
              title={card.label}
              description={card.description}
              icon={card.icon}
              color={card.color}
              onClick={() => (card.key === "insert" ? onInsert() : onConsult())}
              minHeight="128px"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default MaterialBelicoModule;
