import { useEffect, useMemo, useState } from "react";

import ReportExportButtons from "../components/ReportExportButtons";
import { appShellStyles as styles } from "../components/appShellStyles";
import { createCop, deleteCop, getCopById, getCopMovements, getCops, moveCop, updateCop } from "../services/copsService";
import { getFleetVehicles } from "../services/fleetService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildHierarchicalUnitLabelMap, buildHierarchicalUnitOptions } from "../utils/unitOptions";

const RESPONSIBILITY_OPTIONS = ["Setor", "Policial", "Viatura", "Reserva da Unidade"];
const HOLDER_OPTIONS = ["PMESP", "DER", "Concessionária", "Particular"];
const STATUS_OPTIONS = ["Ativo", "Inativo", "Em Manutenção", "Extraviado", "Baixado"];
const MOVEMENT_OPTIONS = ["Transferência", "Baixa", "Manutenção", "Devolução"];

const emptyForm = () => ({
  unit_id: "", name: "", model: "", serial_number: "", patrimony: "", responsibility_type: "",
  material_sector_id: "", responsible_sector_id: "", police_officer_id: "", fleet_vehicle_id: "",
  holder: "", holder_concessionaria: "", status: "Ativo", location: "", notes: "",
});

const emptyMovement = () => ({
  to_unit_id: "", to_sector_id: "", to_police_officer_id: "", movement_type: "", movement_date: "", observation: "",
});

const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const officerLabel = (officer) => [officer?.war_name || officer?.full_name, officer?.re_with_digit, officer?.rank].filter(Boolean).join(" | ");
const vehicleLabel = (vehicle) => [vehicle?.prefix, vehicle?.plate, vehicle?.model].filter(Boolean).join(" | ");
const maskDate = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

