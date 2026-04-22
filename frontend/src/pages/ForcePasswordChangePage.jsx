import { useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { changePassword, logoutUser } from "../services/authService";

function ForcePasswordChangePage({ session, onPasswordChanged, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos para continuar.");
      return;
    }

    if (newPassword.length < 8) {
      setError("A nova senha deve conter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação da nova senha não confere.");
      return;
    }

    try {
      setSaving(true);
      const updatedSession = await changePassword(currentPassword, newPassword);
      onPasswordChanged(updatedSession);
    } catch (submitError) {
      setError(submitError.message || "Não foi possível atualizar a senha.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // noop
    } finally {
      onLogout();
    }
  }

  return (
    <div style={styles.authPage}>
      <div style={{ ...styles.authCard, maxWidth: "520px" }}>
        <h1 style={{ ...styles.title, marginBottom: "10px", fontSize: "1.8rem" }}>
          Troca obrigatória de senha
        </h1>
        <p style={{ ...styles.sectionText, marginBottom: "18px" }}>
          {session?.displayName || session?.name || "Usuário"}, por segurança você precisa
          definir uma nova senha antes de acessar o ERP.
        </p>

        <div style={{ ...styles.infoBox, marginBottom: "20px" }}>
          Use uma senha forte, com pelo menos 8 caracteres, e não reutilize a senha
          inicial.
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Senha atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                style={styles.input}
                autoComplete="current-password"
              />
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                style={styles.input}
                autoComplete="new-password"
              />
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={styles.input}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div style={styles.footerActions}>
            <button
              type="button"
              onClick={handleLogout}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Sair
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              {saving ? "Atualizando..." : "Atualizar senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForcePasswordChangePage;
