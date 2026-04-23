import { Suspense, lazy, useEffect, useState } from "react";

import Layout from "./components/Layout";
import { appShellStyles, themePalettes } from "./components/appShellStyles";
import {
  buildNavigationItemsForViewer,
  getModuleCards,
  resolveModuleKeyForPage,
} from "./config/navigation";
import { getCurrentSession, logoutUser } from "./services/authService";
import {
  clearViewerAccess,
  filterNavigationItems,
  persistViewerAccess,
  readViewerAccess,
} from "./utils/authAccess";

const EditItem = lazy(() => import("./pages/EditItem"));
const EditPoliceOfficer = lazy(() => import("./pages/EditPoliceOfficer"));
const EditTpdTalonario = lazy(() => import("./pages/EditTpdTalonario"));
const EditUser = lazy(() => import("./pages/EditUser"));
const ArmamentoProcessPage = lazy(() => import("./pages/ArmamentoProcessPage"));
const ApafProcessPage = lazy(() => import("./pages/ApafProcessPage"));
const AuditEventsPage = lazy(() => import("./pages/AuditEventsPage"));
const CrafProcessPage = lazy(() => import("./pages/CrafProcessPage"));
const BlocoLpPage = lazy(() => import("./pages/BlocoLpPage"));
const BlocoLsvPage = lazy(() => import("./pages/BlocoLsvPage"));
const ControleEfetivoPage = lazy(() => import("./pages/ControleEfetivoPage"));
const ControleVelocidadeNoturnoPage = lazy(() => import("./pages/ControleVelocidadeNoturnoPage"));
const EapPage = lazy(() => import("./pages/EapPage"));
const PlanilhaAcidenteViaturaPage = lazy(() => import("./pages/PlanilhaAcidenteViaturaPage"));
const P5BirthdaysPage = lazy(() => import("./pages/P5BirthdaysPage"));
const CopsPage = lazy(() => import("./pages/CopsPage"));
const MapaForcaPage = lazy(() => import("./pages/MapaForcaPage"));
const FleetGeneralControlPage = lazy(() => import("./pages/FleetGeneralControlPage"));
const FleetHub = lazy(() => import("./pages/FleetHub"));
const FleetModule = lazy(() => import("./pages/FleetModule"));
const FleetMovementsList = lazy(() => import("./pages/FleetMovementsList"));
const FleetVehicleMove = lazy(() => import("./pages/FleetVehicleMove"));
const FleetVehiclesPage = lazy(() => import("./pages/FleetVehiclesPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const InactiveItems = lazy(() => import("./pages/InactiveItems"));
const InstitutionalModulePage = lazy(() => import("./pages/InstitutionalModulePage"));
const ForcePasswordChangePage = lazy(() => import("./pages/ForcePasswordChangePage"));
const Items = lazy(() => import("./pages/Items"));
const Login = lazy(() => import("./pages/Login"));
const Logs = lazy(() => import("./pages/Logs"));
const MaterialBelico = lazy(() => import("./pages/MaterialBelico"));
const MaterialBelicoControleGeral = lazy(() => import("./pages/MaterialBelicoControleGeral"));
const MaterialBelicoControleGeralInsert = lazy(() => import("./pages/MaterialBelicoControleGeralInsert"));
const MaterialBelicoControleGeralList = lazy(() => import("./pages/MaterialBelicoControleGeralList"));
const MaterialBelicoEdit = lazy(() => import("./pages/MaterialBelicoEdit"));
const MaterialBelicoInsert = lazy(() => import("./pages/MaterialBelicoInsert"));
const MaterialBelicoList = lazy(() => import("./pages/MaterialBelicoList"));
const MaterialBelicoMove = lazy(() => import("./pages/MaterialBelicoMove"));
const MaterialBelicoMovementsList = lazy(() => import("./pages/MaterialBelicoMovementsList"));
const MaterialBelicoModule = lazy(() => import("./pages/MaterialBelicoModule"));
const ModuleCardsPage = lazy(() => import("./pages/ModuleCardsPage"));
const Movement = lazy(() => import("./pages/Movement"));
const MovementsList = lazy(() => import("./pages/MovementsList"));
const MovePoliceOfficer = lazy(() => import("./pages/MovePoliceOfficer"));
const NewItem = lazy(() => import("./pages/NewItem"));
const NewPoliceOfficer = lazy(() => import("./pages/NewPoliceOfficer"));
const NewTpdTalonario = lazy(() => import("./pages/NewTpdTalonario"));
const NewUser = lazy(() => import("./pages/NewUser"));
const PoliceOfficers = lazy(() => import("./pages/PoliceOfficers"));
const PoliceOfficerMovementsList = lazy(() => import("./pages/PoliceOfficerMovementsList"));
const RomaneioMedidasPage = lazy(() => import("./pages/RomaneioMedidasPage"));
const RanchoPage = lazy(() => import("./pages/RanchoPage"));
const QuinquenioPage = lazy(() => import("./pages/QuinquenioPage"));
const Sectors = lazy(() => import("./pages/Sectors"));
const StockEntriesPage = lazy(() => import("./pages/StockEntriesPage"));
const StockExitsPage = lazy(() => import("./pages/StockExitsPage"));
const StockMaintenanceHub = lazy(() => import("./pages/StockMaintenanceHub"));
const StockMaintenanceOrdersPage = lazy(() => import("./pages/StockMaintenanceOrdersPage"));
const StockProductsPage = lazy(() => import("./pages/StockProductsPage"));
const StockReportPage = lazy(() => import("./pages/StockReportPage"));
const StockSuppliersPage = lazy(() => import("./pages/StockSuppliersPage"));
const TpdTalonarioList = lazy(() => import("./pages/TpdTalonarioList"));
const Units = lazy(() => import("./pages/Units"));
const Users = lazy(() => import("./pages/Users"));
const WeaponProcessModule = lazy(() => import("./pages/WeaponProcessModule"));

const BELICO_PAGE_LABELS = {
  "belico-coletes": "Coletes",
  "belico-espargidores": "Espargidores",
  "belico-armas": "Armas",
  "belico-algemas": "Algemas",
  "belico-municoes": "Munições",
  "belico-municoes-quimicas": "Munições químicas",
  "belico-tonfa": "Tonfa/Cassetetes",
  "belico-taser": "TASER",
  "belico-cdc": "Material de CDC",
};

const WEAPON_PROCESS_MODULES = {
  "processos-armas/apaf": "Solicitação de APAF",
  "processos-armas/craf": "CRAF",
  "processos-armas/aquisicao": "Aquisição de Arma",
  "processos-armas/transferencia": "Transferência de Arma",
  "processos-armas/porte-outro-estado": "Aut. Portar Arma Outro Estado",
  "processos-armas/exclusao-furto-roubo": "Exclusão de Arma: Furto/Roubo",
  "processos-armas/baixa-armamento": "Baixa de Armamento",
  "processos-armas/regularizacao": "Regularização Arma/Munição",
};

const RESERVED_PAGE_DETAILS = {
  "p1/bloco-quinquenio": {
    highlights: [
      "Área reservada para gestão e acompanhamento do bloco de quinquênio.",
      "Pode evoluir para cálculos, marcos temporais, pendências e relatórios por período.",
      "A navegação já está pronta para uma futura tela de controle mais executiva e operacional.",
    ],
  },
  "p1/bloco-lp": {
    highlights: [
      "Área reservada para gestão e acompanhamento do bloco LP.",
      "A navegação já está pronta para operar o controle de Licença Prêmio já estruturado no sistema.",
      "A evolução futura pode ampliar filtros, relatórios e indicadores sem mexer na base já cadastrada.",
    ],
  },
  "p1/bloco-lsv": {
    highlights: [
      "Área reservada para gestão e acompanhamento do bloco LSV.",
      "O card já foi separado da rotina de Licença Prêmio para implementação dedicada em etapa futura.",
      "A navegação já está pronta para receber a tela funcional quando você decidir ativá-la.",
    ],
  },
  "p1/fruicao-lic-premio": {
    highlights: [
      "Área reservada para gestão e acompanhamento da fruição de Licença Prêmio.",
      "Pode evoluir para espelho mensal, vínculos por policial e relatórios operacionais do P1.",
      "A navegação já está pronta para receber a tela funcional quando você decidir ativá-la.",
    ],
  },
  "p1/bloco-mvm": {
    highlights: [
      "Área reservada para gestão e acompanhamento do bloco MVM.",
      "Pode evoluir para controle por policial, ciclos, filtros e relatórios por unidade.",
      "A navegação já está pronta para receber a tela funcional quando você decidir ativá-la.",
    ],
  },
  "module/p2/painel": {
    highlights: [
      "Espaço reservado para painéis, consultas e fluxos táticos do P2.",
      "Pode evoluir para monitoramento, análise e registro operacional da Inteligência.",
    ],
  },
  "module/p3/painel": {
    highlights: [
      "Espaço reservado para indicadores, consolidações e relatórios do P3.",
      "Pode evoluir para painéis estatísticos, séries históricas e exportações gerenciais.",
    ],
  },
  "module/p5/painel": {
    highlights: [
      "Espaço reservado para comunicação institucional, agendas e ações do P5.",
      "Pode evoluir para clipping, eventos, campanhas e histórico de publicações.",
    ],
  },
  "module/pjmd/painel": {
    highlights: [
      "Espaço reservado para rotinas disciplinares, consultas e acompanhamento processual.",
      "Pode evoluir para registros formais, prazos e trilhas de despacho do setor.",
    ],
  },
  "module/uge/painel": {
    highlights: [
      "Espaço reservado para convênios, execução financeira e rotinas administrativas.",
      "Pode evoluir para controles de documentos, repasses e relatórios da UGE.",
    ],
  },
  "module/stcor/painel": {
    highlights: [
      "Espaço reservado para acompanhamento operacional e coordenação da Sala de Operações.",
      "Pode evoluir para despacho, ocorrências, escalas e integração com comunicações.",
    ],
  },
};

function App() {
  const [themeMode, setThemeMode] = useState(localStorage.getItem("themeMode") || "light");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedPoliceOfficerId, setSelectedPoliceOfficerId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedTpdTalonarioId, setSelectedTpdTalonarioId] = useState(null);
  const [selectedFleetVehicleId, setSelectedFleetVehicleId] = useState(null);
  const [fleetReturnPage, setFleetReturnPage] = useState("frota/viaturas/consultar");
  const [selectedBelicoItemId, setSelectedBelicoItemId] = useState(null);
  const [belicoReturnPage, setBelicoReturnPage] = useState("belico-list");
  const [belicoCategoryKey, setBelicoCategoryKey] = useState(null);

  const [viewerAccess, setViewerAccess] = useState(readViewerAccess());
  const visibleNavigationItems = filterNavigationItems(
    buildNavigationItemsForViewer(viewerAccess),
    viewerAccess
  );
  const activeNavKey = resolveModuleKeyForPage(currentPage);

  useEffect(() => {
    const root = document.documentElement;
    const palette = themePalettes[themeMode] || themePalettes.light;

    Object.entries(palette).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });

    document.body.style.backgroundColor = palette["--app-bg"];
    document.body.style.color = palette["--app-text"];
    root.style.colorScheme = themeMode === "dark" ? "dark" : "light";
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      try {
        const session = await getCurrentSession();
        if (!mounted) return;
        persistViewerAccess(session);
        setViewerAccess(readViewerAccess());
        setIsAuthenticated(true);
      } catch {
        if (!mounted) return;
        clearViewerAccess();
        setViewerAccess(readViewerAccess());
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearViewerAccess();
      setViewerAccess(readViewerAccess());
      setIsAuthenticated(false);
      setCurrentPage("home");
    };

    window.addEventListener("erp:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("erp:auth-expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const visibleKeys = new Set(visibleNavigationItems.map((item) => item.key));
    if (activeNavKey && !visibleKeys.has(activeNavKey)) {
      setCurrentPage("home");
      return;
    }

    if (!activeNavKey && currentPage !== "home" && currentPage !== "dashboard") {
      setCurrentPage("home");
    }
  }, [activeNavKey, currentPage, isAuthenticated, visibleNavigationItems]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if ((currentPage === "home" || currentPage === "dashboard") && visibleNavigationItems.length === 1) {
      const [singleModule] = visibleNavigationItems;
      if (singleModule?.key) {
        setCurrentPage(singleModule.key);
      }
    }
  }, [currentPage, isAuthenticated, visibleNavigationItems]);

  useEffect(() => {
    if (BELICO_PAGE_LABELS[currentPage]) {
      setBelicoCategoryKey(currentPage);
    }
  }, [currentPage]);

  const handleLogout = () => {
    void logoutUser().catch(() => undefined).finally(() => {
      clearViewerAccess();
      setViewerAccess(readViewerAccess());
      setIsAuthenticated(false);
      setCurrentPage("home");
    });
  };

  const navigateToPage = (nextPage) => {
    if (BELICO_PAGE_LABELS[nextPage]) {
      setBelicoCategoryKey(nextPage);
    }
    setCurrentPage(nextPage);
  };

  const handleToggleTheme = () => {
    setThemeMode((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  if (authLoading) {
    return <PageLoadingFallback message="Verificando sessão..." auth />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoadingFallback message="Carregando acesso..." auth />}>
        <Login
          onLoginSuccess={(session) => {
            persistViewerAccess(session);
            setViewerAccess(readViewerAccess());
            setIsAuthenticated(true);
          }}
        />
      </Suspense>
    );
  }

  if (viewerAccess.rawSession?.require_password_change) {
    return (
      <Suspense fallback={<PageLoadingFallback message="Carregando segurança..." auth />}>
        <ForcePasswordChangePage
          session={viewerAccess.rawSession}
          onPasswordChanged={(session) => {
            persistViewerAccess(session);
            setViewerAccess(readViewerAccess());
          }}
          onLogout={() => {
            clearViewerAccess();
            setViewerAccess(readViewerAccess());
            setIsAuthenticated(false);
            setCurrentPage("home");
          }}
        />
      </Suspense>
    );
  }

  const selectedBelicoCategoryKey = BELICO_PAGE_LABELS[currentPage]
    ? currentPage
    : belicoCategoryKey;
  const resolvedBelicoCategoryLabel = selectedBelicoCategoryKey
    ? BELICO_PAGE_LABELS[selectedBelicoCategoryKey] || "Material Bélico"
    : "Material Bélico";

  let content = null;

  if (currentPage === "home" || currentPage === "dashboard") {
    content = <HomePage displayName={viewerAccess.displayName} />;
  }

  const moduleCardsConfig = getModuleCards(currentPage);
  if (!content && moduleCardsConfig) {
    content = (
      <ModuleCardsPage
        title={moduleCardsConfig.title}
        subtitle={moduleCardsConfig.subtitle}
        cards={filterNavigationItems(moduleCardsConfig.cards, viewerAccess)}
        onNavigate={navigateToPage}
        onBack={
          currentPage === "logistica/romaneio" || currentPage === "processos-armas"
            ? () => navigateToPage("module/p4")
            : undefined
        }
        breadcrumb={
          currentPage === "logistica/romaneio"
            ? "Início › P4 - Logística/Frota › Romaneio"
            : undefined
        }
      />
    );
  }

  if (currentPage === "items") {
    content = (
      <Items
        onBack={() => navigateToPage("module/p4")}
        onNewItem={() => navigateToPage("new-item")}
        onEditItem={(id) => {
          setSelectedItemId(id);
          navigateToPage("edit-item");
        }}
        onMoveItem={(id) => {
          setSelectedItemId(id);
          navigateToPage("movement");
        }}
        refreshKey={refreshKey}
      />
    );
  }

  if (currentPage === "new-item") {
    content = (
      <NewItem
        onBack={() => {
          setRefreshKey((current) => current + 1);
          navigateToPage("items");
        }}
      />
    );
  }

  if (currentPage === "edit-item") {
    content = (
      <EditItem
        itemId={selectedItemId}
        onBack={() => {
          setRefreshKey((current) => current + 1);
          navigateToPage("items");
        }}
      />
    );
  }

  if (currentPage === "movement") {
    content = (
      <Movement
        itemId={selectedItemId}
        onBack={() => {
          setRefreshKey((current) => current + 1);
          navigateToPage("items");
        }}
      />
    );
  }

  if (currentPage === "logistica/estoque-manutencao") {
    content = (
      <StockMaintenanceHub
        onNavigate={navigateToPage}
        onBack={() => navigateToPage("module/p4")}
      />
    );
  }

  if (currentPage === "estoque/entradas") {
    content = <StockEntriesPage onBack={() => navigateToPage("logistica/estoque-manutencao")} />;
  }

  if (currentPage === "estoque/saidas") {
    content = <StockExitsPage onBack={() => navigateToPage("logistica/estoque-manutencao")} />;
  }

  if (currentPage === "estoque/relatorio") {
    content = <StockReportPage onBack={() => navigateToPage("logistica/estoque-manutencao")} />;
  }

  if (currentPage === "estoque/produtos") {
    content = <StockProductsPage onBack={() => navigateToPage("logistica/estoque-manutencao")} />;
  }

  if (currentPage === "estoque/fornecedores") {
    content = <StockSuppliersPage onBack={() => navigateToPage("logistica/estoque-manutencao")} />;
  }

  if (currentPage === "estoque/manutencao") {
    content = <StockMaintenanceOrdersPage onBack={() => navigateToPage("logistica/estoque-manutencao")} />;
  }

  if (currentPage === "logistica/tpd-talonario") {
    content = (
      <TpdTalonarioList
        onBack={() => navigateToPage("module/p4")}
        onNewItem={() => navigateToPage("logistica/tpd-talonario/novo")}
        onEditItem={(id) => {
          setSelectedTpdTalonarioId(id);
          navigateToPage("logistica/tpd-talonario/editar");
        }}
        refreshKey={refreshKey}
      />
    );
  }

  if (currentPage === "logistica/tpd-talonario/novo") {
    content = (
      <NewTpdTalonario
        onBack={() => {
          setRefreshKey((current) => current + 1);
          navigateToPage("logistica/tpd-talonario");
        }}
      />
    );
  }

  if (currentPage === "logistica/tpd-talonario/editar") {
    content = (
      <EditTpdTalonario
        itemId={selectedTpdTalonarioId}
        onBack={() => {
          setRefreshKey((current) => current + 1);
          navigateToPage("logistica/tpd-talonario");
        }}
      />
    );
  }

  if (currentPage === "material-belico") {
    content = <MaterialBelico onNavigate={navigateToPage} onBack={() => navigateToPage("module/p4")} />;
  }

  if (currentPage === "belico-controle-geral") {
    content = (
      <MaterialBelicoControleGeral
        onInsert={() => navigateToPage("belico-controle-geral-insert")}
        onConsult={() => navigateToPage("belico-controle-geral-list")}
        onBack={() => navigateToPage("material-belico")}
      />
    );
  }

  if (currentPage === "belico-controle-geral-insert") {
    content = (
      <MaterialBelicoControleGeralInsert
        onBack={() => navigateToPage("belico-controle-geral")}
        onSaved={() => navigateToPage("belico-controle-geral-list")}
      />
    );
  }

  if (currentPage === "belico-controle-geral-list") {
    content = (
      <MaterialBelicoControleGeralList
        onBack={() => navigateToPage("belico-controle-geral")}
        onEditItem={(id) => {
          setSelectedBelicoItemId(id);
          setBelicoReturnPage("belico-controle-geral-list");
          navigateToPage("belico-edit");
        }}
        onMoveItem={(id) => {
          setSelectedBelicoItemId(id);
          setBelicoReturnPage("belico-controle-geral-list");
          navigateToPage("belico-move");
        }}
      />
    );
  }

  if (BELICO_PAGE_LABELS[currentPage] && currentPage !== "belico-controle-geral") {
    content = (
      <MaterialBelicoModule
        categoryKey={currentPage}
        categoryLabel={BELICO_PAGE_LABELS[currentPage]}
        onBack={() => navigateToPage("material-belico")}
        onInsert={() => {
          setBelicoCategoryKey(currentPage);
          navigateToPage("belico-insert");
        }}
        onConsult={() => {
          setBelicoCategoryKey(currentPage);
          navigateToPage("belico-list");
        }}
      />
    );
  }

  if (currentPage === "belico-insert") {
    content = (
      <MaterialBelicoInsert
        category={resolvedBelicoCategoryLabel}
        onBack={() => navigateToPage(selectedBelicoCategoryKey || "material-belico")}
      />
    );
  }

  if (currentPage === "belico-list") {
    content = (
      <MaterialBelicoList
        category={resolvedBelicoCategoryLabel}
        onEditItem={(id) => {
          setSelectedBelicoItemId(id);
          setBelicoReturnPage("belico-list");
          navigateToPage("belico-edit");
        }}
        onMoveItem={(id) => {
          setSelectedBelicoItemId(id);
          setBelicoReturnPage("belico-list");
          navigateToPage("belico-move");
        }}
        onBack={() => navigateToPage(selectedBelicoCategoryKey || "material-belico")}
      />
    );
  }

  if (currentPage === "belico-move") {
    content = <MaterialBelicoMove itemId={selectedBelicoItemId} onBack={() => navigateToPage(belicoReturnPage)} />;
  }

  if (currentPage === "belico-edit") {
    content = <MaterialBelicoEdit itemId={selectedBelicoItemId} onBack={() => navigateToPage(belicoReturnPage)} />;
  }

  if (currentPage === "belico-movimentacoes") {
    content = <MaterialBelicoMovementsList onBack={() => navigateToPage("material-belico")} />;
  }

  if (currentPage === "logistica/romaneio") {
    content = (
      <ModuleCardsPage
        title="Romaneio"
        subtitle="Selecione um módulo para acessar"
        cards={filterNavigationItems(getModuleCards("logistica/romaneio")?.cards || [], viewerAccess)}
        onNavigate={navigateToPage}
        onBack={() => navigateToPage("module/p4")}
        breadcrumb="Início › P4 - Logística/Frota › Romaneio"
      />
    );
  }

  if (currentPage === "romaneio/cadastro-medidas") {
    content = (
      <RomaneioMedidasPage
        onBack={() => navigateToPage("logistica/romaneio")}
        onEditPoliceOfficer={(id) => {
          setSelectedPoliceOfficerId(id);
          navigateToPage("edit-police-officer");
        }}
      />
    );
  }

  if (currentPage === "frota") {
    content = <FleetHub onNavigate={navigateToPage} onBack={() => navigateToPage("module/p4")} />;
  }

  const weaponProcessBaseKey = Object.keys(WEAPON_PROCESS_MODULES).find(
    (baseKey) =>
      currentPage === `${baseKey}/modulo` ||
      currentPage === `${baseKey}/cadastrar` ||
      currentPage === `${baseKey}/consultar`
  );

  if (currentPage === "frota/viaturas/modulo") {
    content = (
      <FleetModule
        categoryLabel="Cadastro de Viaturas"
        onBack={() => navigateToPage("frota")}
        onInsert={() => navigateToPage("frota/viaturas/cadastrar")}
        onConsult={() => navigateToPage("frota/viaturas/consultar")}
        onMovements={() => navigateToPage("frota/movimentacoes")}
      />
    );
  }

  if (currentPage === "frota/viaturas/cadastrar" || currentPage === "frota/viaturas/consultar") {
    content = (
      <FleetVehiclesPage
        category="VIATURA_04_RODAS"
        title="Frota - Cadastro de Viaturas"
        description="Cadastre as viaturas conforme a ficha operacional da frota, com contrato, revisão, emprego e vínculo por unidade."
        entityLabel="viatura"
        startWithForm={currentPage === "frota/viaturas/cadastrar"}
        onMoveItem={(id) => {
          setSelectedFleetVehicleId(id);
          setFleetReturnPage("frota/viaturas/consultar");
          navigateToPage("frota/move");
        }}
        onBack={() => navigateToPage("frota/viaturas/modulo")}
      />
    );
  }

  if (currentPage === "frota/motocicletas/modulo") {
    content = (
      <FleetModule
        categoryLabel="Motocicletas"
        onBack={() => navigateToPage("frota")}
        onInsert={() => navigateToPage("frota/motocicletas/cadastrar")}
        onConsult={() => navigateToPage("frota/motocicletas/consultar")}
        onMovements={() => navigateToPage("frota/movimentacoes")}
      />
    );
  }

  if (currentPage === "frota/motocicletas/cadastrar" || currentPage === "frota/motocicletas/consultar") {
    content = (
      <FleetVehiclesPage
        category="MOTOCICLETA"
        title="Frota - Motocicletas"
        description="Cadastre e organize as motocicletas da unidade usando a mesma estrutura modular da frota."
        entityLabel="motocicleta"
        startWithForm={currentPage === "frota/motocicletas/cadastrar"}
        onMoveItem={(id) => {
          setSelectedFleetVehicleId(id);
          setFleetReturnPage("frota/motocicletas/consultar");
          navigateToPage("frota/move");
        }}
        onBack={() => navigateToPage("frota/motocicletas/modulo")}
      />
    );
  }

  if (currentPage === "frota/controle-geral/modulo") {
    content = (
      <FleetModule
        categoryLabel="Controle Geral de Viaturas"
        onBack={() => navigateToPage("frota")}
        onInsert={() => navigateToPage("frota/controle-geral/cadastrar")}
        onConsult={() => navigateToPage("frota/controle-geral/consultar")}
        onMovements={() => navigateToPage("frota/movimentacoes")}
      />
    );
  }

  if (currentPage === "frota/controle-geral/cadastrar" || currentPage === "frota/controle-geral/consultar") {
    content = (
      <FleetGeneralControlPage
        startWithForm={currentPage === "frota/controle-geral/cadastrar"}
        onMoveItem={(id) => {
          setSelectedFleetVehicleId(id);
          setFleetReturnPage("frota/controle-geral/consultar");
          navigateToPage("frota/move");
        }}
        onBack={() => navigateToPage("frota/controle-geral/modulo")}
      />
    );
  }

  if (currentPage === "frota/armamentos/modulo") {
    content = (
      <FleetModule
        categoryLabel="Controle de Processo de Armamentos"
        onBack={() => navigateToPage("processos-armas")}
        onInsert={() => navigateToPage("frota/armamentos/cadastrar")}
        onConsult={() => navigateToPage("frota/armamentos/consultar")}
        onMovements={() => navigateToPage("frota/armamentos/consultar")}
      />
    );
  }

  if (currentPage === "frota/armamentos/cadastrar" || currentPage === "frota/armamentos/consultar") {
    content = (
      <ArmamentoProcessPage
        startWithForm={currentPage === "frota/armamentos/cadastrar"}
        onBack={() => navigateToPage("frota/armamentos/modulo")}
      />
    );
  }

  if (weaponProcessBaseKey && currentPage.endsWith("/modulo")) {
    content = (
      <WeaponProcessModule
        categoryLabel={WEAPON_PROCESS_MODULES[weaponProcessBaseKey]}
        onBack={() => navigateToPage("processos-armas")}
        onInsert={() => navigateToPage(`${weaponProcessBaseKey}/cadastrar`)}
        onConsult={() => navigateToPage(`${weaponProcessBaseKey}/consultar`)}
      />
    );
  }

  const isImplementedWeaponProcessPage =
    currentPage === "processos-armas/apaf/cadastrar" ||
    currentPage === "processos-armas/apaf/consultar" ||
    currentPage === "processos-armas/craf/cadastrar" ||
    currentPage === "processos-armas/craf/consultar";

  if (
    weaponProcessBaseKey &&
    !isImplementedWeaponProcessPage &&
    (currentPage.endsWith("/cadastrar") || currentPage.endsWith("/consultar"))
  ) {
    content = (
      <InstitutionalModulePage
        title={WEAPON_PROCESS_MODULES[weaponProcessBaseKey]}
        description="Submódulo reservado dentro de Processos de Armas."
        highlights={[
          "A navegação do processo já foi separada do card principal do P4.",
          "O submódulo foi ligado ao novo hub de Processos de Armas.",
          "A evolução funcional deste processo pode continuar agora sem misturar Frota e Material Bélico.",
        ]}
        onBack={() => navigateToPage(`${weaponProcessBaseKey}/modulo`)}
      />
    );
  }

  if (currentPage === "processos-armas/apaf/cadastrar" || currentPage === "processos-armas/apaf/consultar") {
    content = (
      <ApafProcessPage
        startWithForm={currentPage === "processos-armas/apaf/cadastrar"}
        onBack={() => navigateToPage("processos-armas/apaf/modulo")}
      />
    );
  }

  if (currentPage === "processos-armas/craf/cadastrar" || currentPage === "processos-armas/craf/consultar") {
    content = (
      <CrafProcessPage
        startWithForm={currentPage === "processos-armas/craf/cadastrar"}
        onBack={() => navigateToPage("processos-armas/craf/modulo")}
      />
    );
  }

  if (currentPage === "frota/outros/modulo") {
    content = (
      <FleetModule
        categoryLabel="Outros"
        onBack={() => navigateToPage("frota")}
        onInsert={() => navigateToPage("frota/outros/cadastrar")}
        onConsult={() => navigateToPage("frota/outros/consultar")}
        onMovements={() => navigateToPage("frota/movimentacoes")}
      />
    );
  }

  if (currentPage === "frota/outros/cadastrar" || currentPage === "frota/outros/consultar") {
    content = (
      <FleetVehiclesPage
        category="OUTROS"
        title="Frota - Outros"
        description="Use este submódulo para categorias complementares da frota que não se encaixam nos grupos principais."
        entityLabel="registro da frota"
        startWithForm={currentPage === "frota/outros/cadastrar"}
        onMoveItem={(id) => {
          setSelectedFleetVehicleId(id);
          setFleetReturnPage("frota/outros/consultar");
          navigateToPage("frota/move");
        }}
        onBack={() => navigateToPage("frota/outros/modulo")}
      />
    );
  }

  if (currentPage === "frota/move") {
    content = <FleetVehicleMove vehicleId={selectedFleetVehicleId} onBack={() => navigateToPage(fleetReturnPage)} />;
  }

  if (currentPage === "frota/movimentacoes") {
    content = <FleetMovementsList onBack={() => navigateToPage("frota")} />;
  }

  if (currentPage === "cops") {
    content = <CopsPage onBack={() => navigateToPage("module/p4")} />;
  }

  if (currentPage === "mapa-forca") {
    content = <MapaForcaPage onBack={() => navigateToPage("module/p4")} />;
  }

  if (currentPage === "inactive-items") {
    content = <InactiveItems onBack={() => navigateToPage("module/p4")} />;
  }

  if (currentPage === "movements") {
    content = <MovementsList onBack={() => navigateToPage("module/p4")} />;
  }

  if (currentPage === "logs") {
    content = <Logs onBack={() => navigateToPage("module/p4")} />;
  }

  if (currentPage === "users") {
    content = (
      <Users
        onBack={() => navigateToPage("module/telematica")}
        onNewUser={() => navigateToPage("new-user")}
        onEditUser={(id) => {
          setSelectedUserId(id);
          navigateToPage("edit-user");
        }}
      />
    );
  }

  if (currentPage === "audit-events") {
    content = <AuditEventsPage onBack={() => navigateToPage("module/telematica")} />;
  }

  if (currentPage === "new-user") {
    content = <NewUser onBack={() => navigateToPage("users")} />;
  }

  if (currentPage === "edit-user") {
    content = <EditUser userId={selectedUserId} onBack={() => navigateToPage("users")} />;
  }

  if (currentPage === "sectors") {
    content = <Sectors onBack={() => navigateToPage("module/telematica")} />;
  }

  if (currentPage === "units") {
    content = <Units onBack={() => navigateToPage("module/telematica")} />;
  }

  if (currentPage === "police-officers") {
    content = (
      <PoliceOfficers
        onBack={() => navigateToPage("module/p1")}
        onNewPoliceOfficer={() => navigateToPage("new-police-officer")}
        onViewMovements={() => navigateToPage("police-officer-movements")}
        onEditPoliceOfficer={(id) => {
          setSelectedPoliceOfficerId(id);
          navigateToPage("edit-police-officer");
        }}
        onMovePoliceOfficer={(id) => {
          setSelectedPoliceOfficerId(id);
          navigateToPage("move-police-officer");
        }}
      />
    );
  }

  if (currentPage === "controle-efetivo") {
    content = (
      <ControleEfetivoPage
        onBack={() => navigateToPage("module/p1")}
        onEditPoliceOfficer={(id) => {
          setSelectedPoliceOfficerId(id);
          navigateToPage("edit-police-officer");
        }}
      />
    );
  }

  if (currentPage === "new-police-officer") {
    content = <NewPoliceOfficer onBack={() => navigateToPage("police-officers")} />;
  }

  if (currentPage === "edit-police-officer") {
    content = <EditPoliceOfficer officerId={selectedPoliceOfficerId} onBack={() => navigateToPage("police-officers")} />;
  }

  if (currentPage === "move-police-officer") {
    content = <MovePoliceOfficer officerId={selectedPoliceOfficerId} onBack={() => navigateToPage("police-officers")} />;
  }

  if (currentPage === "police-officer-movements") {
    content = <PoliceOfficerMovementsList onBack={() => navigateToPage("police-officers")} />;
  }

  // Fluxo legado órfão: mantido desativado até a remoção física total.
  if (
    currentPage === "p1/importar-policiais" &&
    viewerAccess.moduleAccessCodes?.includes("__legacy_import_policiais__") &&
    visibleNavigationItems.some((item) => item.key === "p1/importar-policiais")
  ) {
    content = (
      <InstitutionalModulePage
        title="Importar Policiais"
        description="Área reservada para importação assistida de policiais no módulo P1."
        highlights={[
          "Pode evoluir para importação por planilha, conferência e validação em lote.",
          "A navegação já está pronta para receber o fluxo real quando você decidir ativá-lo.",
        ]}
        onBack={() => navigateToPage("module/p1")}
      />
    );
  }

  if (currentPage === "p1/bloco-quinquenio") {
    content = <QuinquenioPage onBack={() => navigateToPage("module/p1")} />;
  }

  if (currentPage === "p1/bloco-lp") {
    content = <BlocoLpPage onBack={() => navigateToPage("module/p1")} />;
  }

  if (currentPage === "p1/bloco-lsv") {
    content = <BlocoLsvPage onBack={() => navigateToPage("module/p1")} />;
  }

  if (currentPage === "p1/fruicao-lic-premio") {
    content = (
      <InstitutionalModulePage
        title="Controle de Fruição Lic Prêmio"
        description="Área reservada para gestão e acompanhamento da fruição de Licença Prêmio."
        highlights={RESERVED_PAGE_DETAILS["p1/fruicao-lic-premio"]?.highlights || []}
        onBack={() => navigateToPage("module/p1")}
      />
    );
  }

  if (currentPage === "p1/bloco-mvm") {
    content = (
      <InstitutionalModulePage
        title="Controle de Bloco MVM"
        description="Área reservada para gestão e acompanhamento do bloco MVM."
        highlights={RESERVED_PAGE_DETAILS["p1/bloco-mvm"]?.highlights || []}
        onBack={() => navigateToPage("module/p1")}
      />
    );
  }

  if (currentPage === "module/p2/painel") {
    content = (
      <InstitutionalModulePage
        title="P2 - Inteligência"
        description="Painel institucional reservado para a área de Inteligência."
        highlights={RESERVED_PAGE_DETAILS["module/p2/painel"]?.highlights || []}
        onBack={() => navigateToPage("module/p2")}
      />
    );
  }

  if (currentPage === "module/p3/painel") {
    content = (
      <InstitutionalModulePage
        title="P3 - Estatística"
        description="Painel institucional reservado para consolidação estatística."
        highlights={RESERVED_PAGE_DETAILS["module/p3/painel"]?.highlights || []}
        onBack={() => navigateToPage("module/p3")}
      />
    );
  }

  if (currentPage === "controle-velocidade-noturno") {
    content = <ControleVelocidadeNoturnoPage onBack={() => navigateToPage("module/p3")} />;
  }

  if (currentPage === "planilha-acidente-viatura") {
    content = <PlanilhaAcidenteViaturaPage onBack={() => navigateToPage("module/p3")} />;
  }

  if (currentPage === "eap") {
    content = <EapPage onBack={() => navigateToPage("module/p3")} />;
  }

  if (currentPage === "rancho") {
    content = <RanchoPage onBack={() => navigateToPage("module/assuntos-gerais")} />;
  }

  if (currentPage === "p5/aniversariantes") {
    content = <P5BirthdaysPage onBack={() => navigateToPage("module/p5")} />;
  }

  if (currentPage === "module/p5/painel") {
    content = (
      <InstitutionalModulePage
        title="P5 - Relações Públicas"
        description="Painel institucional reservado para comunicação e relações públicas."
        highlights={RESERVED_PAGE_DETAILS["module/p5/painel"]?.highlights || []}
        onBack={() => navigateToPage("module/p5")}
      />
    );
  }

  if (currentPage === "module/pjmd/painel") {
    content = (
      <InstitutionalModulePage
        title="PJMD - Justiça e Disciplina"
        description="Painel institucional reservado para justiça e disciplina."
        highlights={RESERVED_PAGE_DETAILS["module/pjmd/painel"]?.highlights || []}
        onBack={() => navigateToPage("module/pjmd")}
      />
    );
  }

  if (currentPage === "module/uge/painel") {
    content = (
      <InstitutionalModulePage
        title="UGE - Convênios/Financeiro"
        description="Painel institucional reservado para convênios e financeiro."
        highlights={RESERVED_PAGE_DETAILS["module/uge/painel"]?.highlights || []}
        onBack={() => navigateToPage("module/uge")}
      />
    );
  }

  if (currentPage === "module/stcor/painel") {
    content = (
      <InstitutionalModulePage
        title="StCor - Sala de Operações"
        description="Painel institucional reservado para a Sala de Operações."
        highlights={RESERVED_PAGE_DETAILS["module/stcor/painel"]?.highlights || []}
        onBack={() => navigateToPage("module/stcor")}
      />
    );
  }

  if (!content) {
    content = (
      <InstitutionalModulePage
        title="Módulo institucional"
        description="Área reservada na arquitetura atual do ERP."
        onBack={() => navigateToPage("home")}
      />
    );
  }

  return (
    <Layout
      activeNavKey={activeNavKey}
      onNavigate={navigateToPage}
      onLogout={handleLogout}
      themeMode={themeMode}
      onToggleTheme={handleToggleTheme}
    >
      <Suspense fallback={<PageLoadingFallback message="Carregando página..." />}>
        {content}
      </Suspense>
    </Layout>
  );
}

function PageLoadingFallback({ message, auth = false }) {
  if (auth) {
    return (
      <div style={appShellStyles.authPage}>
        <div style={appShellStyles.authCard}>{message}</div>
      </div>
    );
  }

  return <div style={appShellStyles.page}>{message}</div>;
}

export default App;




