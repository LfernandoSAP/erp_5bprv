# Mapa de Modulos

## P1 - Recursos Humanos

### Responsabilidades

- cadastro e consulta de policial
- movimentacao funcional
- efetivo
- quinquenio
- LP
- LSV
- controles complementares de RH

### Referencias principais

- [frontend/src/pages/PoliceOfficers.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/PoliceOfficers.jsx)
- [frontend/src/pages/QuinquenioPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/QuinquenioPage.jsx)
- [frontend/src/pages/BlocoLpPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/BlocoLpPage.jsx)
- [frontend/src/pages/BlocoLsvPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/BlocoLsvPage.jsx)

## Assuntos Gerais

### Responsabilidades

- previsao mensal de rancho

### Referencias principais

- [frontend/src/pages/RanchoPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/RanchoPage.jsx)

## P3 - Estatistica

### Responsabilidades

- velocidade noturna
- PAAVI

### Referencias principais

- [frontend/src/pages/ControleVelocidadeNoturnoPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/ControleVelocidadeNoturnoPage.jsx)
- [frontend/src/pages/PlanilhaAcidenteViaturaPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/PlanilhaAcidenteViaturaPage.jsx)

## P4 - Logistica / Frota

### Responsabilidades

- materiais
- material belico
- frota
- TPD/Talonario
- estoque e manutencao
- processos de armas
- romaneio
- COPs
- mapa forca

### Referencias principais

- [frontend/src/pages/FleetHub.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/FleetHub.jsx)
- [frontend/src/pages/FleetVehiclesPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/FleetVehiclesPage.jsx)
- [frontend/src/pages/MapaForcaPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/MapaForcaPage.jsx)
- [frontend/src/pages/CopsPage.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/CopsPage.jsx)
- [backend/app/modules/logistica/service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/logistica/service.py)

## Telematica

### Responsabilidades

- usuarios
- setores
- unidades
- acessos
- auditoria

### Referencias principais

- [backend/app/modules/telematica/service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/telematica/service.py)
- [frontend/src/pages/Users.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Users.jsx)
- [frontend/src/pages/Units.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Units.jsx)
- [frontend/src/pages/Sectors.jsx](/c:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/Sectors.jsx)

## Regras transversais

- todo modulo respeita escopo por unidade
- backend valida permissao por modulo
- frontend usa cards e subcards padronizados
- textos devem permanecer em UTF-8
