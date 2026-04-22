import ModuleCard, { moduleCardGridStyle } from "../components/ModuleCard";
import { appShellStyles as styles } from "../components/appShellStyles";
import palette from "../constants/moduleCardPalette";

const actionCards = [
  {
    key: "insert",
    label: "Cadastrar",
    description: "Abra o fluxo de cadastro e emissão inicial deste processo.",
    icon: "form",
    color: palette.blue,
  },
  {
    key: "consult",
    label: "Consultar",
    description: "Acesse a listagem para acompanhar, revisar ou atualizar registros.",
    icon: "doc",
    color: palette.green,
  },
];

function WeaponProcessModule({ categoryLabel, onBack, onInsert, onConsult }) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={{ marginBottom: "14px" }}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar para Processos de Armas
          </button>
        </div>

        <h1 style={styles.title}>{categoryLabel}</h1>
        <p style={styles.subtitle}>
          Use os cards abaixo para cadastrar ou consultar os processos deste submódulo.
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Ações do submódulo</h2>
        <p style={styles.sectionText}>
          O fluxo deste processo segue o padrão visual do P4 e mantém cadastro e consulta centralizados.
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

export default WeaponProcessModule;
