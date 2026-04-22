import { appShellStyles as styles } from "../components/appShellStyles";

function HomePage({ displayName }) {
  return (
    <div style={styles.page}>
      <section
        style={{
          ...styles.hero,
          minHeight: "min(74vh, 680px)",
          display: "grid",
          alignItems: "center",
          overflow: "hidden",
          position: "relative",
          padding: "clamp(22px, 4vw, 40px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(56,189,248,0.18), transparent 34%), radial-gradient(circle at bottom left, rgba(34,197,94,0.14), transparent 30%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "clamp(24px, 4vw, 48px)",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "18px",
              alignContent: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "var(--app-primary)",
                fontSize: "0.9rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              ERP 5BPRv
            </p>

            <h1
              style={{
                ...styles.title,
                margin: 0,
                fontSize: "clamp(2.1rem, 5vw, 3.2rem)",
                lineHeight: 1.02,
                maxWidth: "12ch",
              }}
            >
              Olá, {displayName || "usuário"}
            </h1>

            <p
              style={{
                ...styles.subtitle,
                fontSize: "1.05rem",
                lineHeight: 1.7,
                maxWidth: "56ch",
              }}
            >
              Selecione um módulo no menu lateral para começar e acessar os
              fluxos operacionais, administrativos e institucionais do 5BPRv.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "6px",
              }}
            >
              <span
                style={{
                  ...styles.badge,
                  ...styles.infoBadge,
                  padding: "8px 12px",
                }}
              >
                Ambiente institucional
              </span>
              <span
                style={{
                  ...styles.badge,
                  ...styles.neutralBadge,
                  padding: "8px 12px",
                }}
              >
                Navegação por módulos
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              justifyItems: "center",
            }}
          >
            <div
              style={{
                width: "min(100%, 520px)",
                borderRadius: "28px",
                padding: "clamp(18px, 3vw, 28px)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                border: "1px solid var(--app-border-strong)",
                boxShadow: "var(--app-shadow)",
                backdropFilter: "blur(6px)",
              }}
            >
              <img
                src="/images/css/asa_rodoviaria.png"
                alt="Asa Rodoviária"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 18px 30px rgba(2, 6, 23, 0.28))",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
