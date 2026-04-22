import { appShellStyles as styles } from "../components/appShellStyles";

function MaterialBelicoControleGeral({ onInsert, onConsult, onBack }) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Controle de Material Bélico 5BPRv</h1>
        <p style={styles.subtitle}>
          Acesse o controle geral para inserir novos registros ou consultar os
          dados consolidados.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onInsert}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Novo registro
          </button>
          <button
            onClick={onConsult}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Consultar registros
          </button>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar ao material bélico
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Controle consolidado</h2>
        <p style={styles.sectionText}>
          Use este módulo quando precisar trabalhar com a visão geral do
          controle de material bélico do 5BPRv.
        </p>
      </section>
    </div>
  );
}

export default MaterialBelicoControleGeral;
