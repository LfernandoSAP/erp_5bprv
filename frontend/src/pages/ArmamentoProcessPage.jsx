import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import SearchInputAction from "../components/SearchInputAction";
import {
  createArmamentoProcesso,
  getArmamentoProcesso,
  getArmamentoProcessos,
  updateArmamentoProcesso,
} from "../services/armamentoProcessService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess } from "../utils/authAccess";
import { getOfficerDisplayName } from "../utils/officerLabels";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";

const CALIBER_OPTIONS = [
  { value: "RESTRITO", label: "Restrito" },
  { value: "PERMITIDO", label: "Permitido" },
  { value: "FUZIL", label: "Fuzil" },
];

const STATUS_OPTIONS = [
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "ENVIADO_AO_CMB", label: "Enviado ao CMB" },
  { value: "FINALIZADO", label: "Finalizado" },
];

const RESULT_OPTIONS = [
  { value: "CRAF_EMITIDO", label: "CRAF Emitido" },
  { value: "CRAF_ENTREGUE_AO_INTERESSADO", label: "CRAF entregue ao interessado" },
];

function createInitialForm() {
  return {
    policeStatus: "ATIVO",
    officerSearch: "",
    policeOfficerId: "",
    reDc: "",
    rank: "",
    fullName: "",
    unitNameSnapshot: "",
    entryDate: new Date().toISOString().slice(0, 10),
    caliber: "",
    processText: "",
    internalBulletin: "",
    observations: "",
    status: "EM_ANDAMENTO",
    cmbSentDate: "",
    result: "",
    resultDate: "",
  };
}

function DetailField({ label, value, fullWidth = false }) {
  return (
    <div style={fullWidth ? styles.fieldFull : styles.field}>
      <span style={styles.label}>{label}</span>
      <div style={{ ...styles.input, minHeight: "46px", display: "flex", alignItems: "center" }}>
        {value || "-"}
      </div>
    </div>
  );
}

function DetailSection({ title, fields }) {
  return (
    <section
      style={{
        padding: "18px",
        borderRadius: "18px",
        border: "1px solid var(--app-border)",
        backgroundColor: "var(--app-surface-muted)",
      }}
    >
      <h3 style={{ ...styles.sectionTitle, marginBottom: "14px", fontSize: "1rem" }}>{title}</h3>
      <div style={styles.formGrid}>
        {fields.map((field) => (
          <DetailField key={`${title}-${field.label}`} {...field} />
        ))}
      </div>
    </section>
  );
}

