# Registro de Decisões

Este arquivo registra decisões importantes do projeto para evitar perda de contexto ao longo do tempo.

Observação importante:

- este documento é histórico
- algumas decisões registram etapas intermediárias do projeto
- quando houver divergência entre este arquivo e [README-ARQUITETURA.md](C:/Users/Telematica/Documents/erp5bprv/docs/README-ARQUITETURA.md), considerar o README de arquitetura como referência do estado atual

## Decisões recentes

- `D-104`: o banco principal do ERP passa a ser `PostgreSQL`
- `D-105`: o módulo `Frota` consolida a nomenclatura `Cadastro de Viaturas`
- `D-106`: o módulo `P4 - Logística/Frota` passa a incluir `TPD/Talonário`
- `D-107`: o projeto adota `UTF-8` como padrão obrigatório e saneamento defensivo em módulos sensíveis
- `D-108`: `Frota`, `Material Bélico` e `Romaneio` passam a ter bateria autenticada registrada
- `D-109`: `Material Bélico` concentra o frontend em `materialBelicoService.js`
- `D-110`: a navegação autenticada passa a priorizar hubs por cards
- `D-111`: revisão operacional curta de `29/03/2026` confirma leitura funcional dos módulos centrais
- `D-112`: a revisão de `29/03/2026` confirma escrita coerente em `Estoque/Manutenção`
- `D-113`: `Materiais` e `TPD/Talonário` respondem `201` com payload mínimo estável
- `D-114`: o `P4 - Logística/Frota` passa por uma rodada final de acabamento visual e textual
- `D-115`: o backend amplia o saneamento defensivo de textos e respostas da API
- `D-116`: a autenticação do ERP migra de JWT apenas em `localStorage` para sessão híbrida com `access token`, `refresh token` e cookies `HttpOnly`
- `D-117`: a Telemática passa a expor auditoria administrativa de segurança no frontend
- `D-118`: a estrutura de unidades preserva o código técnico interno e adiciona `Código OPM` como identificador operacional
- `D-119`: o `P4 - Logística/Frota` ganha o módulo `Controle de COPs`
- `D-120`: o `P4 - Logística/Frota` ganha o módulo `Mapa Força de Viaturas`
- `D-121`: a área de `Frota` consolida um padrão visual único entre cadastro, controle geral, COPs e mapa força
- `D-122`: o `P1 - Recursos Humanos` ganha o módulo operacional de `Controle de Bloco Quinquênio`
- `D-123`: o menu `Assuntos Gerais` passa a incluir o módulo `Previsão de Rancho`
- `D-124`: o `P3 - Estatística` ganha os módulos `Controle de Velocidade Noturno` e `Planilha de Acidentes de Viatura`
- `D-125`: cards e subcards passam a usar um padrão visual único com `ModuleCard`
- `D-126`: frontend, backend e documentação passam por saneamento contínuo de UTF-8 e textos operacionais

## D-116 - Endurecimento da autenticação e sessão

O ERP passa a usar sessão autenticada baseada em JWT com:

- `access token` de curta duração
- `refresh token`
- cookies `HttpOnly`
- endpoint de sessão atual em `/api/auth/me`
- tentativa automática de refresh no frontend

Resultado prático:

- o frontend deixa de depender do token em `localStorage`
- o backend passa a aceitar cookie autenticado como canal principal da sessão
- foi adicionado rate limit de login
- foram adicionados headers de segurança HTTP
- foi criada a tabela `login_attempts`
- `users` passa a registrar `last_login_at`, `last_login_ip` e `require_password_change`
- rotas críticas de `P1` e `P4` passam a validar módulo explicitamente no backend

## D-117 - Auditoria administrativa de segurança

O ERP passa a expor uma tela administrativa de auditoria de segurança no frontend, acessível a perfis administrativos dentro de `Telemática`.

Resultado prático:

- nova tabela `audit_events`
- trilha de auditoria para login, refresh, logout, troca de senha e gestão de usuários
- nova tela `Telemática > Auditoria de Segurança`
- alertas visuais para eventos recentes `FAILED` e `DENIED`
- exportação `Excel` e `PDF`

## D-118 - Separação entre código técnico e Código OPM

As unidades passam a manter dois identificadores distintos:

- `code`: identificador técnico interno do ERP
- `codigo_opm`: identificador operacional e administrativo da unidade

Resultado prático:

- a tabela `units` ganha a coluna `codigo_opm`
- os seeds passam a preencher `codigo_opm` nas unidades principais
- a tela `Telemática > Estrutura de Unidades` diferencia visualmente `Código` e `Código OPM`

## D-119 - Criação do módulo Controle de COPs

