import palette from "../constants/moduleCardPalette";

const commonTopLevelItems = [
  {
    key: "module/p1",
    label: "P1 - Recursos Humanos",
    visibility: { sectorCodes: ["P1"] },
  },
  {
    key: "module/p2",
    label: "P2 - Inteligência",
    visibility: { sectorCodes: ["P2"] },
  },
  {
    key: "module/p3",
    label: "P3 - Estatística",
    visibility: { sectorCodes: ["P3"] },
  },
  {
    key: "module/p4",
    label: "P4 - Logística/Frota",
    visibility: { sectorCodes: ["P4"] },
  },
  {
    key: "module/p5",
    label: "P5 - Relações Públicas",
    visibility: { sectorCodes: ["P5"] },
  },
  {
    key: "module/assuntos-gerais",
    label: "Assuntos Gerais",
  },
  {
    key: "module/pjmd",
    label: "PJMD - Justiça e Disciplina",
    visibility: { sectorCodes: ["PJMD"] },
  },
  {
    key: "module/uge",
    label: "UGE - Convênios/Financeiro",
    visibility: { sectorCodes: ["UGE_CONVENIOS"] },
  },
  {
    key: "module/stcor",
    label: "StCor - Sala de Operações",
    visibility: { sectorCodes: ["STCOR", "PDR"] },
  },
  {
    key: "module/telematica",
    label: "Telemática",
    visibility: { sectorCodes: ["TELEMATICA"] },
  },
];

