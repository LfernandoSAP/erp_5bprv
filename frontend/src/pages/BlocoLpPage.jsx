import { useEffect, useMemo, useState } from "react";

import ReportExportButtons from "../components/ReportExportButtons";
import { appShellStyles as styles } from "../components/appShellStyles";
import { getPoliceOfficers } from "../services/policeOfficerService";
import {
  createLpRegistro,
  deleteLpRegistro,
  getLpRegistroById,
  getLpRegistros,
  updateLpRegistro,
} from "../services/lpService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

const SUMMARY_COLUMNS = [
  { key: "re_dc", label: "RE", width: 14 },
  { key: "nome", label: "NOME", width: 28 },
  { key: "quadro", label: "QUADRO", width: 12 },
  { key: "total_blocos", label: "Nº BLOCOS", width: 12 },
  { key: "ultimo_bol_g", label: "ÚLTIMO BOL G", width: 16 },
  { key: "ultimo_inicio", label: "ÚLTIMO INÍCIO", width: 16 },
  { key: "status", label: "STATUS", width: 10 },
];

const TIPO_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "fruicao", label: "Fruição" },
  { value: "pecunia", label: "Conversão em Pecúnia" },
];

function createEmptyBlock(id) {
  return {
    id,
    numero_bloco: id,
    bol_g_pm_concessao: "",
    tipo_bloco: "",
    dias: "30",
    inicio_gozo: "",
    boletim_interno: "",
    mes_conversao: "",
    pecunia_bol_g: "",
  };
}

function normalizeBlock(bloco, index) {
  return {
    id: bloco.id || index + 1,
    numero_bloco: index + 1,
    bol_g_pm_concessao: bloco.bol_g_pm_concessao || "",
    tipo_bloco: bloco.tipo_bloco || "",
    dias: String(bloco.dias ?? "30"),
    inicio_gozo: bloco.inicio_gozo || "",
    boletim_interno: bloco.boletim_interno || "",
    mes_conversao: bloco.mes_conversao || "",
    pecunia_bol_g: bloco.pecunia_bol_g || "",
  };
}

function formatDateInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayCellValue(value) {
  return value ? String(value) : "**";
}

function getTipoLabel(value) {
  return value === "pecunia" ? "Conversão em Pecúnia" : "Fruição";
}

function BlockTable({ bloco }) {
  const isPecunia = bloco.tipo_bloco === "pecunia";

  return (
    <table style={{ ...styles.table, minWidth: isPecunia ? "680px" : "760px" }}>
      <thead>
        <tr>
          {isPecunia ? (
            <>
              <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Bol G PM Concessão</th>
              <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Mês de Conversão</th>
              <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Pecúnia Bol G PM</th>
            </>
          ) : (
            <>
              <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Bol G PM Concessão</th>
              <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Dias</th>
              <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Início do Gozo</th>
              <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Boletim Interno</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ ...styles.td, backgroundColor: "#dc2626", color: "#fff", fontWeight: 800 }}>
            {bloco.bol_g_pm_concessao}
          </td>
          {isPecunia ? (
            <>
              <td style={styles.td}>{displayCellValue(bloco.mes_conversao)}</td>
              <td style={styles.td}>{displayCellValue(bloco.pecunia_bol_g)}</td>
            </>
          ) : (
            <>
              <td style={styles.td}>{displayCellValue(bloco.dias)}</td>
              <td style={styles.td}>{displayCellValue(bloco.inicio_gozo)}</td>
              <td style={styles.td}>{displayCellValue(bloco.boletim_interno)}</td>
            </>
          )}
        </tr>
      </tbody>
    </table>
  );
}

