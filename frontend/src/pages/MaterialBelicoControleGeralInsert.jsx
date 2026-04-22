import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { custodyOptions } from "../constants/custodyOptions";
import { createMaterialBelicoControleGeral } from "../services/materialBelicoService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildCustodySummary } from "../utils/custodyLabels";
import {
  buildOfficerOptionLabel,
  buildOfficerSummary,
  findOfficerByLookup,
} from "../utils/officerLabels";
import { formatSectorLabel } from "../utils/sectorOptions";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";

function MaterialBelicoControleGeralInsert({ onBack, onSaved }) {
  const [form, setForm] = useState({
    unitId: "",
    custodyType: "RESERVA_UNIDADE",
    custodySectorId: "",
    policeOfficerId: "",
    officerLookup: "",
    postoGrad: "",
    re: "",
    nome: "",
    itemName: "",
    ciaEm: "",
    opmAtual: "",
    armamentoNumeroSerie: "",
    armamentoPatrimonio: "",
    municaoLote: "",
    algemaNumeroSerie: "",
    algemaPatrimonio: "",
    coleteNumeroSerie: "",
    coletePatrimonio: "",
  });
  const [units, setUnits] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    canViewAll: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const access = readAuthAccess();
    setViewerAccess(access);
    void loadUnits(access);
    void loadSectors();
    void loadPoliceOfficers();
  }, []);

  const availableUnits = useMemo(() => {
    if (viewerAccess.canViewAll) {
      return units;
    }
    return units.filter((unit) => String(unit.id) === String(viewerAccess.unitId));
  }, [units, viewerAccess]);

  const unitOptions = useMemo(
    () => buildHierarchicalUnitOptions(availableUnits),
    [availableUnits]
  );

  const availablePoliceOfficers = useMemo(() => {
    if (!form.unitId) {
      return [];
    }
    return policeOfficers.filter(
      (officer) => String(officer.unit_id) === String(form.unitId)
    );
  }, [policeOfficers, form.unitId]);

  const availableSectors = useMemo(() => {
    if (!form.unitId) {
      return [];
    }
    return sectors.filter((sector) => String(sector.unit_id) === String(form.unitId));
  }, [sectors, form.unitId]);

  const selectedOfficer = useMemo(
    () =>
      availablePoliceOfficers.find(
        (officer) => String(officer.id) === String(form.policeOfficerId)
      ),
    [availablePoliceOfficers, form.policeOfficerId]
  );

  const selectedSector = useMemo(
    () =>
      availableSectors.find(
        (sector) => String(sector.id) === String(form.custodySectorId)
      ),
    [availableSectors, form.custodySectorId]
  );

  useEffect(() => {
    if (form.custodyType !== "POLICIAL" && (form.policeOfficerId || form.officerLookup)) {
      setForm((prev) => ({
        ...prev,
        policeOfficerId: "",
        officerLookup: "",
      }));
    }
  }, [form.custodyType, form.policeOfficerId, form.officerLookup]);

  useEffect(() => {
    if (form.custodyType !== "SETOR" && form.custodySectorId) {
      setForm((prev) => ({
        ...prev,
        custodySectorId: "",
      }));
    }
  }, [form.custodyType, form.custodySectorId]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOfficerLookupChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      officerLookup: value,
      policeOfficerId: "",
    }));
  };

  const handleOfficerSearch = () => {
    const matchedOfficer = findOfficerByLookup(
      availablePoliceOfficers,
      form.officerLookup
    );

    if (!matchedOfficer) {
      setError("Policial não encontrado para a unidade selecionada.");
      setForm((prev) => ({
        ...prev,
        policeOfficerId: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      policeOfficerId: String(matchedOfficer.id),
      officerLookup: buildOfficerOptionLabel(matchedOfficer),
      postoGrad: matchedOfficer.rank || prev.postoGrad,
      re: matchedOfficer.re_with_digit || prev.re,
      nome: matchedOfficer.full_name || prev.nome,
      ciaEm: matchedOfficer.unit_label || prev.ciaEm,
    }));
  };

  async function loadUnits(access) {
    try {
      const activeUnits = await getUnits();
      setUnits(activeUnits);
      if (!access.canViewAll && access.unitId) {
        setForm((prev) => ({
          ...prev,
          unitId: String(access.unitId),
        }));
      }
    } catch (error) {
      setError(error.message || "Erro ao carregar unidades");
    }
  }

  async function loadSectors() {
    try {
      setSectors(await getSectors());
    } catch (error) {
      setError(error.message || "Erro ao carregar setores");
    }
  }

  async function loadPoliceOfficers() {
    try {
      setPoliceOfficers(await getPoliceOfficers());
    } catch (error) {
      setError(error.message || "Erro ao carregar policiais");
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (form.custodyType === "POLICIAL" && !selectedOfficer) {
        throw new Error("Selecione o policial responsável pelo material.");
      }
      if (form.custodyType === "SETOR" && !selectedSector) {
        throw new Error("Selecione o setor responsável pelo material.");
      }

      const selectedUnit = units.find(
        (unit) => String(unit.id) === String(form.unitId)
      );

      await createMaterialBelicoControleGeral({
        category: "Controle Geral",
        unit_id: Number(form.unitId),
        custody_type: form.custodyType,
        custody_sector_id:
          form.custodyType === "SETOR" && form.custodySectorId
            ? Number(form.custodySectorId)
            : null,
        police_officer_id:
          form.custodyType === "POLICIAL" && selectedOfficer
            ? selectedOfficer.id
            : null,
        ordem: 1,
        posto_grad:
          form.postoGrad ||
          (form.custodyType === "POLICIAL"
            ? selectedOfficer?.rank || ""
            : form.custodyType),
        re:
          form.re ||
          (form.custodyType === "POLICIAL"
            ? selectedOfficer?.re_with_digit || ""
            : form.custodyType),
        nome:
          form.nome ||
          (form.custodyType === "POLICIAL"
            ? selectedOfficer?.full_name || ""
            : form.custodyType === "SETOR"
              ? selectedSector?.name || "Setor"
              : "Reserva da unidade"),
        cia_em:
          form.ciaEm ||
          selectedOfficer?.unit_label ||
          selectedSector?.name ||
          selectedUnit?.display_name ||
          "",
        opm_atual:
          form.opmAtual ||
          selectedUnit?.display_name ||
          selectedUnit?.name ||
          selectedOfficer?.unit_label ||
          "",
        item_name: form.itemName,
        armamento_num_serie: form.armamentoNumeroSerie,
        armamento_patrimonio: form.armamentoPatrimonio,
        municao_lote: form.municaoLote,
        algema_num_serie: form.algemaNumeroSerie,
        algema_patrimonio: form.algemaPatrimonio,
        colete_num_serie: form.coleteNumeroSerie,
        colete_patrimonio: form.coletePatrimonio,
        is_active: true,
      });

      if (onSaved) {
        onSaved();
      } else {
        onBack();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message || "Erro de conexao");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Posto/Grad", field: "postoGrad" },
    { label: "RE", field: "re" },
    { label: "Nome", field: "nome" },
    { label: "CIA/EM", field: "ciaEm" },
    { label: "OPM atual", field: "opmAtual" },
    { label: "Armamento Número de série", field: "armamentoNumeroSerie" },
    { label: "Armamento patrimônio", field: "armamentoPatrimonio" },
    { label: "Munição/Lote", field: "municaoLote" },
    { label: "Algema Número de série", field: "algemaNumeroSerie" },
    { label: "Algema patrimônio", field: "algemaPatrimonio" },
    { label: "Colete Número de série", field: "coleteNumeroSerie" },
    { label: "Colete patrimônio", field: "coletePatrimonio" },
  ];

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Inserir no controle geral</h1>
        <p style={styles.subtitle}>
          Cadastre um novo registro no controle consolidado de material bélico.
        </p>

        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados do controle geral</h2>
        <p style={styles.sectionText}>
          Preencha as informações do responsável atual e dos materiais vinculados.
        </p>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Nome do Material</label>
            <input
              value={form.itemName}
              onChange={handleChange("itemName")}
              placeholder="Digite o nome do material"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Unidade</label>
            <select
              value={form.unitId}
              onChange={handleChange("unitId")}
              style={styles.input}
              required
              disabled={!viewerAccess.canViewAll}
            >
              <option value="">Selecione</option>
              {unitOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Responsabilidade atual</label>
            <select
              value={form.custodyType}
              onChange={handleChange("custodyType")}
              style={styles.input}
            >
              {custodyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {buildCustodySummary({
                custodyType: form.custodyType,
                custodySectorName: selectedSector?.name,
                policeOfficer: selectedOfficer,
              })}
            </small>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>
              {form.custodyType === "SETOR" ? "Setor responsável" : "Setor"}
            </label>
            <select
              value={form.custodySectorId}
              onChange={handleChange("custodySectorId")}
              style={styles.input}
              disabled={form.custodyType !== "SETOR" || !form.unitId}
            >
              <option value="">
                {form.custodyType === "SETOR" ? "Selecione" : "Não se aplica"}
              </option>
              {availableSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {formatSectorLabel(sector)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Policial</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={form.officerLookup}
                onChange={handleOfficerLookupChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleOfficerSearch();
                  }
                }}
                list="controle-geral-officers"
                placeholder="Digite o RE do policial responsável"
                style={{ ...styles.input, flex: 1 }}
                required={form.custodyType === "POLICIAL"}
                disabled={form.custodyType !== "POLICIAL"}
              />
              <button
                type="button"
                onClick={handleOfficerSearch}
                disabled={form.custodyType !== "POLICIAL"}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Pesquisar
              </button>
            </div>
            <datalist id="controle-geral-officers">
              {availablePoliceOfficers.map((officer) => (
                <option key={officer.id} value={buildOfficerOptionLabel(officer)} />
              ))}
            </datalist>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {selectedOfficer
                ? `Policial selecionado: ${buildOfficerSummary(selectedOfficer)}`
                : form.custodyType === "POLICIAL"
                  ? "Selecione um policial ativo da unidade para preencher os campos do controle geral."
                  : "Ative a responsabilidade por policial para preencher automaticamente os dados do efetivo."}
            </small>
          </div>

          {fields.map((item) => (
            <div key={item.field} style={styles.field}>
              <label style={styles.label}>{item.label}</label>
              <input
                value={form[item.field]}
                onChange={handleChange(item.field)}
                style={styles.input}
                required
              />
            </div>
          ))}
        </div>

        <div style={styles.footerActions}>
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MaterialBelicoControleGeralInsert;
