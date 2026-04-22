import ModuleCard, { moduleCardGridStyle } from "../components/ModuleCard";
import { appShellStyles as styles } from "../components/appShellStyles";
import palette from "../constants/moduleCardPalette";

const stockCategories = [
  {
    key: "estoque/entradas",
    label: "Entrada de Mercadoria",
    description: "Registre entradas de materiais e atualize o estoque disponível.",
    icon: "arrowDown",
    color: palette.green,
  },
  {
    key: "estoque/saidas",
    label: "Saída de Mercadoria",
    description: "Controle saídas de materiais com baixa e conferência de saldo.",
    icon: "arrowUp",
    color: palette.orange,
  },
  {
    key: "estoque/produtos",
    label: "Produtos Cadastrados",
    description: "Consulte o catálogo de itens e parâmetros cadastrados no estoque.",
    icon: "box",
    color: palette.blue,
  },
  {
    key: "estoque/fornecedores",
    label: "Fornecedores",
    description: "Gerencie fornecedores vinculados às rotinas de suprimento.",
    icon: "person",
    color: palette.purple,
  },
  {
    key: "estoque/manutencao",
    label: "Ordens de Manutenção",
    description: "Acompanhe ordens abertas, status e histórico de manutenção.",
    icon: "tools",
    color: palette.yellow,
  },
  {
    key: "estoque/relatorio",
    label: "Relatório de Estoque",
    description: "Visualize indicadores, situação dos itens e estoque mínimo.",
    icon: "chart",
    color: palette.teal,
  },
];

function StockMaintenanceHub({ onNavigate, onBack }) {
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

        <h1 style={styles.title}>Controle de Estoque e Manutenção</h1>
        <p style={styles.subtitle}>Selecione um módulo para acessar.</p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Categorias disponíveis</h2>
        <p style={styles.sectionText}>
          O módulo reúne entradas, saídas, cadastros auxiliares, manutenção e relatórios do estoque operacional.
        </p>

        <div style={moduleCardGridStyle}>
          {stockCategories.map((category) => (
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

export default StockMaintenanceHub;