O `P4 - Logística/Frota` passa a incluir o módulo `Controle de COPs` como fluxo próprio de cadastro, consulta, detalhe e movimentação.

Resultado prático:

- novas tabelas `cops` e `cop_movements`
- novas rotas `/api/cops`
- nova tela `Controle de COPs` no frontend
- exportação, filtros, status e histórico no padrão visual do módulo

## D-120 - Criação do módulo Mapa Força de Viaturas

O `P4 - Logística/Frota` passa a incluir o módulo `Mapa Força de Viaturas` como leitura operacional da frota existente, usando uma tabela complementar para os campos específicos do mapa.

Resultado prático:

- nova tabela `mapa_forca` ligada a `fleet_vehicles`
- novas rotas `/api/mapa-forca`
- preenchimento por prefixo com dados automáticos vindos do cadastro de viaturas
- resumos operacionais por grupo, tipo, órgão, grafismo, tag e telemetria
- exportação `Excel` e `PDF` no frontend

## D-121 - Consolidação visual da Frota

Os módulos principais da `Frota` passam a compartilhar o mesmo padrão de leitura operacional no frontend.

Resultado prático:

- `FleetHub` passa a expor também `Controle de COPs` e `Mapa Força de Viaturas`
- `Cadastro de Viaturas`, `Controle Geral de Viaturas`, `Controle de COPs` e `Mapa Força` passam a usar resumos rápidos do item selecionado
- tabelas operacionais passam a priorizar colunas-chave fixas para consulta com scroll horizontal
- a navegação do `P4` fica mais coesa entre cadastro, consulta, detalhe e painéis executivos

## D-122 - Operacionalização do Quinquênio no P1

O `P1 - Recursos Humanos` passa a expor um módulo funcional de `Controle de Bloco Quinquênio`, deixando de tratar o card apenas como espaço reservado.

Resultado prático:

- o cálculo dos blocos usa a `data_admissao` do policial
- o direito passa a ser contado por ciclos de `1825 dias`
- interrupções cadastradas afetam a previsão dos próximos blocos
- cada bloco mantém `3 períodos`, com bloqueio de mais de `1 Pecúnia`
- a interface passa a mostrar timeline, progresso de tempo de serviço, alertas e detalhamento por bloco

## D-123 - Criação do módulo Previsão de Rancho

O ERP passa a incluir o módulo `Previsão de Rancho` em `Assuntos Gerais`, com planejamento mensal operacional por unidade.

Resultado prático:

- novas tabelas `rancho_configuracoes`, `rancho_participantes` e `rancho_lancamentos`
- marcação mensal por `Café` e `Almoço`
- uso de base de policiais por `RE-DC` para preenchimento automático de PM
- exclusão de fins de semana da grade operacional
- exportação `Excel` no formato de planejamento mensal

## D-124 - Expansão operacional do P3

O `P3 - Estatística` passa a incluir dois fluxos operacionais próprios: `Controle de Velocidade Noturno` e `Planilha de Acidentes de Viatura`.

Resultado prático:

- `Controle de Velocidade Noturno` passa a operar com dashboard mensal, grade por dia x unidade e consolidação por totais
- `Planilha de Acidentes de Viatura` (`PAAVI`) passa a usar `RE-DC` como chave de busca do policial
- o `PAAVI` preenche automaticamente `RE`, `Posto/Graduação` e `Nome`
- o módulo `PAAVI` passa a contar com listagem, detalhe, edição e exportação `Excel/PDF`

## D-125 - Padronização visual obrigatória de cards e subcards

Todos os hubs e subhubs operacionais passam a reutilizar um único componente visual de navegação no frontend.

Resultado prático:

- criação do componente `ModuleCard` como padrão único para cards principais e subcards
- adoção de ícone, cor temática, borda visível e hover com elevação em todos os hubs internos
- padronização do grid de navegação com `repeat(auto-fill, minmax(180px, 1fr))`
- alinhamento visual entre `P4`, `RH`, `Estatística`, `Assuntos Gerais` e `Telemática`
- regra permanente: novos cards e subcards devem nascer usando `ModuleCard`

## D-126 - Saneamento contínuo de UTF-8 e textos operacionais

O projeto passa a tratar encoding e legibilidade textual como parte permanente da qualidade do produto, e não apenas como correção pontual.

Resultado prático:

- frontend com revisão dirigida de telas que ainda exibiam textos corrompidos
- backend com correção de mensagens HTTP em módulos administrativos e saneamento defensivo mantido em rotas legadas
- documentação revisada para manter descrições institucionais e operacionais em UTF-8 consistente
- regra permanente: novos arquivos e ajustes textuais devem preservar `UTF-8` e evitar reintrodução de mojibake