export default function BlocoLpPage({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [officerSearch, setOfficerSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingOfficer, setSearchingOfficer] = useState(false);
  const [blocos, setBlocos] = useState([createEmptyBlock(1)]);

  useEffect(() => {
    void loadItems();
  }, []);

  const visibleItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => `${item.re_dc} ${item.nome}`.toLowerCase().includes(term));
  }, [items, searchTerm]);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const data = await getLpRegistros();
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setItems([]);
      setError(loadError.message || "Erro ao carregar os blocos LP.");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setMode("list");
    setEditingId(null);
    setSelectedOfficer(null);
    setSelectedRegistro(null);
    setOfficerSearch("");
    setSearchResults([]);
    setBlocos([createEmptyBlock(1)]);
  }

  async function handleSearchOfficer() {
    const term = officerSearch.trim();
    if (term.length < 2) {
      setError("Digite pelo menos 2 caracteres para buscar.");
      setSearchResults([]);
      return;
    }
    try {
      setSearchingOfficer(true);
      setError("");
      const officers = await getPoliceOfficers(term, null, { includeInactive: true });
      if (Array.isArray(officers) && officers.length > 0) {
        setSearchResults(officers.slice(0, 20));
      } else {
        setSearchResults([]);
        setError("Nenhum policial encontrado.");
      }
    } catch (fetchError) {
      setSearchResults([]);
      setError(fetchError.message || "Erro ao buscar policial.");
    } finally {
      setSearchingOfficer(false);
    }
  }

  function handleSelectOfficer(officer) {
    setSelectedOfficer({
      id: officer.id,
      re_dc: officer.re_with_digit,
      nome: officer.full_name,
      posto_graduacao: officer.rank || "-",
      unidade: officer.unit_label || "-",
    });
    setOfficerSearch("");
    setSearchResults([]);
    setMode("create-form");
  }

  function addBlock() {
    setBlocos((current) => [...current, createEmptyBlock(current.length + 1)]);
  }

  function removeBlock(index) {
    setBlocos((current) =>
      current
        .filter((_, blocoIndex) => blocoIndex !== index)
        .map((bloco, blocoIndex) => ({ ...bloco, id: blocoIndex + 1, numero_bloco: blocoIndex + 1 }))
    );
  }

  function updateBlock(index, field, value) {
    setBlocos((current) =>
      current.map((bloco, blocoIndex) => {
        if (blocoIndex !== index) return bloco;
        const nextBlock = { ...bloco, [field]: field === "inicio_gozo" ? formatDateInput(value) : value };
        if (field === "tipo_bloco") {
          nextBlock.dias = "30";
          nextBlock.inicio_gozo = "";
          nextBlock.boletim_interno = "";
          nextBlock.mes_conversao = "";
          nextBlock.pecunia_bol_g = "";
        }
        return nextBlock;
      })
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!selectedOfficer) {
      setError("Selecione um policial antes de continuar.");
      return;
    }
    if (blocos.some((bloco) => !bloco.bol_g_pm_concessao.trim() || !bloco.tipo_bloco)) {
      setError("Preencha o Bol G PM Concessão e o Tipo em todos os blocos.");
      return;
    }

    try {
      const payload = {
        police_officer_id: selectedOfficer.id,
        re_dc: selectedOfficer.re_dc,
        nome: selectedOfficer.nome,
        posto_graduacao: selectedOfficer.posto_graduacao,
        unidade: selectedOfficer.unidade,
        blocos: blocos.map((bloco, index) => ({
          numero_bloco: index + 1,
          bol_g_pm_concessao: bloco.bol_g_pm_concessao,
          tipo_bloco: bloco.tipo_bloco,
          dias: bloco.tipo_bloco === "fruicao" ? Number(bloco.dias || 30) : 30,
          inicio_gozo: bloco.tipo_bloco === "fruicao" ? bloco.inicio_gozo || null : null,
          boletim_interno: bloco.tipo_bloco === "fruicao" ? bloco.boletim_interno || null : null,
          mes_conversao: bloco.tipo_bloco === "pecunia" ? bloco.mes_conversao || null : null,
          pecunia_bol_g: bloco.tipo_bloco === "pecunia" ? bloco.pecunia_bol_g || null : null,
        })),
      };

      if (editingId) {
        await updateLpRegistro(editingId, { blocos: payload.blocos });
        setSuccess("Bloco LP atualizado com sucesso.");
      } else {
        await createLpRegistro(payload);
        setSuccess("Bloco LP cadastrado com sucesso.");
      }
      resetFlow();
      await loadItems();
    } catch (saveError) {
      setError(saveError.message || "Erro ao salvar o bloco LP.");
    }
  }

  async function handleView(item) {
    try {
      setSelectedRegistro(await getLpRegistroById(item.id));
      setMode("view");
    } catch (detailError) {
      setError(detailError.message || "Erro ao carregar o bloco LP.");
    }
  }

  async function handleEdit(item) {
    try {
      const details = await getLpRegistroById(item.id);
      setEditingId(details.id);
      setSelectedOfficer({
        id: details.police_officer_id,
        re_dc: details.re_dc,
        nome: details.nome,
        posto_graduacao: details.posto_graduacao || "-",
        unidade: details.unidade || "-",
      });
      setOfficerSearch(details.re_dc);
      setBlocos(details.blocos.length ? details.blocos.map((bloco, index) => normalizeBlock(bloco, index)) : [createEmptyBlock(1)]);
      setMode("create-form");
    } catch (editError) {
      setError(editError.message || "Erro ao editar o bloco LP.");
    }
  }

  async function handleDelete(item) {
    try {
      await deleteLpRegistro(item.id);
      setSuccess("Registro do bloco LP excluído.");
      await loadItems();
      if (selectedRegistro?.id === item.id) {
        setSelectedRegistro(null);
        setMode("list");
      }
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao excluir o bloco LP.");
    }
  }

  function exportRegistroExcel(registro) {
    const rows = registro.blocos.map((bloco) =>
      bloco.tipo_bloco === "pecunia"
        ? { bloco: `${bloco.numero_bloco}º`, tipo: getTipoLabel(bloco.tipo_bloco), bol_g_pm_concessao: bloco.bol_g_pm_concessao, mes_conversao: displayCellValue(bloco.mes_conversao), pecunia_bol_g: displayCellValue(bloco.pecunia_bol_g) }
        : { bloco: `${bloco.numero_bloco}º`, tipo: getTipoLabel(bloco.tipo_bloco), bol_g_pm_concessao: bloco.bol_g_pm_concessao, dias: displayCellValue(bloco.dias), inicio_gozo: displayCellValue(bloco.inicio_gozo), boletim_interno: displayCellValue(bloco.boletim_interno) }
    );

    exportExcelReport({
      fileBaseName: `bloco_lp_${registro.re_dc}`,
      sheetName: "Bloco LP",
      title: "Controle de Fruição de Blocos de Licença Prêmio",
      subtitle: `${registro.nome} · ${registro.re_dc}`,
      columns: [
        { key: "bloco", label: "Bloco", width: 10 },
        { key: "tipo", label: "Tipo", width: 18 },
        { key: "bol_g_pm_concessao", label: "Bol G PM Concessão", width: 20 },
        { key: "dias", label: "Dias", width: 10 },
        { key: "inicio_gozo", label: "Início do Gozo", width: 16 },
        { key: "boletim_interno", label: "Boletim Interno", width: 24 },
        { key: "mes_conversao", label: "Mês de Conversão", width: 18 },
        { key: "pecunia_bol_g", label: "Pecúnia Bol G PM", width: 18 },
      ],
      rows,
    });
  }

  function exportRegistroPdf(registro) {
    const rows = registro.blocos.map((bloco) =>
      bloco.tipo_bloco === "pecunia"
        ? { bloco: `${bloco.numero_bloco}º`, tipo: getTipoLabel(bloco.tipo_bloco), bol_g_pm_concessao: bloco.bol_g_pm_concessao, dias: "-", inicio_gozo: "-", boletim_interno: "-", mes_conversao: displayCellValue(bloco.mes_conversao), pecunia_bol_g: displayCellValue(bloco.pecunia_bol_g) }
        : { bloco: `${bloco.numero_bloco}º`, tipo: getTipoLabel(bloco.tipo_bloco), bol_g_pm_concessao: bloco.bol_g_pm_concessao, dias: displayCellValue(bloco.dias), inicio_gozo: displayCellValue(bloco.inicio_gozo), boletim_interno: displayCellValue(bloco.boletim_interno), mes_conversao: "-", pecunia_bol_g: "-" }
    );

    exportPdfReport({
      fileBaseName: `bloco_lp_${registro.re_dc}`,
      title: "Controle de Fruição de Blocos de Licença Prêmio",
      subtitle: `${registro.nome} · ${registro.re_dc}`,
      columns: [
        { key: "bloco", label: "Bloco" },
        { key: "tipo", label: "Tipo" },
        { key: "bol_g_pm_concessao", label: "Bol G PM Concessão" },
        { key: "dias", label: "Dias" },
        { key: "inicio_gozo", label: "Início do Gozo" },
        { key: "boletim_interno", label: "Boletim Interno" },
        { key: "mes_conversao", label: "Mês de Conversão" },
        { key: "pecunia_bol_g", label: "Pecúnia Bol G PM" },
      ],
      rows,
      orientation: "landscape",
    });
  }

  function printRegistro(registro) {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    const sections = registro.blocos
      .map(
        (bloco) =>
          `<div style="margin-top:18px"><h2 style="font-size:16px">${bloco.numero_bloco}º Bloco - ${getTipoLabel(bloco.tipo_bloco)}</h2><table style="width:100%;border-collapse:collapse"><thead><tr>${bloco.tipo_bloco === "pecunia" ? "<th>Bol G PM Concessão</th><th>Mês de Conversão</th><th>Pecúnia Bol G PM</th>" : "<th>Bol G PM Concessão</th><th>Dias</th><th>Início do Gozo</th><th>Boletim Interno</th>"}</tr></thead><tbody><tr><td class="bol">${bloco.bol_g_pm_concessao}</td>${bloco.tipo_bloco === "pecunia" ? `<td>${displayCellValue(bloco.mes_conversao)}</td><td>${displayCellValue(bloco.pecunia_bol_g)}</td>` : `<td>${displayCellValue(bloco.dias)}</td><td>${displayCellValue(bloco.inicio_gozo)}</td><td>${displayCellValue(bloco.boletim_interno)}</td>`}</tr></tbody></table></div>`
      )
      .join("");

    printWindow.document.write(
      `<html><head><title>Bloco LP</title><style>body{font-family:Arial,sans-serif;padding:24px}h1{text-align:center;font-size:20px}th,td{border:1px solid #111;padding:8px;text-align:center}th{background:#fde047}.bol{background:#dc2626;color:#fff;font-weight:bold}</style></head><body><h1>CONTROLE DE FRUIÇÃO DE BLOCOS DE LICENÇA PRÊMIO</h1><p><strong>Nome:</strong> ${registro.nome} | <strong>RE:</strong> ${registro.re_dc} | <strong>Posto/Grad.:</strong> ${registro.posto_graduacao || "-"} | <strong>Unidade:</strong> ${registro.unidade || "-"}</p>${sections}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Controle de Fruição de Blocos de Licença Prêmio</h1>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
          <button onClick={() => { setError(""); setSuccess(""); setMode("create-search"); setEditingId(null); setSelectedOfficer(null); setBlocos([createEmptyBlock(1)]); }} style={{ ...styles.button, ...styles.primaryButton }}>+ Criar Bloco LP</button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {mode === "create-search" && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Pesquisar Policial</h2>
          <div style={styles.actions}>
            <input
              value={officerSearch}
              onChange={(event) => {
                setSelectedOfficer(null);
                setOfficerSearch(event.target.value);
                setSearchResults([]);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearchOfficer();
                }
              }}
              placeholder="Digite parte do RE ou nome"
              style={{ ...styles.input, ...styles.actionFieldWide }}
            />
            <button type="button" onClick={() => void handleSearchOfficer()} style={{ ...styles.button, ...styles.primaryButton }}>
              Pesquisar
            </button>
          </div>
          {searchingOfficer ? <div style={{ ...styles.emptyState, marginTop: "16px" }}>Buscando policiais...</div> : null}
          {searchResults.length > 0 && (
            <div style={{ ...styles.tableWrap, overflowX: "auto", marginTop: "16px" }}>
              <table style={{ ...styles.table, minWidth: "880px" }}>
                <thead>
                  <tr>
                    <th style={styles.th}>RE-DC</th>
                    <th style={styles.th}>NOME COMPLETO</th>
                    <th style={styles.th}>POSTO/GRAD.</th>
                    <th style={styles.th}>UNIDADE</th>
                    <th style={{ ...styles.th, width: "120px" }}>AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((officer, index) => (
                    <tr key={officer.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                      <td style={styles.td}>{officer.re_with_digit || "-"}</td>
                      <td style={styles.td}>{officer.full_name || "-"}</td>
                      <td style={styles.td}>{officer.rank || "-"}</td>
                      <td style={styles.td}>{officer.unit_label || "-"}</td>
                      <td style={styles.td}>
                        <button type="button" onClick={() => handleSelectOfficer(officer)} style={{ ...styles.button, ...styles.infoButton, minWidth: "92px" }}>
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {mode === "create-form" && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>{editingId ? "Editar Bloco LP" : "Preencher Bloco LP"}</h2>
          {selectedOfficer && <div style={{ ...styles.card, marginBottom: "16px" }}><div style={styles.formGrid}><div style={styles.field}><span style={styles.label}>Nome Completo</span><div style={styles.input}>{selectedOfficer.nome}</div></div><div style={styles.field}><span style={styles.label}>RE-DC</span><div style={styles.input}>{selectedOfficer.re_dc}</div></div><div style={styles.field}><span style={styles.label}>Posto/Grad.</span><div style={styles.input}>{selectedOfficer.posto_graduacao}</div></div><div style={styles.field}><span style={styles.label}>Unidade</span><div style={styles.input}>{selectedOfficer.unidade}</div></div></div></div>}
          <form onSubmit={handleSave}>
            {blocos.map((bloco, blocoIndex) => (
              <section key={`bloco-${bloco.id}`} style={{ ...styles.card, marginBottom: "16px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>{`${blocoIndex + 1}º Bloco`}</h3>
                  {blocos.length > 1 && <button type="button" onClick={() => removeBlock(blocoIndex)} style={{ ...styles.button, ...styles.dangerButton }}>✕ Remover</button>}
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.field}><label style={styles.label}>Bol G PM Concessão *</label><input value={bloco.bol_g_pm_concessao} onChange={(event) => updateBlock(blocoIndex, "bol_g_pm_concessao", event.target.value)} style={styles.input} placeholder="Ex: 059/09" required /></div>
                  <div style={styles.field}><label style={styles.label}>Tipo *</label><select value={bloco.tipo_bloco} onChange={(event) => updateBlock(blocoIndex, "tipo_bloco", event.target.value)} style={styles.input} required>{TIPO_OPTIONS.map((option) => <option key={`${bloco.id}-${option.value || "empty"}`} value={option.value}>{option.label}</option>)}</select></div>
                </div>
                {!bloco.tipo_bloco && <div style={{ ...styles.infoBox, marginTop: "12px" }}>Selecione o tipo do bloco para continuar.</div>}
                {bloco.tipo_bloco === "fruicao" && <div style={{ ...styles.formGrid, marginTop: "12px" }}><div style={styles.field}><label style={styles.label}>Dias</label><select value={bloco.dias} onChange={(event) => updateBlock(blocoIndex, "dias", event.target.value)} style={styles.input}><option value="15">15 dias</option><option value="30">30 dias</option></select></div><div style={styles.field}><label style={styles.label}>Início do Gozo</label><input value={bloco.inicio_gozo} onChange={(event) => updateBlock(blocoIndex, "inicio_gozo", event.target.value)} placeholder="DD/MM/AAAA" style={styles.input} /></div><div style={styles.field}><label style={styles.label}>Boletim Interno</label><input value={bloco.boletim_interno} onChange={(event) => updateBlock(blocoIndex, "boletim_interno", event.target.value)} placeholder="Ex: BI CPRv-017/11" style={styles.input} /></div></div>}
                {bloco.tipo_bloco === "pecunia" && <div style={{ ...styles.formGrid, marginTop: "12px" }}><div style={styles.field}><label style={styles.label}>Mês de Conversão</label><input value={bloco.mes_conversao} onChange={(event) => updateBlock(blocoIndex, "mes_conversao", event.target.value)} placeholder="Ex: jun/09" style={styles.input} /></div><div style={styles.field}><label style={styles.label}>Pecúnia Bol G PM</label><input value={bloco.pecunia_bol_g} onChange={(event) => updateBlock(blocoIndex, "pecunia_bol_g", event.target.value)} placeholder="Ex: 091/09" style={styles.input} /></div></div>}
                {blocoIndex === blocos.length - 1 && bloco.tipo_bloco && <div style={{ ...styles.actions, marginTop: "14px" }}><button type="button" onClick={addBlock} style={{ ...styles.button, ...styles.secondaryButton }}>{`+ Inserir ${blocos.length + 1}º Bloco`}</button></div>}
              </section>
            ))}
            <div style={styles.footerActions}><button type="button" onClick={resetFlow} style={{ ...styles.button, ...styles.secondaryButton }}>Cancelar</button><button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>Salvar</button></div>
          </form>
        </section>
      )}

      {mode === "view" && selectedRegistro && <section style={styles.card}><div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}><div><h2 style={{ ...styles.sectionTitle, textAlign: "center" }}>CONTROLE DE FRUIÇÃO DE BLOCOS DE LICENÇA PRÊMIO</h2><p style={styles.sectionText}>{selectedRegistro.nome} | {selectedRegistro.re_dc} | {selectedRegistro.posto_graduacao || "-"} | {selectedRegistro.unidade || "-"}</p></div><div style={styles.tableHeaderActions}><button type="button" onClick={() => setMode("list")} style={{ ...styles.button, ...styles.secondaryButton }}>← Voltar</button><button type="button" onClick={() => void handleEdit(selectedRegistro)} style={{ ...styles.button, ...styles.primaryButton }}>✏ Editar</button><button type="button" onClick={() => printRegistro(selectedRegistro)} style={{ ...styles.button, ...styles.secondaryButton }}>🖨 Imprimir</button><button type="button" onClick={() => exportRegistroPdf(selectedRegistro)} style={{ ...styles.button, ...styles.secondaryButton }}>⬇ Exportar PDF</button><button type="button" onClick={() => exportRegistroExcel(selectedRegistro)} style={{ ...styles.button, ...styles.secondaryButton }}>⬇ Exportar Excel</button></div></div><div style={{ display: "grid", gap: "16px" }}>{selectedRegistro.blocos.map((bloco) => <section key={bloco.id || bloco.numero_bloco} style={{ ...styles.card, padding: "18px" }}><div style={{ marginBottom: "12px" }}><h3 style={{ ...styles.sectionTitle, marginBottom: "4px" }}>{`${bloco.numero_bloco}º Bloco`}</h3><p style={styles.sectionText}>{getTipoLabel(bloco.tipo_bloco)}</p></div><div style={{ overflowX: "auto" }}><BlockTable bloco={bloco} /></div></section>)}</div></section>}

      {mode === "list" && <section style={styles.tableCard}><div style={styles.tableHeader}><div><h2 style={styles.tableTitle}>Controle de Fruição de Blocos de Licença Prêmio</h2><p style={styles.tableMeta}>{items.length} registros cadastrados</p></div><ReportExportButtons disabled={!visibleItems.length} onExportExcel={() => exportExcelReport({ fileBaseName: "bloco_lp", sheetName: "Bloco LP", title: "Controle de Fruição de Blocos de Licença Prêmio", subtitle: "Listagem resumida dos blocos LP", columns: SUMMARY_COLUMNS, rows: visibleItems })} onExportPdf={() => exportPdfReport({ fileBaseName: "bloco_lp", title: "Controle de Fruição de Blocos de Licença Prêmio", subtitle: "Listagem resumida dos blocos LP", columns: SUMMARY_COLUMNS, rows: visibleItems, orientation: "landscape" })} /></div><div style={{ ...styles.card, margin: "16px" }}><div style={styles.actions}><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar por RE ou nome" style={{ ...styles.input, ...styles.actionFieldWide }} /><button onClick={() => void loadItems()} style={{ ...styles.button, ...styles.primaryButton }}>Pesquisar</button></div></div><div style={{ ...styles.tableWrap, overflowX: "auto" }}><table style={{ ...styles.table, minWidth: "1200px" }}><thead><tr><th style={{ ...styles.th, width: "80px" }}>VER</th><th style={styles.th}>RE</th><th style={styles.th}>NOME</th><th style={styles.th}>QUADRO</th><th style={styles.th}>Nº BLOCOS</th><th style={styles.th}>ÚLTIMO BOL G</th><th style={styles.th}>ÚLTIMO INÍCIO</th><th style={styles.th}>STATUS</th><th style={styles.th}>AÇÕES</th></tr></thead><tbody>{visibleItems.map((item, index) => <tr key={item.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}><td style={styles.td}><button type="button" onClick={() => void handleView(item)} style={{ ...styles.button, ...styles.infoButton, minWidth: "52px", padding: "8px 12px" }}>Ver</button></td><td style={styles.td}>{item.re_dc}</td><td style={styles.td}>{item.nome}</td><td style={styles.td}>{item.quadro || "-"}</td><td style={styles.td}>{item.total_blocos}</td><td style={styles.td}>{item.ultimo_bol_g || "-"}</td><td style={styles.td}>{item.ultimo_inicio || "-"}</td><td style={styles.td}>{item.status}</td><td style={styles.td}><div style={styles.tableActionGroup}><button type="button" onClick={() => void handleEdit(item)} style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}>Editar</button><button type="button" onClick={() => void handleDelete(item)} style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}>Excluir</button></div></td></tr>)}</tbody></table>{!loading && !error && visibleItems.length === 0 ? <div style={styles.emptyState}>Nenhum bloco LP cadastrado. Clique em [+ Criar Bloco LP] para começar.</div> : null}{loading ? <div style={styles.emptyState}>Carregando blocos LP...</div> : null}</div></section>}
    </div>
  );
}
