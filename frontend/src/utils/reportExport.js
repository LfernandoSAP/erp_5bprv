import { reportBranding } from "../config/reportBranding";

function slugify(value) {
  return String(value || "relatorio")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "relatorio";
}

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

function formatDateTimeLabel(date = new Date()) {
  return date.toLocaleString("pt-BR");
}

function normalizeCellValue(value) {
  if (value == null || value === "") {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

function resolveOrientation(columns, preferredOrientation) {
  if (preferredOrientation) {
    return preferredOrientation;
  }

  return columns.length > 6 ? "landscape" : "portrait";
}

async function loadImageAsDataUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Não foi possível preparar a imagem do relatório."));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => {
      reject(new Error("Não foi possível carregar a imagem do relatório."));
    };
    image.src = imageUrl;
  });
}

export async function exportExcelReport({
  fileBaseName,
  sheetName = "Relatório",
  title,
  subtitle,
  columns,
  rows,
}) {
  const XLSX = await import("xlsx");
  const worksheetRows = rows.map((row) =>
    columns.map((column) => normalizeCellValue(row[column.key]))
  );

  const worksheet = XLSX.utils.aoa_to_sheet([
    [title || "Relatório"],
    ...(subtitle ? [[subtitle]] : []),
    [],
    columns.map((column) => column.label),
    ...worksheetRows,
  ]);
  worksheet["!cols"] = columns.map((column) => ({
    wch: Math.max(column.label.length + 2, column.width || 16),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName.slice(0, 31) || "Relatório"
  );
  XLSX.writeFile(
    workbook,
    `${slugify(fileBaseName || title)}_${formatTimestamp()}.xlsx`
  );
}

export async function exportPdfReport({
  fileBaseName,
  title,
  subtitle,
  columns,
  rows,
  orientation,
  logoUrl = reportBranding.logoUrl,
  summaryItems = [],
  organizationName = reportBranding.organizationName,
  issuingLabel = reportBranding.issuingLabel,
  reviewLabel = reportBranding.reviewLabel,
}) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const generatedAt = formatDateTimeLabel();
  const doc = new jsPDF({
    orientation: resolveOrientation(columns, orientation),
    unit: "pt",
    format: "a4",
  });

  if (logoUrl) {
    try {
      const logoDataUrl = await loadImageAsDataUrl(logoUrl);
      doc.addImage(logoDataUrl, "PNG", 470, 20, 56, 56);
    } catch (error) {
      console.warn("Logo do relatório não carregado:", error);
    }
  }

  doc.setFontSize(16);
  doc.text(reportBranding.appTitle, 40, 34);
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(organizationName, 40, 48);

  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(title || "Relatório", 40, 68);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, 40, 84);
  }

  doc.setFontSize(9);
  doc.text(`Gerado em: ${generatedAt}`, 40, subtitle ? 98 : 84);
  doc.text(`Total de registros: ${rows.length}`, 220, subtitle ? 98 : 84);

  const executiveSummary = [
    `Colunas exportadas: ${columns.length}`,
    ...summaryItems.filter(Boolean),
  ];

  let tableStartY = subtitle ? 112 : 98;
  if (executiveSummary.length > 0) {
    const summaryTop = tableStartY;
    doc.setDrawColor(210, 219, 229);
    doc.setFillColor(248, 251, 252);
    doc.roundedRect(40, summaryTop, 515, 54, 10, 10, "FD");
    doc.setFontSize(10);
    doc.setTextColor(22, 50, 79);
    doc.text("Resumo executivo", 54, summaryTop + 16);
    doc.setFontSize(9);
    doc.setTextColor(70, 85, 100);
    executiveSummary.slice(0, 3).forEach((item, index) => {
      doc.text(`- ${item}`, 54, summaryTop + 32 + index * 12);
    });
    tableStartY += 68;
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) =>
      columns.map((column) => normalizeCellValue(row[column.key]))
    ),
    styles: {
      fontSize: 8,
      cellPadding: 5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [22, 50, 79],
    },
    alternateRowStyles: {
      fillColor: [244, 248, 251],
    },
    margin: {
      left: 28,
      right: 28,
      top: 28,
      bottom: 28,
    },
    didDrawPage(data) {
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.getWidth();
      const pageHeight = pageSize.getHeight();

      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(
        `${reportBranding.appTitle} | Página ${data.pageNumber}`,
        pageWidth - 120,
        pageHeight - 14
      );
    },
  });

  const finalY = doc.lastAutoTable?.finalY || tableStartY;
  const pageHeight = doc.internal.pageSize.getHeight();
  const signatureTop = finalY + 36;

  if (signatureTop + 44 > pageHeight - 20) {
    doc.addPage();
  }

  const signatureY = signatureTop + 44 > pageHeight - 20 ? 90 : signatureTop;

  doc.setDrawColor(140, 152, 164);
  doc.line(60, signatureY, 220, signatureY);
  doc.line(330, signatureY, 490, signatureY);
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(issuingLabel, 110, signatureY + 14);
  doc.text(reviewLabel, 388, signatureY + 14);

  doc.save(`${slugify(fileBaseName || title)}_${formatTimestamp()}.pdf`);
}
