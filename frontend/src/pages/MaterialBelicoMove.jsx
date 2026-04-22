import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { custodyOptions } from "../constants/custodyOptions";
import {
  getMaterialBelicoById,
  moveMaterialBelico,
  transferMaterialBelico,
} from "../services/materialBelicoService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { buildCustodySummary } from "../utils/custodyLabels";
import { resolvePrimarySerial } from "../utils/materialBelicoUtils";
import {
  buildOfficerOptionLabel,
  buildOfficerSummary,
  findOfficerByLookup,
} from "../utils/officerLabels";
import { formatSectorLabel } from "../utils/sectorOptions";
import {
  buildHierarchicalUnitLabelMap,
  buildHierarchicalUnitOptions,
} from "../utils/unitOptions";

function hasQuantityTransfer(category) {
  const normalized = String(category || "").trim().toLowerCase();
  return [
    "munições",
    "municoes",
    "munições químicas",
    "municoes quimicas",
  ].includes(normalized);
}
function MaterialBelicoMove({ itemId, onBack }) {
  const [item, setItem] = useState(null);
  const [units, setUnits] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [movementType, setMovementType] = useState("TRANSFERENCIA");
  const [toUnitId, setToUnitId] = useState("");
  const [toCustodyType, setToCustodyType] = useState("RESERVA_UNIDADE");
  const [toCustodySectorId, setToCustodySectorId] = useState("");
  const [officerLookup, setOfficerLookup] = useState("");
  const [toPoliceOfficerId, setToPoliceOfficerId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void loadUnits();
    void loadSectors();
    void loadPoliceOfficers();
    void loadItem();
  }, [itemId]);
  /* eslint-enable react-hooks/exhaustive-deps */
  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);
  const unitLabelMap = useMemo(() => buildHierarchicalUnitLabelMap(units), [units]);
  const isQuantityTransferMaterial = useMemo(
    () => hasQuantityTransfer(item?.category),
    [item?.category]
  );
  const showTransferQuantityField =
    isQuantityTransferMaterial && movementType === "TRANSFERENCIA";
  const availableBalance = Number(item?.quantity || 0);
  const availablePoliceOfficers = useMemo(() => {
    if (!toUnitId) {
      return [];
    }
    return policeOfficers.filter(
      (officer) => String(officer.unit_id) === String(toUnitId)
    );
  }, [policeOfficers, toUnitId]);
  const availableSectors = useMemo(() => {
    if (!toUnitId) {
      return [];
    }
    return sectors.filter((sector) => String(sector.unit_id) === String(toUnitId));
  }, [sectors, toUnitId]);
  const selectedOfficer = useMemo(
    () =>
      availablePoliceOfficers.find(
        (officer) => String(officer.id) === String(toPoliceOfficerId)
      ),
    [availablePoliceOfficers, toPoliceOfficerId]
  );
  const selectedSector = useMemo(
    () =>
      availableSectors.find(
        (sector) => String(sector.id) === String(toCustodySectorId)
      ),
    [availableSectors, toCustodySectorId]
  );
  const transferQuantityError = useMemo(() => {
    if (!showTransferQuantityField || transferQuantity === "") {
      return "";
    }
    const numericQuantity = Number(transferQuantity);
    if (!Number.isInteger(numericQuantity)) {
      return "Informe uma quantidade inteira.";
    }
    if (numericQuantity <= 0) {
      return "A quantidade deve ser maior que zero.";
    }
    if (numericQuantity > availableBalance) {
      return `Quantidade indisponível. Saldo atual: ${availableBalance} unidades.`;
    }
    return "";
  }, [availableBalance, showTransferQuantityField, transferQuantity]);
  useEffect(() => {
    if (toCustodyType !== "POLICIAL" && (toPoliceOfficerId || officerLookup)) {
      setToPoliceOfficerId("");
      setOfficerLookup("");
    }
  }, [toCustodyType, toPoliceOfficerId, officerLookup]);
  useEffect(() => {
    if (toCustodyType !== "SETOR" && toCustodySectorId) {
      setToCustodySectorId("");
    }
  }, [toCustodyType, toCustodySectorId]);
  const handleOfficerLookupChange = (event) => {
    const value = event.target.value;
    setOfficerLookup(value);
    setToPoliceOfficerId("");
  };
  const handleOfficerSearch = () => {
    const matchedOfficer = findOfficerByLookup(
      availablePoliceOfficers,
      officerLookup
    );
    if (!matchedOfficer) {
      setError("Policial não encontrado para a unidade selecionada.");
      setToPoliceOfficerId("");
      return;
    }
    setOfficerLookup(buildOfficerOptionLabel(matchedOfficer));
    setToPoliceOfficerId(String(matchedOfficer.id));
  };
  const handleTransferQuantityChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    setTransferQuantity(digits);
  };
  async function loadUnits() {
    try {
      setUnits(await getUnits());
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar unidades.");
    }
  }
  async function loadSectors() {
    try {
      setSectors(await getSectors());
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar setores.");
    }
  }
  async function loadPoliceOfficers() {
    try {
      setPoliceOfficers(await getPoliceOfficers());
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar policiais.");
    }
  }
  async function loadItem() {
    try {
      setError("");
      const data = await getMaterialBelicoById(itemId);
      setItem(data);
      setToUnitId(data.unit_id ? String(data.unit_id) : "");
      setToCustodyType(data.custody_type || "RESERVA_UNIDADE");
      setToCustodySectorId(data.custody_sector_id ? String(data.custody_sector_id) : "");
      if (data.police_officer_id) {
        setToPoliceOfficerId(String(data.police_officer_id));
      }
      if (data.assigned_officer_re || data.assigned_officer_name) {
        setOfficerLookup(buildOfficerSummary(data));
      }
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar material.");
      onBack();
    } finally {
      setLoading(false);
    }
  }
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (toCustodyType === "POLICIAL" && !selectedOfficer) {
      setError("Selecione o policial de destino.");
      return;
    }
    if (toCustodyType === "SETOR" && !selectedSector) {
      setError("Selecione o setor responsável de destino.");
      return;
    }
    if (showTransferQuantityField) {
      if (transferQuantity === "") {
        setError("Informe a quantidade a transferir.");
        return;
      }
      if (transferQuantityError) {
        setError(transferQuantityError);
        return;
      }
      if (toCustodyType === "POLICIAL") {
        setError(
          "Transferências com saldo permitem apenas Reserva da unidade ou Setor."
        );
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = showTransferQuantityField
        ? {
            quantidade: Number(transferQuantity),
            unidade_destino_id: toUnitId ? Number(toUnitId) : null,
            setor_destino_id:
              toCustodyType === "SETOR" && toCustodySectorId
                ? Number(toCustodySectorId)
                : null,
            responsabilidade_destino: toCustodyType,
            observacao: details || null,
          }
        : {
            movement_type: movementType,
            to_unit_id: toUnitId ? Number(toUnitId) : null,
            to_custody_type: toCustodyType,
            to_custody_sector_id:
              toCustodyType === "SETOR" && toCustodySectorId
                ? Number(toCustodySectorId)
                : null,
            to_police_officer_id:
              toCustodyType === "POLICIAL" && toPoliceOfficerId
                ? Number(toPoliceOfficerId)
                : null,
            details: details || null,
          };
      const data = showTransferQuantityField
        ? await transferMaterialBelico(itemId, payload)
        : await moveMaterialBelico(itemId, payload);
      if (showTransferQuantityField) {
        const movedQuantity = Number(
          data.quantidade_transferida ?? transferQuantity
        );
        const remainingBalance = Number(
          data.saldo_restante ?? Math.max(availableBalance - movedQuantity, 0)
        );
        const destinationLabel = unitLabelMap[toUnitId] || "Unidade de destino";
        setItem((current) =>
          current
            ? {
                ...current,
                quantity: remainingBalance,
                is_active: remainingBalance > 0,
              }
            : current
        );
        window.alert(
          `${data.message || "Transferência realizada com sucesso!"} ${movedQuantity} unidades transferidas para ${destinationLabel}. Saldo restante na origem: ${remainingBalance} unidades.`
        );
        onBack();
        return;
      }
      onBack();
    } catch (submitError) {
      setError(submitError.message || "Erro ao movimentar material bélico.");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          Carregando material bélico e preparando a movimentação...
        </div>
      </div>
    );
  }
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Movimentar material bélico</h1>
        <p style={styles.subtitle}>
          A origem fica travada e você define apenas o destino e a nova
          responsabilidade.
        </p>
        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>
        </div>
      </section>
      {error && <div style={styles.errorBox}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados da movimentação</h2>
        <p style={styles.sectionText}>
          Altere apenas o destino do material e o responsável atual, quando
          necessário.
        </p>
        <div style={styles.infoBox}>
          A origem permanece registrada como referência histórica. Ajuste apenas
          o destino e a nova responsabilidade do material.
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--app-surface-muted)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div style={styles.label}>Material atual</div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {item?.item_name || item?.category || "Material bélico"}
            </div>
            <div
              style={{
                marginTop: "6px",
                color: "var(--app-text-muted)",
                fontSize: "0.92rem",
              }}
            >
              Série/Lote: {resolvePrimarySerial(item) || "Não informado"}
            </div>
            {showTransferQuantityField ? (
              <div
                style={{
                  marginTop: "6px",
                  color: "var(--app-text-muted)",
                  fontSize: "0.92rem",
                }}
              >
                Saldo disponível: {availableBalance} unidades
              </div>
            ) : null}
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--app-surface-muted)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div style={styles.label}>Origem</div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {item?.unit_label || "-"}
            </div>
            <div
              style={{
                marginTop: "6px",
                color: "var(--app-text-muted)",
                fontSize: "0.92rem",
              }}
            >
              Responsabilidade:{" "}
              {buildCustodySummary({
                custodyType: item?.custody_type,
                custodySectorName: item?.custody_sector_name,
                policeOfficerRe: item?.assigned_officer_re,
                policeOfficerName: item?.assigned_officer_name,
              })}
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--app-surface-muted)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div style={styles.label}>Destino</div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {unitLabelMap[toUnitId] || "Selecione a unidade"}
            </div>
            <div
              style={{
                marginTop: "6px",
                color: "var(--app-text-muted)",
                fontSize: "0.92rem",
              }}
            >
              Responsabilidade:{" "}
              {buildCustodySummary({
                custodyType: toCustodyType,
                custodySectorName: selectedSector?.name,
                policeOfficer: selectedOfficer,
              })}
            </div>
          </div>
        </div>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Tipo de movimentação</label>
            <select
              value={movementType}
              onChange={(event) => setMovementType(event.target.value)}
              style={styles.input}
            >
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Unidade de origem</label>
            <input
              type="text"
              value={item?.unit_label || ""}
              style={styles.input}
              disabled
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Responsabilidade de origem</label>
            <input
              type="text"
              value={buildCustodySummary({
                custodyType: item?.custody_type,
                custodySectorName: item?.custody_sector_name,
                policeOfficerRe: item?.assigned_officer_re,
                policeOfficerName: item?.assigned_officer_name,
              })}
              style={styles.input}
              disabled
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Unidade de destino</label>
            <select
              value={toUnitId}
              onChange={(event) => setToUnitId(event.target.value)}
              required
              style={styles.input}
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
            <label style={styles.label}>Responsabilidade destino</label>
            <select
              value={toCustodyType}
              onChange={(event) => setToCustodyType(event.target.value)}
              style={styles.input}
            >
              {custodyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>
              {toCustodyType === "SETOR" ? "Setor destino" : "Setor"}
            </label>
            <select
              value={toCustodySectorId}
              onChange={(event) => setToCustodySectorId(event.target.value)}
              style={styles.input}
              disabled={!toUnitId || toCustodyType !== "SETOR"}
            >
              <option value="">
                {toCustodyType === "SETOR" ? "Selecione" : "Não se aplica"}
              </option>
              {availableSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {formatSectorLabel(sector)}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.fieldFull}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: showTransferQuantityField
                  ? "minmax(0, 2fr) minmax(220px, 1fr)"
                  : "1fr",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <div style={styles.field}>
                <label style={styles.label}>Policial destino</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={officerLookup}
                    onChange={handleOfficerLookupChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleOfficerSearch();
                      }
                    }}
                    list="material-belico-move-officers"
                    placeholder="Digite o RE do policial responsável"
                    style={{ ...styles.input, flex: 1 }}
                    disabled={toCustodyType !== "POLICIAL"}
                  />
                  <button
                    type="button"
                    onClick={handleOfficerSearch}
                    disabled={toCustodyType !== "POLICIAL"}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                  >
                    Pesquisar
                  </button>
                </div>
                <datalist id="material-belico-move-officers">
                  {availablePoliceOfficers.map((officer) => (
                    <option
                      key={officer.id}
                      value={buildOfficerOptionLabel(officer)}
                    />
                  ))}
                </datalist>
                <small
                  style={{
                    color: "var(--app-text-muted)",
                    fontSize: "0.88rem",
                  }}
                >
                  {selectedOfficer
                    ? `Policial selecionado: ${buildOfficerSummary(selectedOfficer)}`
                    : toCustodyType === "POLICIAL"
                      ? "Pesquise por RE ou nome para definir o policial de destino."
                      : "Ative a responsabilidade por policial para definir uma pessoa."}
                </small>
              </div>
              {showTransferQuantityField ? (
                <div style={styles.field}>
                  <label style={styles.label}>Quantidade a Transferir</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={transferQuantity}
                    onChange={handleTransferQuantityChange}
                    placeholder="Digite a quantidade"
                    style={styles.input}
                  />
                  <small
                    style={{
                      color: "var(--app-text-muted)",
                      fontSize: "0.88rem",
                    }}
                  >
                    Saldo disponível: {availableBalance} unidades
                  </small>
                  {transferQuantityError ? (
                    <small
                      style={{
                        color: "var(--app-error-text)",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                      }}
                    >
                      {transferQuantityError}
                    </small>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div style={styles.fieldFull}>
            <label style={styles.label}>Detalhes</label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              style={styles.textarea}
              placeholder="Motivo ou observação da transferência"
            />
          </div>
        </div>
        <div style={styles.footerActions}>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {submitting ? "Salvando..." : "Salvar movimentação"}
          </button>
        </div>
      </form>
    </div>
  );
}
export default MaterialBelicoMove;
