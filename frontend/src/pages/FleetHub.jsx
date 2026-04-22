import ModuleCard, { moduleCardGridStyle } from "../components/ModuleCard";
import { appShellStyles as styles } from "../components/appShellStyles";
import palette from "../constants/moduleCardPalette";

const fleetCategories = [
  {
    key: "frota/viaturas/modulo",
    label: "Cadastro de Viaturas",
    description: "Cadastre, consulte e movimente as viaturas operacionais.",
    icon: "car",
    color: palette.blue,
  },
  {
    key: "mapa-forca",
    label: "Mapa Força de Viaturas",
    description: "Acompanhe o espelho operacional da frota com resumos e filtros.",
    icon: "map",
    color: palette.green,
  },
  {
    key: "frota/controle-geral/modulo",
    label: "Controle Geral de Viaturas",
    description: "Consolide a frota em um painel operacional único.",
    icon: "panel",
    color: palette.purple,
  },
  {
    key: "frota/outros/modulo",
    label: "Outros",
    description: "Cadastre categorias complementares da frota.",
    icon: "config",
    color: palette.white,
  },
  {
    key: "frota/movimentacoes",
    label: "Movimentações",
    description: "Consulte o histórico de movimentações da frota.",
    icon: "swap",
    color: palette.orange,
  },
];

function FleetHub({ onNavigate, onBack }) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        {onBack ? (
          <div style={{ marginBottom: "14px" }}>
            <button
              type="button"
              onClick={onBack}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Voltar
            </button>
          </div>
        ) : null}

        <h1 style={styles.title}>Controle de Frota do 5BPRv</h1>
        <p style={styles.subtitle}>Selecione um módulo para acessar.</p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Categorias disponíveis</h2>
        <p style={styles.sectionText}>
          Escolha um submódulo para abrir os controles operacionais, cadastrais e executivos da frota.
        </p>

        <div style={moduleCardGridStyle}>
          {fleetCategories.map((category) => (
            <ModuleCard
              key={category.key}
              title={category.label}
              description={category.description}
              icon={category.icon}
              color={category.color}
              onClick={() => onNavigate(category.key)}
              minHeight="128px"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default FleetHub;