function statusBadge(status) {
  if (status === "Ativo") return styles.activeBadge;
  if (status === "Inativo") return styles.neutralBadge;
  if (status === "Baixado") return styles.inactiveBadge;
  if (status === "Em Manutenção") return { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" };
  if (status === "Extraviado") return { backgroundColor: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" };
  return styles.neutralBadge;
}

function Field({ label, required = false, full = false, children }) {
  return (
    <div style={full ? styles.fieldFull : styles.field}>
      <label style={styles.label}>{label}{required ? " *" : ""}</label>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }) {
  return <Field label={label}><div style={{ ...styles.input, backgroundColor: "var(--app-surface-soft)" }}>{value || "-"}</div></Field>;
}

function stickyColumn(left, minWidth, isHeader = false) {
  return {
    position: "sticky",
    left,
    zIndex: isHeader ? 4 : 2,
    backgroundColor: isHeader ? "var(--app-surface-muted)" : "var(--app-surface)",
    minWidth,
    boxShadow: left > 0 ? "6px 0 12px rgba(15, 23, 42, 0.06)" : "none",
  };
}

function SuggestionList({ items, renderLabel, onPick }) {
  if (!items.length) return null;
  return (
    <div style={{ ...styles.listStack, marginTop: "8px" }}>
      {items.slice(0, 6).map((item) => (
        <button key={item.id} type="button" onClick={() => onPick(item)} style={{ ...styles.button, ...styles.secondaryButton, textAlign: "left", justifyContent: "flex-start", borderRadius: "14px" }}>
          {renderLabel(item)}
        </button>
      ))}
    </div>
  );
}

function CopsPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [records, setRecords] = useState([]);
  const [units, setUnits] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [movements, setMovements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [movement, setMovement] = useState(emptyMovement());
  const [policeLookup, setPoliceLookup] = useState("");
  const [vehicleLookup, setVehicleLookup] = useState("");
  const [movePoliceLookup, setMovePoliceLookup] = useState("");
  const [filters, setFilters] = useState({ q: "", unitId: "", status: "", holder: "", policial: "" });

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);
  const unitMap = useMemo(() => buildHierarchicalUnitLabelMap(units), [units]);
  const activeSectors = useMemo(() => sectors.filter((sector) => sector.is_active !== false), [sectors]);
  const filteredSectors = useMemo(() => activeSectors.filter((sector) => !form.unit_id || String(sector.unit_id) === String(form.unit_id)), [activeSectors, form.unit_id]);
  const movementSectors = useMemo(() => activeSectors.filter((sector) => !movement.to_unit_id || String(sector.unit_id) === String(movement.to_unit_id)), [activeSectors, movement.to_unit_id]);
  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => !form.unit_id || String(vehicle.unit_id) === String(form.unit_id)), [vehicles, form.unit_id]);
  const policeSuggestions = useMemo(() => !policeLookup || form.police_officer_id ? [] : officers.filter((officer) => normalize(officerLabel(officer)).includes(normalize(policeLookup))), [officers, policeLookup, form.police_officer_id]);
  const vehicleSuggestions = useMemo(() => !vehicleLookup || form.fleet_vehicle_id ? [] : filteredVehicles.filter((vehicle) => normalize(vehicleLabel(vehicle)).includes(normalize(vehicleLookup))), [filteredVehicles, vehicleLookup, form.fleet_vehicle_id]);
  const movePoliceSuggestions = useMemo(() => !movePoliceLookup || movement.to_police_officer_id ? [] : officers.filter((officer) => normalize(officerLabel(officer)).includes(normalize(movePoliceLookup))), [officers, movePoliceLookup, movement.to_police_officer_id]);
  const totals = useMemo(() => ({
    total: records.length,
    ativas: records.filter((item) => item.status === "Ativo").length,
    manutencao: records.filter((item) => item.status === "Em Manutenção").length,
    inativas: records.filter((item) => item.status === "Inativo").length,
  }), [records]);

  useEffect(() => { void bootstrap(); }, []);

  async function bootstrap() {
    try {
      setLoading(true);
      const [unitsData, sectorsData, officersData, vehiclesData, cops] = await Promise.all([getUnits(), getSectors(), getPoliceOfficers("", null, { includeInactive: false }), getFleetVehicles({ includeInactive: false }), getCops()]);
      setUnits(unitsData); setSectors(sectorsData); setOfficers(officersData); setVehicles(vehiclesData); setRecords(cops); setError("");
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar o Controle de COPs.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh(nextFilters = filters) { setRecords(await getCops(nextFilters)); }
  function reset() { setShowForm(false); setEditingId(null); setForm(emptyForm()); setPoliceLookup(""); setVehicleLookup(""); }
  function startNew() { setSelected(null); setMovements([]); setShowMovement(false); setEditingId(null); setForm(emptyForm()); setPoliceLookup(""); setVehicleLookup(""); setShowForm(true); }

  function loadIntoForm(record) {
    setForm({
      unit_id: record.unit_id ? String(record.unit_id) : "", name: record.name || "", model: record.model || "", serial_number: record.serial_number || "", patrimony: record.patrimony || "",
      responsibility_type: record.responsibility_type || "", material_sector_id: record.material_sector_id ? String(record.material_sector_id) : "", responsible_sector_id: record.responsible_sector_id ? String(record.responsible_sector_id) : "",
      police_officer_id: record.police_officer_id ? String(record.police_officer_id) : "", fleet_vehicle_id: record.fleet_vehicle_id ? String(record.fleet_vehicle_id) : "", holder: record.holder || "", holder_concessionaria: record.holder_concessionaria || "",
      status: record.status || "Ativo", location: record.location || "", notes: record.notes || "",
    });
    setPoliceLookup([record.police_officer_name, record.police_officer_re, record.police_officer_rank].filter(Boolean).join(" | "));
    setVehicleLookup([record.fleet_vehicle_prefix, record.fleet_vehicle_plate, record.fleet_vehicle_model].filter(Boolean).join(" | "));
  }

  async function viewRecord(id) {
    try {
      const [record, history] = await Promise.all([getCopById(id), getCopMovements(id)]);
      setSelected(record); setMovements(history); setShowMovement(false); setMovement(emptyMovement()); setMovePoliceLookup(""); setError("");
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar a COP.");
    }
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.model.trim() || !form.unit_id || !form.status) return setError("Preencha os campos obrigatórios da COP.");
    if (form.holder === "Concessionária" && !form.holder_concessionaria.trim()) return setError("Informe o nome da concessionária.");
    const payload = {
      unit_id: Number(form.unit_id), name: form.name.trim(), model: form.model.trim(), serial_number: form.serial_number.trim() || null, patrimony: form.patrimony.trim() || null,
      responsibility_type: form.responsibility_type || null, material_sector_id: form.material_sector_id ? Number(form.material_sector_id) : null, responsible_sector_id: form.responsible_sector_id ? Number(form.responsible_sector_id) : null,
      police_officer_id: form.police_officer_id ? Number(form.police_officer_id) : null, fleet_vehicle_id: form.fleet_vehicle_id ? Number(form.fleet_vehicle_id) : null, holder: form.holder || null,
      holder_concessionaria: form.holder === "Concessionária" ? form.holder_concessionaria.trim() || null : null, status: form.status, location: form.location.trim() || null, notes: form.notes.trim() || null,
    };
    try {
      const saved = editingId ? await updateCop(editingId, payload) : await createCop(payload);
      setSuccess(editingId ? "COP atualizada com sucesso." : "COP cadastrada com sucesso."); setError(""); reset(); await refresh(); await viewRecord(saved.id);
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar a COP.");
    }
  }

  async function removeRecord() {
    if (!selected || !window.confirm("Deseja excluir esta COP?")) return;
    try {
      await deleteCop(selected.id); setSelected(null); setMovements([]); setSuccess("COP excluída com sucesso."); setError(""); await refresh();
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao excluir a COP.");
    }
  }

  async function submitMovement(event) {
    event.preventDefault();
    if (!selected) return;
    if (!movement.movement_type) return setError("Selecione o tipo de movimentação.");
    try {
      const updated = await moveCop(selected.id, {
        to_unit_id: movement.to_unit_id ? Number(movement.to_unit_id) : selected.unit_id,
        to_sector_id: movement.to_sector_id ? Number(movement.to_sector_id) : null,
        to_police_officer_id: movement.to_police_officer_id ? Number(movement.to_police_officer_id) : null,
        movement_type: movement.movement_type,
        movement_date: movement.movement_date || null,
        observation: movement.observation.trim() || null,
      });
      setSuccess("Movimentação registrada com sucesso."); setError(""); setShowMovement(false); setMovement(emptyMovement()); setMovePoliceLookup(""); await refresh(); await viewRecord(updated.id);
    } catch (moveError) {
      setError(moveError.message || "Erro ao movimentar a COP.");
    }
  }

  async function exportExcel() {
    await exportExcelReport({ fileBaseName: "controle-cops", sheetName: "COPs", title: "Controle de COPs", subtitle: "Gerencie as COPs vinculadas ao 5BPRv", columns: [
      { key: "name", label: "Nome da COP", width: 24 }, { key: "model", label: "Modelo", width: 24 }, { key: "unit", label: "Unidade", width: 22 }, { key: "police", label: "Policial Responsável", width: 24 }, { key: "vehicle", label: "Viatura", width: 24 }, { key: "status", label: "Status", width: 18 }, { key: "patrimony", label: "Patrimônio", width: 18 },
    ], rows: records.map((record) => ({ name: record.name, model: record.model, unit: record.unit_label, police: [record.police_officer_name, record.police_officer_re].filter(Boolean).join(" | "), vehicle: [record.fleet_vehicle_prefix, record.fleet_vehicle_plate, record.fleet_vehicle_model].filter(Boolean).join(" | "), status: record.status, patrimony: record.patrimony })) });
  }

  async function exportPdf() {
    await exportPdfReport({ fileBaseName: "controle-cops", title: "Controle de COPs", subtitle: "Gerencie as COPs vinculadas ao 5BPRv", orientation: "landscape", summaryItems: [`Ativas: ${totals.ativas}`, `Em manutenção: ${totals.manutencao}`, `Inativas: ${totals.inativas}`], columns: [
      { key: "name", label: "Nome da COP" }, { key: "model", label: "Modelo" }, { key: "unit", label: "Unidade" }, { key: "police", label: "Policial Responsável" }, { key: "vehicle", label: "Viatura" }, { key: "status", label: "Status" }, { key: "patrimony", label: "Patrimônio" },
    ], rows: records.map((record) => ({ name: record.name, model: record.model, unit: record.unit_label, police: [record.police_officer_name, record.police_officer_re].filter(Boolean).join(" | "), vehicle: [record.fleet_vehicle_prefix, record.fleet_vehicle_plate, record.fleet_vehicle_model].filter(Boolean).join(" | "), status: record.status, patrimony: record.patrimony })) });
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Controle de COPs</h1>
        <p style={styles.subtitle}>Gerencie as COPs vinculadas ao 5BPRv.</p>
        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
          <button type="button" onClick={startNew} style={{ ...styles.button, ...styles.primaryButton }}>+ Nova COP</button>
        </div>
      </section>

      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {success ? <div style={styles.successBox}>{success}</div> : null}

      <section style={styles.statsGrid}>{[["TOTAL COPS", totals.total, true], ["ATIVAS", totals.ativas, false], ["MANUTENÇÃO", totals.manutencao, false], ["INATIVAS", totals.inativas, false]].map(([label, value, accent]) => <div key={label} style={{ ...styles.statCard, ...(accent ? styles.statAccentCard : {}) }}><p style={styles.statLabel}>{label}</p><p style={styles.statValue}>{value}</p></div>)}</section>

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Filtros</h2>
        <div style={styles.formGrid}>
          <Field label="Busca geral"><input value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value }))} placeholder="Digite nome, modelo, patrimônio ou série" style={styles.input} /></Field>
          <Field label="Por Unidade"><select value={filters.unitId} onChange={(e) => setFilters((c) => ({ ...c, unitId: e.target.value }))} style={styles.input}><option value="">Todas</option>{unitOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field>
          <Field label="Por Status"><select value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))} style={styles.input}><option value="">Todos</option>{STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
          <Field label="Por Detentor"><select value={filters.holder} onChange={(e) => setFilters((c) => ({ ...c, holder: e.target.value }))} style={styles.input}><option value="">Todos</option>{HOLDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
          <Field label="Por Policial"><input value={filters.policial} onChange={(e) => setFilters((c) => ({ ...c, policial: e.target.value }))} placeholder="Digite RE ou nome" style={styles.input} /></Field>
        </div>
        <div style={styles.footerActions}><button type="button" onClick={() => refresh()} style={{ ...styles.button, ...styles.secondaryButton }}>Atualizar</button><button type="button" onClick={() => refresh(filters)} style={{ ...styles.button, ...styles.primaryButton }}>Aplicar filtros</button></div>
      </section>

      {selected ? <section style={{ ...styles.card, marginBottom: "24px" }}><h2 style={styles.sectionTitle}>Resumo da COP selecionada</h2><p style={styles.sectionText}>Visão rápida da COP aberta antes do detalhe completo.</p><div style={styles.summaryGrid}><div style={styles.summaryCard}><p style={styles.summaryLabel}>Nome</p><p style={styles.summaryValue}>{selected.name || "-"}</p></div><div style={styles.summaryCard}><p style={styles.summaryLabel}>Modelo</p><p style={styles.summaryValue}>{selected.model || "-"}</p></div><div style={styles.summaryCard}><p style={styles.summaryLabel}>Unidade</p><p style={styles.summaryValue}>{selected.unit_label || "-"}</p></div><div style={styles.summaryCard}><p style={styles.summaryLabel}>Status</p><p style={styles.summaryValue}>{selected.status || "-"}</p></div><div style={styles.summaryCard}><p style={styles.summaryLabel}>Policial</p><p style={styles.summaryValue}>{[selected.police_officer_name, selected.police_officer_re].filter(Boolean).join(" | ") || "-"}</p></div><div style={styles.summaryCard}><p style={styles.summaryLabel}>Viatura</p><p style={styles.summaryValue}>{[selected.fleet_vehicle_prefix, selected.fleet_vehicle_plate].filter(Boolean).join(" | ") || "-"}</p></div></div></section> : null}

      {showForm ? <section style={{ ...styles.card, marginBottom: "24px" }}><h2 style={styles.sectionTitle}>{editingId ? "Editar COP" : "Nova COP"}</h2><form onSubmit={submitForm}><div style={styles.formGrid}><Field label="Nome da COP" required><input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Ex: COP Alpha" style={styles.input} /></Field><Field label="Modelo da COP" required><input value={form.model} onChange={(e) => setForm((c) => ({ ...c, model: e.target.value }))} placeholder="Ex: Modelo A, Tipo 01" style={styles.input} /></Field><Field label="Número de Série"><input value={form.serial_number} onChange={(e) => setForm((c) => ({ ...c, serial_number: e.target.value }))} placeholder="Nº de série do equipamento" style={styles.input} /></Field><Field label="Patrimônio"><input value={form.patrimony} onChange={(e) => setForm((c) => ({ ...c, patrimony: e.target.value }))} placeholder="Nº de patrimônio" style={styles.input} /></Field><Field label="Unidade" required><select value={form.unit_id} onChange={(e) => setForm((c) => ({ ...c, unit_id: e.target.value, responsible_sector_id: "", fleet_vehicle_id: "" }))} style={styles.input}><option value="">Selecione</option>{unitOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field><Field label="Tipo de Responsabilidade"><select value={form.responsibility_type} onChange={(e) => setForm((c) => ({ ...c, responsibility_type: e.target.value }))} style={styles.input}><option value="">Selecione</option>{RESPONSIBILITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field><Field label="Setor do Material"><select value={form.material_sector_id} onChange={(e) => setForm((c) => ({ ...c, material_sector_id: e.target.value }))} style={styles.input}><option value="">Selecione</option>{activeSectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></Field><Field label="Setor Responsável"><select value={form.responsible_sector_id} onChange={(e) => setForm((c) => ({ ...c, responsible_sector_id: e.target.value }))} style={styles.input}><option value="">Selecione</option>{filteredSectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></Field><Field label="Policial Responsável"><input value={policeLookup} onChange={(e) => { setPoliceLookup(e.target.value); setForm((c) => ({ ...c, police_officer_id: "" })); }} placeholder="Digite o RE ou nome" style={styles.input} /><SuggestionList items={policeSuggestions} renderLabel={officerLabel} onPick={(officer) => { setForm((c) => ({ ...c, police_officer_id: String(officer.id) })); setPoliceLookup(officerLabel(officer)); }} /></Field><Field label="Viatura Vinculada"><input value={vehicleLookup} onChange={(e) => { setVehicleLookup(e.target.value); setForm((c) => ({ ...c, fleet_vehicle_id: "" })); }} placeholder="Digite o prefixo ou placa" style={styles.input} /><SuggestionList items={vehicleSuggestions} renderLabel={vehicleLabel} onPick={(vehicle) => { setForm((c) => ({ ...c, fleet_vehicle_id: String(vehicle.id) })); setVehicleLookup(vehicleLabel(vehicle)); }} /></Field><Field label="Detentor"><select value={form.holder} onChange={(e) => setForm((c) => ({ ...c, holder: e.target.value }))} style={styles.input}><option value="">Selecione</option>{HOLDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>{form.holder === "Concessionária" ? <Field label="Concessionária" required><input value={form.holder_concessionaria} onChange={(e) => setForm((c) => ({ ...c, holder_concessionaria: e.target.value }))} placeholder="Nome da concessionária" style={styles.input} /></Field> : null}<Field label="Status" required><select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} style={styles.input}><option value="">Selecione</option>{STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field><Field label="Localização"><input value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} placeholder="Ex: Sala de Armamento, Viatura R-05000, Depósito P4" style={styles.input} /></Field><Field label="Observações" full><textarea value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Informações adicionais sobre a COP" style={styles.textarea} /></Field></div><div style={styles.footerActions}><button type="button" onClick={reset} style={{ ...styles.button, ...styles.secondaryButton }}>Cancelar</button><button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>{editingId ? "Salvar alterações" : "Salvar"}</button></div></form></section> : null}

      {selected ? <><section style={{ ...styles.card, marginBottom: "24px" }}><div style={{ ...styles.actions, marginTop: 0, justifyContent: "space-between" }}><div><h2 style={styles.sectionTitle}>Detalhes da COP</h2><p style={styles.sectionText}>Consulte os dados completos e o histórico operacional da COP selecionada.</p></div><div style={styles.actions}><button type="button" onClick={() => setSelected(null)} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button><button type="button" onClick={() => { setEditingId(selected.id); loadIntoForm(selected); setShowForm(true); setShowMovement(false); }} style={{ ...styles.button, ...styles.secondaryButton }}>Editar</button><button type="button" onClick={() => setShowMovement((current) => !current)} style={{ ...styles.button, ...styles.primaryButton }}>Movimentar</button><button type="button" onClick={removeRecord} style={{ ...styles.button, ...styles.dangerButton }}>Excluir</button></div></div></section><section style={{ ...styles.card, marginTop: "18px" }}><h3 style={styles.sectionTitle}>Detalhes</h3><div style={styles.formGrid}><ReadOnly label="Nome da COP" value={selected.name} /><ReadOnly label="Modelo da COP" value={selected.model} /><ReadOnly label="Número de Série" value={selected.serial_number} /><ReadOnly label="Patrimônio" value={selected.patrimony} /><ReadOnly label="Unidade" value={selected.unit_label} /><ReadOnly label="Tipo de Responsabilidade" value={selected.responsibility_type} /><ReadOnly label="Setor do Material" value={selected.material_sector_label} /><ReadOnly label="Setor Responsável" value={selected.responsible_sector_label} /><ReadOnly label="Policial Responsável" value={[selected.police_officer_name, selected.police_officer_re, selected.police_officer_rank].filter(Boolean).join(" | ")} /><ReadOnly label="Viatura Vinculada" value={[selected.fleet_vehicle_prefix, selected.fleet_vehicle_plate, selected.fleet_vehicle_model].filter(Boolean).join(" | ")} /><ReadOnly label="Detentor" value={selected.holder_display} /><ReadOnly label="Status" value={selected.status} /><ReadOnly label="Localização" value={selected.location} /><ReadOnly label="Observações" value={selected.notes} /></div></section>{showMovement ? <section style={{ ...styles.card, marginTop: "18px" }}><h3 style={styles.sectionTitle}>Movimentar COP</h3><form onSubmit={submitMovement}><div style={styles.formGrid}><ReadOnly label="Unidade de origem" value={selected.unit_label} /><Field label="Unidade de destino"><select value={movement.to_unit_id} onChange={(e) => setMovement((c) => ({ ...c, to_unit_id: e.target.value, to_sector_id: "" }))} style={styles.input}><option value="">Selecione</option>{unitOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field><Field label="Setor destino"><select value={movement.to_sector_id} onChange={(e) => setMovement((c) => ({ ...c, to_sector_id: e.target.value }))} style={styles.input}><option value="">Selecione</option>{movementSectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></Field><Field label="Policial destino"><input value={movePoliceLookup} onChange={(e) => { setMovePoliceLookup(e.target.value); setMovement((c) => ({ ...c, to_police_officer_id: "" })); }} placeholder="Digite o RE ou nome" style={styles.input} /><SuggestionList items={movePoliceSuggestions} renderLabel={officerLabel} onPick={(officer) => { setMovement((c) => ({ ...c, to_police_officer_id: String(officer.id) })); setMovePoliceLookup(officerLabel(officer)); }} /></Field><Field label="Tipo de movimentação"><select value={movement.movement_type} onChange={(e) => setMovement((c) => ({ ...c, movement_type: e.target.value }))} style={styles.input}><option value="">Selecione</option>{MOVEMENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field><Field label="Data da movimentação"><input value={movement.movement_date} onChange={(e) => setMovement((c) => ({ ...c, movement_date: maskDate(e.target.value) }))} placeholder="DD/MM/AAAA" style={styles.input} /></Field><Field label="Observação" full><textarea value={movement.observation} onChange={(e) => setMovement((c) => ({ ...c, observation: e.target.value }))} placeholder="Descreva a movimentação" style={styles.textarea} /></Field></div><div style={styles.footerActions}><button type="button" onClick={() => { setShowMovement(false); setMovement(emptyMovement()); setMovePoliceLookup(""); }} style={{ ...styles.button, ...styles.secondaryButton }}>Cancelar</button><button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>Salvar movimentação</button></div></form></section> : null}<section style={{ ...styles.tableCard, marginTop: "18px", marginBottom: "24px" }}><div style={styles.tableHeader}><div><h3 style={styles.tableTitle}>Histórico de Movimentações</h3><p style={styles.tableMeta}>Acompanhe as movimentações da COP em ordem cronológica decrescente.</p></div></div><div style={{ overflowX: "auto" }}><table style={styles.table}><thead><tr><th style={styles.th}>DATA</th><th style={styles.th}>TIPO</th><th style={styles.th}>ORIGEM</th><th style={styles.th}>DESTINO</th><th style={styles.th}>POLICIAL</th><th style={styles.th}>OBSERVAÇÃO</th></tr></thead><tbody>{movements.length === 0 ? <tr><td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "var(--app-text-muted)" }}>Nenhuma movimentação registrada para esta COP.</td></tr> : movements.map((item) => <tr key={item.id}><td style={styles.td}>{item.movement_date || "-"}</td><td style={styles.td}>{item.movement_type}</td><td style={styles.td}>{item.from_unit_label || "-"}</td><td style={styles.td}>{[item.to_unit_label, item.to_sector_label].filter(Boolean).join(" | ") || "-"}</td><td style={styles.td}>{[item.to_police_officer_name, item.to_police_officer_re].filter(Boolean).join(" | ") || "-"}</td><td style={styles.td}>{item.observation || "-"}</td></tr>)}</tbody></table></div></section></> : null}

      <section style={styles.tableCard}><div style={styles.tableHeader}><div><h2 style={styles.tableTitle}>COPs cadastradas</h2><p style={styles.tableMeta}>{records.length} COP(s) localizadas.</p></div><ReportExportButtons disabled={records.length === 0} onExportExcel={exportExcel} onExportPdf={exportPdf} /></div>{!loading && records.length === 0 ? <div style={styles.emptyState}>Nenhuma COP cadastrada. Clique em + Nova COP para começar.</div> : null}{loading ? <div style={styles.emptyState}>Carregando COPs...</div> : null}<div style={{ overflowX: "auto" }}><table style={styles.table}><thead><tr><th style={{ ...styles.th, ...stickyColumn(0, 96, true) }}>VER</th><th style={{ ...styles.th, ...stickyColumn(96, 220, true) }}>NOME DA COP</th><th style={styles.th}>MODELO</th><th style={styles.th}>UNIDADE</th><th style={styles.th}>POLICIAL RESP.</th><th style={styles.th}>VIATURA</th><th style={{ ...styles.th, ...stickyColumn(316, 150, true) }}>STATUS</th><th style={styles.th}>PATRIMÔNIO</th></tr></thead><tbody>{!loading && records.map((record) => <tr key={record.id}><td style={{ ...styles.td, ...stickyColumn(0, 96) }}><button type="button" onClick={() => viewRecord(record.id)} style={{ ...styles.button, ...styles.secondaryButton, padding: "8px 12px" }}>Ver</button></td><td style={{ ...styles.td, ...stickyColumn(96, 220) }}>{record.name}</td><td style={styles.td}>{record.model}</td><td style={styles.td}>{record.unit_label || unitMap[record.unit_id] || "-"}</td><td style={styles.td}>{[record.police_officer_name, record.police_officer_re].filter(Boolean).join(" | ") || "-"}</td><td style={styles.td}>{[record.fleet_vehicle_prefix, record.fleet_vehicle_plate].filter(Boolean).join(" | ") || "-"}</td><td style={{ ...styles.td, ...stickyColumn(316, 150) }}><span style={{ ...styles.badge, ...statusBadge(record.status) }}>{record.status}</span></td><td style={styles.td}>{record.patrimony || "-"}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}

export default CopsPage;