function ArmamentoProcessPage({ onBack, startWithForm = false }) {
  const [showForm, setShowForm] = useState(startWithForm);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createInitialForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    unitLabel: null,
  });
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("ALL_VISIBLE");
  const [units, setUnits] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [officerResults, setOfficerResults] = useState([]);
  const [isOfficerSearching, setIsOfficerSearching] = useState(false);

  const effectiveUnitFilter = useMemo(
    () => resolveEffectiveUnitFilter(selectedUnitFilter, viewerAccess.unitId),
    [selectedUnitFilter, viewerAccess.unitId]
  );

  const filterUnitOptions = useMemo(
    () => buildUnitFilterOptions(units, viewerAccess),
    [units, viewerAccess]
  );

  const filterDescription = useMemo(
    () =>
      buildUnitFilterDescription({
        selectedUnitFilter,
        units,
        unitMap,
        viewerAccess,
      }),
    [selectedUnitFilter, units, unitMap, viewerAccess]
  );

  useEffect(() => {
    setViewerAccess(readViewerAccess());
    void loadUnits();
  }, []);

  useEffect(() => {
    setShowForm(startWithForm);
  }, [startWithForm]);

  useEffect(() => {
    void loadItems();
  }, [effectiveUnitFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data);
      setUnitMap(buildHierarchicalUnitLabelMap(data));
    } catch {
      // ignore
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getArmamentoProcessos({
        search: searchTerm,
        unitId: effectiveUnitFilter,
      });
      setItems(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar processos de armamentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "policeStatus" && value === "INATIVO"
        ? { policeOfficerId: "", officerSearch: "" }
        : {}),
      ...(field === "status" && value !== "ENVIADO_AO_CMB" ? { cmbSentDate: "" } : {}),
      ...(field === "result" && !value ? { resultDate: "" } : {}),
    }));
  };

  const searchOfficer = async () => {
    const term = form.officerSearch.trim();
    if (term.length < 2) {
      setOfficerResults([]);
      return;
    }
    try {
      setIsOfficerSearching(true);
      const data = await getPoliceOfficers(term, null, { includeInactive: true });
      setOfficerResults(data.slice(0, 20));
    } catch (searchError) {
      setError(searchError.message || "Erro ao buscar policial.");
    } finally {
      setIsOfficerSearching(false);
    }
  };

  const handleSelectOfficer = (officer) => {
    setForm((current) => ({
      ...current,
      policeOfficerId: String(officer.id),
      officerSearch: `${officer.re_with_digit} - ${getOfficerDisplayName(officer)}`,
      reDc: officer.re_with_digit || "",
      rank: officer.rank || "",
      fullName: officer.full_name || "",
      unitNameSnapshot: officer.unit_label || officer.unit_name || "",
    }));
    setOfficerResults([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const access = readViewerAccess();
      if (!access.unitId) {
        throw new Error("Não foi possível identificar a unidade do usuário.");
      }

      const payload = {
        unit_id: access.unitId,
        police_officer_id: form.policeStatus === "ATIVO" && form.policeOfficerId ? Number(form.policeOfficerId) : null,
        police_status: form.policeStatus,
        re_dc: form.policeStatus === "INATIVO" ? form.reDc.trim() : form.reDc,
        rank: form.policeStatus === "INATIVO" ? form.rank.trim() : form.rank,
        full_name: form.policeStatus === "INATIVO" ? form.fullName.trim() : form.fullName,
        unit_name_snapshot: form.policeStatus === "INATIVO" ? form.unitNameSnapshot.trim() : form.unitNameSnapshot,
        entry_date: form.entryDate,
        caliber: form.caliber,
        process_text: form.processText.trim(),
        internal_bulletin: form.internalBulletin.trim(),
        observations: form.observations.trim(),
        status: form.status,
        cmb_sent_date: form.status === "ENVIADO_AO_CMB" ? form.cmbSentDate || null : null,
        result: form.result || null,
        result_date: form.result ? form.resultDate || null : null,
        is_active: true,
      };

      if (editingId) {
        await updateArmamentoProcesso(editingId, payload);
        setSuccess("Processo de armamento atualizado com sucesso.");
      } else {
        await createArmamentoProcesso(payload);
        setSuccess("Processo de armamento cadastrado com sucesso.");
      }

      setForm(createInitialForm());
      setEditingId(null);
      setShowForm(false);
      setOfficerResults([]);
      await loadItems();
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar processo.");
    }
  };

  const handleView = async (item) => {
    try {
      const details = await getArmamentoProcesso(item.id);
      setSelectedItem(details);
    } catch (detailError) {
      setError(detailError.message || "Erro ao carregar processo.");
    }
  };

  const handleEdit = async (item) => {
    const details = await getArmamentoProcesso(item.id);
    setSelectedItem(null);
    setEditingId(details.id);
    setForm({
      policeStatus: details.police_status || "ATIVO",
      officerSearch: details.police_officer_re
        ? `${details.police_officer_re} - ${details.police_officer_name || details.full_name || ""}`.trim()
        : "",
      policeOfficerId: details.police_officer_id ? String(details.police_officer_id) : "",
      reDc: details.re_dc || "",
      rank: details.rank || "",
      fullName: details.full_name || "",
      unitNameSnapshot: details.unit_name_snapshot || details.unit_label || "",
      entryDate: details.entry_date || new Date().toISOString().slice(0, 10),
      caliber: details.caliber || "",
      processText: details.process_text || "",
      internalBulletin: details.internal_bulletin || "",
      observations: details.observations || "",
      status: details.status || "EM_ANDAMENTO",
      cmbSentDate: details.cmb_sent_date || "",
      result: details.result || "",
      resultDate: details.result_date || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setOfficerResults([]);
    setShowForm(false);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Controle de Processo de Armamentos</h1>
        <p style={styles.subtitle}>
          Cadastre e acompanhe os processos de armamento vinculados a policiais ativos ou inativos.
        </p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button
            onClick={() => {
              if (!showForm) {
                setEditingId(null);
                setForm(createInitialForm());
              }
              setShowForm((current) => !current);
            }}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Novo processo
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Consulta de processos</h2>
        <p style={styles.sectionText}>Pesquise por RE, nome completo, boletim interno ou dados do processo.</p>
        <div style={styles.actions}>
          <select
            value={selectedUnitFilter}
            onChange={(event) => setSelectedUnitFilter(event.target.value)}
            style={{ ...styles.input, ...styles.actionField }}
          >
            <option value="ALL_VISIBLE">Todas as unidades visíveis</option>
            {viewerAccess.unitId && (
              <option value="SELF">
                {`Somente minha unidade (${viewerAccess.unitLabel || "unidade atual"})`}
              </option>
            )}
            {filterUnitOptions.map((unit) => (
              <option key={unit.id} value={String(unit.id)}>
                {unitMap[unit.id] ?? unit.name}
              </option>
            ))}
          </select>
          <SearchInputAction
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onSearch={() => void loadItems()}
            placeholder="Pesquisar por RE, nome, boletim interno ou processo"
            style={styles.actionFieldWide}
          />
        </div>
        <p style={{ ...styles.helperText, marginTop: "12px" }}>{filterDescription}</p>
      </section>

      {showForm ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>
            {editingId ? "Editar processo de armamento" : "Cadastrar processo de armamento"}
          </h2>
          <p style={styles.sectionText}>Preencha os dados essenciais do processo.</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Situação do Policial</label>
                <select value={form.policeStatus} onChange={handleFieldChange("policeStatus")} style={styles.input}>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Entrada</label>
                <input type="date" value={form.entryDate} onChange={handleFieldChange("entryDate")} style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Calibre</label>
                <select value={form.caliber} onChange={handleFieldChange("caliber")} style={styles.input} required>
                  <option value="">Selecione</option>
                  {CALIBER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Status</label>
                <select value={form.status} onChange={handleFieldChange("status")} style={styles.input} required>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.policeStatus === "ATIVO" ? (
                <div style={styles.fieldFull}>
                  <label style={styles.label}>Buscar policial ativo</label>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <SearchInputAction
                      value={form.officerSearch}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          officerSearch: event.target.value,
                          policeOfficerId: "",
                          reDc: "",
                          rank: "",
                          fullName: "",
                          unitNameSnapshot: "",
                        }))
                      }
                      onSearch={searchOfficer}
                      placeholder="Digite parte do RE ou nome do policial"
                      style={{ flex: "1 1 360px" }}
                    />
                    {isOfficerSearching ? <div style={styles.helperText}>Pesquisando...</div> : null}
                  </div>

                  {officerResults.length ? (
                    <div className="desktop-table-view" style={{ ...styles.tableWrap, marginTop: "12px" }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={{ ...styles.th, width: "90px" }}>Selecionar</th>
                            <th style={styles.th}>RE</th>
                            <th style={styles.th}>Posto/Graduação</th>
                            <th style={styles.th}>Nome</th>
                            <th style={styles.th}>Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {officerResults.map((officer) => (
                            <tr key={officer.id}>
                              <td style={styles.td}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectOfficer(officer)}
                                  style={{ ...styles.button, ...styles.secondaryButton, padding: "8px 12px" }}
                                >
                                  Selecionar
                                </button>
                              </td>
                              <td style={styles.td}>{officer.re_with_digit || "-"}</td>
                              <td style={styles.td}>{officer.rank || "-"}</td>
                              <td style={styles.td}>{officer.full_name || getOfficerDisplayName(officer)}</td>
                              <td style={styles.td}>{officer.unit_label || officer.unit_name || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div style={styles.field}>
                <label style={styles.label}>RE</label>
                <input value={form.reDc} onChange={handleFieldChange("reDc")} style={styles.input} disabled={form.policeStatus === "ATIVO"} required />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Posto/Graduação</label>
                <input value={form.rank} onChange={handleFieldChange("rank")} style={styles.input} disabled={form.policeStatus === "ATIVO"} required />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nome completo</label>
                <input value={form.fullName} onChange={handleFieldChange("fullName")} style={styles.input} disabled={form.policeStatus === "ATIVO"} required />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Unidade</label>
                <input
                  value={form.unitNameSnapshot}
                  onChange={handleFieldChange("unitNameSnapshot")}
                  style={styles.input}
                  disabled={form.policeStatus === "ATIVO"}
                  required
                />
              </div>

              {form.status === "ENVIADO_AO_CMB" ? (
                <div style={styles.field}>
                  <label style={styles.label}>Data de envio ao CMB</label>
                  <input type="date" value={form.cmbSentDate} onChange={handleFieldChange("cmbSentDate")} style={styles.input} required />
                </div>
              ) : null}

              <div style={styles.field}>
                <label style={styles.label}>Resultado</label>
                <select value={form.result} onChange={handleFieldChange("result")} style={styles.input}>
                  <option value="">Selecione</option>
                  {RESULT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.result ? (
                <div style={styles.field}>
                  <label style={styles.label}>Data do resultado</label>
                  <input type="date" value={form.resultDate} onChange={handleFieldChange("resultDate")} style={styles.input} required />
                </div>
              ) : null}

              <div style={styles.fieldFull}>
                <label style={styles.label}>Processo</label>
                <textarea value={form.processText} onChange={handleFieldChange("processText")} style={styles.textarea} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Boletim Interno</label>
                <input value={form.internalBulletin} onChange={handleFieldChange("internalBulletin")} style={styles.input} />
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Observações</label>
                <textarea value={form.observations} onChange={handleFieldChange("observations")} style={styles.textarea} />
              </div>
            </div>

            <div style={styles.footerActions}>
              <button type="button" onClick={resetForm} style={{ ...styles.button, ...styles.secondaryButton }}>
                Cancelar
              </button>
              <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
                {editingId ? "Salvar alterações" : "Cadastrar processo"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section style={styles.tableCard}>
        {selectedItem ? (
          <section style={{ ...styles.card, margin: "20px 20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
              <div>
                <h2 style={styles.sectionTitle}>Detalhes do processo</h2>
                <p style={styles.sectionText}>Consulte os dados completos do processo de armamento selecionado.</p>
              </div>
              <div style={styles.tableHeaderActions}>
                <button type="button" onClick={() => setSelectedItem(null)} style={{ ...styles.button, ...styles.secondaryButton }}>
                  ← Voltar
                </button>
                <button type="button" onClick={() => void handleEdit(selectedItem)} style={{ ...styles.button, ...styles.primaryButton }}>
                  ✏ Editar
                </button>
              </div>
            </div>

            <DetailSection
              title="Policial"
              fields={[
                { label: "Situação do Policial", value: selectedItem.police_status === "ATIVO" ? "Ativo" : "Inativo" },
                { label: "RE", value: selectedItem.re_dc },
                { label: "Posto/Graduação", value: selectedItem.rank },
                { label: "Nome completo", value: selectedItem.full_name },
                { label: "Unidade", value: selectedItem.unit_name_snapshot || selectedItem.unit_label },
              ]}
            />

            <div style={{ marginTop: "16px" }}>
              <DetailSection
                title="Processo"
                fields={[
                  { label: "Entrada", value: selectedItem.entry_date },
                  { label: "Calibre", value: CALIBER_OPTIONS.find((item) => item.value === selectedItem.caliber)?.label || selectedItem.caliber },
                  { label: "Status", value: STATUS_OPTIONS.find((item) => item.value === selectedItem.status)?.label || selectedItem.status },
                  { label: "Boletim Interno", value: selectedItem.internal_bulletin },
                  { label: "Data envio ao CMB", value: selectedItem.cmb_sent_date },
                  { label: "Resultado", value: RESULT_OPTIONS.find((item) => item.value === selectedItem.result)?.label || selectedItem.result || "-" },
                  { label: "Data do resultado", value: selectedItem.result_date },
                  { label: "Processo", value: selectedItem.process_text || "-", fullWidth: true },
                  { label: "Observações", value: selectedItem.observations || "-", fullWidth: true },
                ]}
              />
            </div>
          </section>
        ) : null}

        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Processos cadastrados</h2>
            <p style={styles.tableMeta}>{items.length} registro(s) encontrado(s)</p>
          </div>
        </div>

        <div className="desktop-table-view" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px" }}>Ver</th>
                <th style={styles.th}>RE</th>
                <th style={styles.th}>Nome completo</th>
                <th style={styles.th}>Unidade</th>
                <th style={styles.th}>Calibre</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => void handleView(item)}
                      style={{ ...styles.button, ...styles.infoButton, padding: "8px 12px", minWidth: "52px" }}
                    >
                      Ver
                    </button>
                  </td>
                  <td style={styles.td}>{item.re_dc || "-"}</td>
                  <td style={styles.td}>{item.full_name || "-"}</td>
                  <td style={styles.td}>{item.unit_name_snapshot || item.unit_label || "-"}</td>
                  <td style={styles.td}>{CALIBER_OPTIONS.find((option) => option.value === item.caliber)?.label || item.caliber}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...styles.infoBadge }}>
                      {STATUS_OPTIONS.find((option) => option.value === item.status)?.label || item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 ? <div style={styles.emptyState}>Nenhum processo cadastrado ainda.</div> : null}
          {loading ? <div style={styles.emptyState}>Carregando processos...</div> : null}
        </div>
      </section>
    </div>
  );
}

export default ArmamentoProcessPage;
