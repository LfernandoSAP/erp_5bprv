import ModuleCard, { moduleCardGridStyle } from "../components/ModuleCard";
import { appShellStyles as styles } from "../components/appShellStyles";
import palette from "../constants/moduleCardPalette";

const categories = [
  { key: "belico-coletes", label: "Coletes", icon: "shield", color: palette.blue, description: "Gerencie os registros operacionais e cautelas de coletes." },
  { key: "belico-espargidores", label: "Espargidores", icon: "spray", color: palette.green, description: "Cadastre e acompanhe espargidores da unidade." },
  { key: "belico-armas", label: "Armas", icon: "target", color: palette.red, description: "Controle armamentos, vínculos e situação atual." },
  { key: "belico-algemas", label: "Algemas", icon: "lock", color: palette.white, description: "Centralize consulta e movimentação de algemas." },
  { key: "belico-municoes", label: "Munições", icon: "circle", color: palette.yellow, description: "Acompanhe entradas, saldos e distribuição de munições." },
  { key: "belico-municoes-quimicas", label: "Munições Químicas", icon: "flask", color: palette.purple, description: "Organize o controle específico de munições químicas." },
  { key: "belico-tonfa", label: "Tonfa/Cassetetes", icon: "baton", color: palette.orange, description: "Registre itens de impacto e seus responsáveis." },
  { key: "belico-taser", label: "TASER", icon: "lightning", color: palette.amber, description: "Controle equipamentos TASER e histórico operacional." },
  { key: "belico-cdc", label: "Material CDC", icon: "box", color: palette.teal, description: "Acesse o material de CDC em um fluxo dedicado." },
  { key: "belico-controle-geral", label: "Controle 5BPRv", icon: "list", color: palette.cyan, description: "Consolide o controle geral do material bélico do 5º BPRv." },
  { key: "belico-movimentacoes", label: "Movimentações", icon: "swap", color: palette.pink, description: "Consulte o histórico de movimentações do material bélico." },
];

function MaterialBelico({ onNavigate, onBack }) {
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
              ← Voltar
            </button>
          </div>
        ) : null}

        <h1 style={styles.title}>Controle de Material Bélico do 5BPRv</h1>
        <p style={styles.subtitle}>
          Selecione uma categoria para acessar o submódulo de cadastro e consulta.
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Categorias disponíveis</h2>
        <p style={styles.sectionText}>
          Escolha um submódulo para abrir as ações de inserção, consulta e controle da categoria.
        </p>

        <div style={moduleCardGridStyle}>
          {categories.map((category) => (
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

export default MaterialBelico;