const moduleCards = {
  "module/p1": {
    title: "Recursos Humanos",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "police-officers",
        label: "Cadastro / Consulta de Policial",
        icon: "person",
        color: palette.blue,
        description: "Cadastre, consulte e atualize os dados funcionais do efetivo.",
      },
      {
        key: "controle-efetivo",
        label: "Controle de Efetivo",
        icon: "group",
        color: palette.green,
        description: "Acompanhe distribuição, ocupação e composição do efetivo por unidade.",
      },
      {
        key: "p1/bloco-quinquenio",
        label: "Controle de Bloco Quinquênio",
        icon: "history",
        color: palette.amber,
        description: "Gerencie a evolução dos blocos de quinquênio e seus períodos.",
      },
      {
        key: "p1/bloco-lp",
        label: "Controle de Bloco Lic Prêmio",
        icon: "grid",
        color: palette.red,
        description: "Controle concessões, períodos e saldo dos blocos de Licença Prêmio.",
      },
      {
        key: "p1/bloco-lsv",
        label: "Controle de Fruição LSV",
        icon: "calendar",
        color: palette.yellow,
        description: "Acompanhe as fruições de LSV por policial, data e boletim.",
      },
      {
        key: "p1/fruicao-lic-premio",
        label: "Controle de Fruição Lic Prêmio",
        icon: "list",
        color: palette.teal,
        description: "Organize períodos, início de gozo e andamento da fruição de LP.",
      },
      {
        key: "p1/bloco-mvm",
        label: "Controle de Bloco MVM",
        icon: "clipboard",
        color: palette.pink,
        description: "Centralize blocos e movimentações do controle MVM no RH.",
      },
    ],
  },
  "module/p2": {
    title: "Inteligência",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "module/p2/painel",
        label: "Painel de Inteligência",
        icon: "shield",
        color: palette.cyan,
      },
    ],
  },
  "module/p3": {
    title: "Estatística",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "module/p3/painel",
        label: "Painel Estatístico",
        icon: "chart",
        color: palette.green,
      },
      {
        key: "controle-velocidade-noturno",
        label: "Controle de Velocidade Noturno",
        icon: "radar",
        color: palette.cyan,
        description: "Lance autuações e acompanhe o comparativo mensal por unidade.",
      },
      {
        key: "planilha-acidente-viatura",
        label: "Planilha de Acidentes de Viatura",
        icon: "clipboard",
        color: palette.orange,
        description: "Registre fichas PAAVI com consulta por RE, local e vítimas.",
      },
      {
        key: "eap",
        label: "EAP 5º BPRv",
        icon: "form",
        color: palette.purple,
        description: "Cadastre módulos, períodos e locais do EAP por policial.",
      },
    ],
  },
  "module/p4": {
    title: "Logística / Frota",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "items",
        label: "Materiais",
        icon: "inventory",
        color: palette.blue,
        description: "Cadastre, consulte e movimente materiais operacionais.",
      },
      {
        key: "logistica/estoque-manutencao",
        label: "Estoque / Manutenção",
        icon: "warehouse",
        color: palette.teal,
        description: "Controle entradas, saídas, estoque, fornecedores e manutenção.",
      },
      {
        key: "logistica/tpd-talonario",
        label: "TPD / Talonário",
        icon: "clipboard",
        color: palette.purple,
        description: "Gerencie talonários e controles administrativos vinculados ao P4.",
      },
      {
        key: "material-belico",
        label: "Material Bélico",
        icon: "shield",
        color: palette.red,
        description: "Acesse categorias, controle geral e movimentações do material bélico.",
      },
      {
        key: "processos-armas",
        label: "Processos de Armas",
        icon: "gavel",
        color: palette.orange,
        description: "Organize fluxos administrativos e documentais relacionados a armas.",
      },
      {
        key: "logistica/romaneio",
        label: "Romaneio",
        icon: "straighten",
        color: palette.yellow,
        description: "Cadastre medidas e controles associados ao romaneio da unidade.",
      },
      {
        key: "frota",
        label: "Frota",
        icon: "car",
        color: palette.green,
        description: "Abra os submódulos operacionais e executivos da frota do 5º BPRv.",
      },
      {
        key: "cops",
        label: "Controle de COPs",
        icon: "grid",
        color: palette.pink,
        description: "Gerencie COPs, responsáveis, status e movimentações vinculadas.",
      },
      {
        key: "mapa-forca",
        label: "Mapa Força de Viaturas",
        icon: "list",
        color: palette.cyan,
        description: "Visualize o espelho operacional da frota com filtros e resumos.",
      },
      {
        key: "inactive-items",
        label: "Itens Inativos",
        icon: "archive",
        color: palette.white,
        description: "Consulte itens desativados, baixados ou indisponíveis no módulo.",
      },
      {
        key: "movements",
        label: "Movimentações",
        icon: "swap",
        color: palette.red,
        description: "Acompanhe movimentações gerais dos materiais logísticos.",
      },
      {
        key: "logs",
        label: "Histórico",
        icon: "list",
        color: palette.purple,
        description: "Consulte o histórico consolidado de ações e registros do P4.",
      },
    ],
  },
  "module/p5": {
    title: "Relações Públicas",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "p5/aniversariantes",
        label: "Aniversariantes do Efetivo",
        icon: "calendar",
        color: palette.orange,
        description: "Consulte aniversariantes da semana e do mÃªs com base no cadastro dos policiais.",
      },
      {
        key: "module/p5/painel",
        label: "Painel Institucional",
        icon: "megaphone",
        color: palette.pink,
      },
    ],
  },
  "module/assuntos-gerais": {
    title: "Assuntos Gerais",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "rancho",
        label: "Previsão de Rancho",
        icon: "grid",
        color: palette.orange,
        description: "Monte o planejamento mensal de café e almoço em dias úteis.",
      },
    ],
  },
  "module/pjmd": {
    title: "Justiça e Disciplina",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "module/pjmd/painel",
        label: "Painel Disciplinar",
        icon: "gavel",
        color: palette.pink,
      },
    ],
  },
  "module/uge": {
    title: "Convênios / Financeiro",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "module/uge/painel",
        label: "Painel Financeiro",
        icon: "wallet",
        color: palette.green,
      },
    ],
  },
  "module/stcor": {
    title: "Sala de Operações",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "module/stcor/painel",
        label: "Painel Operacional",
        icon: "radio",
        color: palette.cyan,
      },
    ],
  },
  "module/telematica": {
    title: "Telemática",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "users",
        label: "Gestão de Usuários",
        icon: "users",
        color: palette.blue,
        description: "Administre perfis, acessos e vínculos administrativos do sistema.",
        visibility: {
          roles: ["ADMIN_GLOBAL", "ADMIN_UNIDADE"],
          allowAdminFallback: true,
        },
      },
      {
        key: "audit-events",
        label: "Auditoria de Segurança",
        icon: "log",
        color: palette.blue,
        description: "Monitore eventos sensíveis, falhas e ações administrativas recentes.",
        visibility: {
          roles: ["ADMIN_GLOBAL", "ADMIN_UNIDADE"],
          allowAdminFallback: true,
        },
      },
      {
        key: "units",
        label: "Estrutura de Unidades",
        icon: "building",
        color: palette.green,
        description: "Gerencie unidades, códigos institucionais e hierarquia organizacional.",
        visibility: {
          roles: ["ADMIN_GLOBAL"],
          requireGlobalScope: true,
        },
      },
      {
        key: "sectors",
        label: "Gestão de Setores",
        icon: "config",
        color: palette.purple,
        description: "Configure setores internos, responsáveis e escopos de atuação.",
        visibility: {
          roles: ["ADMIN_GLOBAL", "ADMIN_UNIDADE"],
          allowAdminFallback: true,
        },
      },
    ],
  },
  "logistica/romaneio": {
    title: "Romaneio",
    subtitle: "Selecione um módulo para acessar",
    cards: [
      {
        key: "romaneio/cadastro-medidas",
        label: "Cadastro de Medidas",
        icon: "ruler",
        color: palette.green,
        description: "Lance e consulte medidas operacionais vinculadas ao romaneio.",
      },
    ],
  },
  "processos-armas": {
    title: "Processos de Armas",
    subtitle: "Selecione um processo para acessar",
    cards: [
      {
        key: "frota/armamentos/modulo",
        label: "Controle de Processo de Armamentos",
        icon: "doc",
        color: palette.blue,
        description: "Abra o fluxo principal de controle dos processos de armamentos.",
      },
      {
        key: "processos-armas/apaf/modulo",
        label: "Solicitação de APAF",
        icon: "form",
        color: palette.green,
        description: "Gerencie pedidos, cadastro e consulta de solicitações APAF.",
      },
      {
        key: "processos-armas/craf/modulo",
        label: "CRAF",
        icon: "cert",
        color: palette.yellow,
        description: "Centralize o acompanhamento dos processos e registros de CRAF.",
      },
      {
        key: "processos-armas/aquisicao/modulo",
        label: "Aquisição de Arma",
        icon: "purchase",
        color: palette.purple,
        description: "Controle o fluxo de aquisição de arma com cadastro e consulta.",
      },
      {
        key: "processos-armas/transferencia/modulo",
        label: "Transferência de Arma",
        icon: "exchange",
        color: palette.orange,
        description: "Acompanhe transferências de arma entre origens, destinos e fases.",
      },
      {
        key: "processos-armas/porte-outro-estado/modulo",
        label: "Aut. Portar Arma Outro Estado",
        icon: "map",
        color: palette.cyan,
        description: "Gerencie autorizações para porte de arma em outro estado.",
      },
      {
        key: "processos-armas/exclusao-furto-roubo/modulo",
        label: "Exclusão de Arma: Furto/Roubo",
        icon: "x",
        color: palette.red,
        description: "Registre e consulte exclusões motivadas por furto ou roubo.",
      },
      {
        key: "processos-armas/baixa-armamento/modulo",
        label: "Baixa de Armamento",
        icon: "download",
        color: palette.white,
        description: "Conduza baixas de armamento com trilha de cadastro e consulta.",
      },
      {
        key: "processos-armas/regularizacao/modulo",
        label: "Regularização Arma/Munição",
        icon: "check",
        color: palette.green,
        description: "Organize regularizações de arma e munição em fluxo dedicado.",
      },
    ],
  },
};

