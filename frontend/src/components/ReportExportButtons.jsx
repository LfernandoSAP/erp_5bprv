import { useEffect, useState } from "react";

import { appShellStyles as styles } from "./appShellStyles";

function ReportExportButtons({ onExportExcel, onExportPdf, disabled = false }) {
  const [loadingType, setLoadingType] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!status.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus({ type: "", message: "" });
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const handleExport = async (type, action) => {
    if (!action || disabled || loadingType) {
      return;
    }

    try {
      setLoadingType(type);
      setStatus({ type: "", message: "" });
      await action();
      setStatus({
        type: "success",
        message: type === "excel" ? "Excel gerado com sucesso." : "PDF gerado com sucesso.",
      });
    } catch (error) {
      console.error(`Erro ao exportar ${type}:`, error);
      setStatus({
        type: "error",
        message:
          error?.message ||
          `Não foi possível gerar o ${type === "excel" ? "Excel" : "PDF"}.`,
      });
    } finally {
      setLoadingType("");
    }
  };

  return (
    <div style={styles.tableHeaderActions}>
      <button
        type="button"
        onClick={() => handleExport("excel", onExportExcel)}
        disabled={disabled || Boolean(loadingType)}
        style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}
      >
        {loadingType === "excel" ? "Gerando Excel..." : "Exportar Excel"}
      </button>
      <button
        type="button"
        onClick={() => handleExport("pdf", onExportPdf)}
        disabled={disabled || Boolean(loadingType)}
        style={{ ...styles.button, ...styles.primaryButton, ...styles.tableActionButton }}
      >
        {loadingType === "pdf" ? "Gerando PDF..." : "Exportar PDF"}
      </button>
      {status.message ? (
        <div
          style={{
            ...styles.inlineStatus,
            ...(status.type === "success"
              ? styles.inlineStatusSuccess
              : status.type === "error"
                ? styles.inlineStatusError
                : {}),
          }}
        >
          {status.message}
        </div>
      ) : null}
    </div>
  );
}

export default ReportExportButtons;
