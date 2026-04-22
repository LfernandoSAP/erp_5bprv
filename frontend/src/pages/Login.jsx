import { useState } from "react";
import { Button, TextField, Typography } from "@mui/material";

import { appShellStyles as styles } from "../components/appShellStyles";
import { loginUser } from "../services/authService";
import { getCpfInputProps, maskCpf } from "./policeOfficerRegistrationUtils";

const CORNER_BADGE = "/images/css/bolachao_rodoviaria.png";
const TOP_RIGHT_LOGO = "/images/css/logo_5rv.png";
const CENTER_WING = "/images/css/asa_rodoviaria.png";

function Login({ onLoginSuccess }) {
  const cpfInputProps = getCpfInputProps();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "var(--app-surface-muted)",
      color: "var(--app-text)",
      "& fieldset": {
        borderColor: "var(--app-border-strong)",
      },
      "&:hover fieldset": {
        borderColor: "var(--app-primary)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "var(--app-primary)",
      },
    },
    "& .MuiInputLabel-root": {
      color: "var(--app-text-muted)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "var(--app-primary)",
    },
  };

  const isValidCPF = (value) => {
    const digits = value.replace(/\D/g, "");
    return /^\d{11}$/.test(digits);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!isValidCPF(cpf)) {
      setError("CPF inválido. Digite um CPF com 11 dígitos.");
      return;
    }

    try {
      const data = await loginUser(cpf, password);
      onLoginSuccess(data.session);
    } catch (loginError) {
      console.error("Login error:", loginError);
      setError(loginError.message || "Erro ao realizar login.");
    }
  };

  return (
    <div
      style={{
        ...styles.authPage,
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(45, 212, 191, 0.1), transparent 30%), linear-gradient(180deg, #08111d 0%, #0d1726 45%, #0a1220 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255, 214, 10, 0.03), transparent 24%), radial-gradient(circle at center, rgba(255, 215, 0, 0.05), transparent 38%)",
          pointerEvents: "none",
        }}
      />

      <img
        src={CORNER_BADGE}
        alt="Bolachão do Policiamento Rodoviário"
        style={{
          position: "absolute",
          top: "22px",
          left: "24px",
          width: "clamp(68px, 7vw, 112px)",
          zIndex: 1,
          filter: "drop-shadow(0 12px 26px rgba(2, 6, 23, 0.45))",
        }}
      />

      <img
        src={TOP_RIGHT_LOGO}
        alt="Logo do 5º Batalhão Rodoviário"
        style={{
          position: "absolute",
          top: "18px",
          right: "24px",
          width: "clamp(80px, 8vw, 132px)",
          zIndex: 1,
          filter: "drop-shadow(0 12px 26px rgba(2, 6, 23, 0.45))",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "920px",
          display: "grid",
          justifyItems: "center",
          alignContent: "center",
          gap: "12px",
          padding: "clamp(18px, 3vw, 28px) 16px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "grid",
            justifyItems: "center",
          }}
        >
          <img
            src={CENTER_WING}
            alt="Brasão central do Policiamento Rodoviário"
            style={{
              width: "min(100%, 560px)",
              maxWidth: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 20px 34px rgba(2, 6, 23, 0.42))",
              marginBottom: "-32px",
              position: "relative",
              zIndex: 1,
              transform: "translateY(-6px)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "grid",
            justifyItems: "center",
            alignItems: "center",
            gap: "2px",
            textAlign: "center",
            width: "100%",
            maxWidth: "820px",
            marginTop: "14px",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: "#f7e55a",
              fontWeight: 800,
              lineHeight: 1.02,
              textAlign: "center",
              textShadow: "0 4px 18px rgba(0, 0, 0, 0.38)",
              fontSize: {
                xs: "1.8rem",
                sm: "2.2rem",
                md: "2.55rem",
              },
            }}
          >
            ERP - 5BPRv
          </Typography>

          <Typography
            variant="h3"
            sx={{
              color: "#f5e85d",
              fontWeight: 800,
              lineHeight: 1.02,
              textShadow: "0 4px 18px rgba(0, 0, 0, 0.38)",
              whiteSpace: "nowrap",
              fontSize: {
                xs: "1.15rem",
                sm: "1.8rem",
                md: "2.45rem",
              },
            }}
          >
            Software de Gestão Integrada
          </Typography>

          <Typography
            sx={{
              color: "#e5d95a",
              fontWeight: 600,
              maxWidth: "720px",
              textAlign: "center",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
              fontSize: {
                xs: "0.82rem",
                sm: "0.92rem",
              },
            }}
          >
            Entre com seu CPF e senha para acessar o ambiente administrativo.
          </Typography>
        </div>

        <div
          style={{
            ...styles.authCard,
            maxWidth: "360px",
            width: "min(100%, 360px)",
            justifySelf: "center",
            background:
              "linear-gradient(180deg, rgba(16, 33, 51, 0.92) 0%, rgba(15, 31, 48, 0.96) 100%)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(95, 120, 144, 0.28)",
            boxShadow: "0 28px 72px rgba(2, 6, 23, 0.46)",
            padding: "clamp(18px, 3vw, 24px)",
            marginTop: "2px",
          }}
        >
          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin}>
            <TextField
              label="CPF"
              fullWidth
              margin="normal"
              value={cpf}
              onChange={(event) => setCpf(maskCpf(event.target.value))}
              placeholder={cpfInputProps.placeholder}
              inputProps={{
                inputMode: cpfInputProps.inputMode,
                maxLength: cpfInputProps.maxLength,
              }}
              sx={textFieldSx}
            />

            <TextField
              label="Senha"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              sx={textFieldSx}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2.5,
                py: 1.2,
                borderRadius: "999px",
                backgroundColor: "var(--app-primary)",
                color: "var(--app-primary-contrast)",
                fontWeight: 800,
                letterSpacing: "0.05em",
                boxShadow: "0 12px 28px rgba(45, 212, 191, 0.2)",
                "&:hover": {
                  backgroundColor: "var(--app-primary-strong)",
                },
              }}
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