const pageToModuleKey = {
  home: null,
  dashboard: null,
  "p1/bloco-quinquenio": "module/p1",
  "p1/bloco-lp": "module/p1",
  "p1/bloco-lsv": "module/p1",
  "p1/fruicao-lic-premio": "module/p1",
  "p1/bloco-mvm": "module/p1",
  "module/p1": "module/p1",
  "police-officers": "module/p1",
  "controle-efetivo": "module/p1",
  "new-police-officer": "module/p1",
  "edit-police-officer": "module/p1",
  "move-police-officer": "module/p1",
  "police-officer-movements": "module/p1",
  "module/p2": "module/p2",
  "module/p2/painel": "module/p2",
  "module/p3": "module/p3",
  "module/p3/painel": "module/p3",
  "controle-velocidade-noturno": "module/p3",
  "planilha-acidente-viatura": "module/p3",
  eap: "module/p3",
  "module/p4": "module/p4",
  items: "module/p4",
  "new-item": "module/p4",
  "edit-item": "module/p4",
  movement: "module/p4",
  "logistica/estoque-manutencao": "module/p4",
  "estoque/entradas": "module/p4",
  "estoque/saidas": "module/p4",
  "estoque/produtos": "module/p4",
  "estoque/fornecedores": "module/p4",
  "estoque/manutencao": "module/p4",
  "estoque/relatorio": "module/p4",
  "logistica/tpd-talonario": "module/p4",
  "logistica/tpd-talonario/novo": "module/p4",
  "logistica/tpd-talonario/editar": "module/p4",
  "logistica/romaneio": "module/p4",
  "romaneio/cadastro-medidas": "module/p4",
  "material-belico": "module/p4",
  "processos-armas": "module/p4",
  "belico-controle-geral": "module/p4",
  "belico-controle-geral-insert": "module/p4",
  "belico-controle-geral-list": "module/p4",
  "belico-coletes": "module/p4",
  "belico-espargidores": "module/p4",
  "belico-armas": "module/p4",
  "belico-algemas": "module/p4",
  "belico-municoes": "module/p4",
  "belico-municoes-quimicas": "module/p4",
  "belico-tonfa": "module/p4",
  "belico-taser": "module/p4",
  "belico-cdc": "module/p4",
  "belico-insert": "module/p4",
  "belico-list": "module/p4",
  "belico-move": "module/p4",
  "belico-edit": "module/p4",
  "belico-movimentacoes": "module/p4",
  frota: "module/p4",
  "frota/viaturas/modulo": "module/p4",
  "frota/viaturas/cadastrar": "module/p4",
  "frota/viaturas/consultar": "module/p4",
  "frota/motocicletas/modulo": "module/p4",
  "frota/motocicletas/cadastrar": "module/p4",
  "frota/motocicletas/consultar": "module/p4",
  "frota/controle-geral/modulo": "module/p4",
  "frota/controle-geral/cadastrar": "module/p4",
  "frota/controle-geral/consultar": "module/p4",
  "frota/armamentos/modulo": "module/p4",
  "frota/armamentos/cadastrar": "module/p4",
  "frota/armamentos/consultar": "module/p4",
  "processos-armas/apaf/modulo": "module/p4",
  "processos-armas/apaf/cadastrar": "module/p4",
  "processos-armas/apaf/consultar": "module/p4",
  "processos-armas/craf/modulo": "module/p4",
  "processos-armas/craf/cadastrar": "module/p4",
  "processos-armas/craf/consultar": "module/p4",
  "processos-armas/aquisicao/modulo": "module/p4",
  "processos-armas/aquisicao/cadastrar": "module/p4",
  "processos-armas/aquisicao/consultar": "module/p4",
  "processos-armas/transferencia/modulo": "module/p4",
  "processos-armas/transferencia/cadastrar": "module/p4",
  "processos-armas/transferencia/consultar": "module/p4",
  "processos-armas/porte-outro-estado/modulo": "module/p4",
  "processos-armas/porte-outro-estado/cadastrar": "module/p4",
  "processos-armas/porte-outro-estado/consultar": "module/p4",
  "processos-armas/exclusao-furto-roubo/modulo": "module/p4",
  "processos-armas/exclusao-furto-roubo/cadastrar": "module/p4",
  "processos-armas/exclusao-furto-roubo/consultar": "module/p4",
  "processos-armas/baixa-armamento/modulo": "module/p4",
  "processos-armas/baixa-armamento/cadastrar": "module/p4",
  "processos-armas/baixa-armamento/consultar": "module/p4",
  "processos-armas/regularizacao/modulo": "module/p4",
  "processos-armas/regularizacao/cadastrar": "module/p4",
  "processos-armas/regularizacao/consultar": "module/p4",
  "frota/outros/modulo": "module/p4",
  "frota/outros/cadastrar": "module/p4",
  "frota/outros/consultar": "module/p4",
  "frota/move": "module/p4",
  "frota/movimentacoes": "module/p4",
  cops: "module/p4",
  "mapa-forca": "module/p4",
  "inactive-items": "module/p4",
  movements: "module/p4",
  logs: "module/p4",
  "module/p5": "module/p5",
  "p5/aniversariantes": "module/p5",
  "module/p5/painel": "module/p5",
  "module/assuntos-gerais": "module/assuntos-gerais",
  rancho: "module/assuntos-gerais",
  "module/pjmd": "module/pjmd",
  "module/pjmd/painel": "module/pjmd",
  "module/uge": "module/uge",
  "module/uge/painel": "module/uge",
  "module/stcor": "module/stcor",
  "module/stcor/painel": "module/stcor",
  "module/telematica": "module/telematica",
  users: "module/telematica",
  "audit-events": "module/telematica",
  "new-user": "module/telematica",
  "edit-user": "module/telematica",
  units: "module/telematica",
  sectors: "module/telematica",
};

export function buildNavigationItemsForViewer() {
  return commonTopLevelItems;
}

export function findNavigationItemByKey(items, key) {
  return items.find((item) => item.key === key) || null;
}

export function getModuleCards(key) {
  return moduleCards[key] || null;
}

export function resolveModuleKeyForPage(page) {
  if (pageToModuleKey[page] !== undefined) {
    return pageToModuleKey[page];
  }

  if (page?.startsWith("module/p2")) return "module/p2";
  if (page?.startsWith("module/p3")) return "module/p3";
  if (page?.startsWith("module/p5")) return "module/p5";
  if (page?.startsWith("module/assuntos-gerais")) return "module/assuntos-gerais";
  if (page?.startsWith("module/pjmd")) return "module/pjmd";
  if (page?.startsWith("module/uge")) return "module/uge";
  if (page?.startsWith("module/stcor")) return "module/stcor";

  return null;
}



