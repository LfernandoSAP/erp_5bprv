# Cleanup Backlog

## Objetivo

Registrar os pontos de compatibilidade defensiva que ainda existem no ERP 5BPRv, separando o que deve permanecer por enquanto do que pode ser simplificado em uma próxima rodada técnica.

## Situação atual

A base já passou por limpeza ampla em:

- frontend principal
- mensagens visíveis do backend
- documentação central
- módulos P1, P4 e Telemática mais usados

O resíduo restante está concentrado em normalizadores defensivos de texto legado.

## Compatibilidade a manter por enquanto

### 1. RH

Arquivo:
- [service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/rh/service.py)

Motivo para manter:
- ainda sanitiza textos antigos em ficha, PDF, HTML e blocos de exportação
- concentra histórico de dados e conteúdo institucional mais antigo

Risco de remoção agora:
- médio a alto
- pode reintroduzir texto quebrado em relatórios e fichas individuais

Recomendação:
- só simplificar após rodada dedicada de validação de PDFs e fichas do policial

### 2. Logística

Arquivo:
- [service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/logistica/service.py)

Motivo para manter:
- ainda corrige variações antigas de materiais, estoque, TPD e material bélico
- atua como proteção para dados com encoding inconsistente já persistidos

Risco de remoção agora:
- médio
- pode devolver descrições antigas com acentuação quebrada em consultas e exportações

Recomendação:
- manter até que os dados antigos sejam saneados na origem ou migrados em lote

### 3. Telemática

Arquivo:
- [service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/telematica/service.py)

Motivo para manter:
- ainda há compatibilidade pontual para nomes e mensagens antigas de usuário/módulo
- já foi simplificado, mas continua absorvendo algumas variantes legadas

Risco de remoção agora:
- baixo a médio

Recomendação:
- candidato a nova simplificação futura, depois de mais uma rodada de observação em produção/homologação

### 4. Dashboard

Arquivo:
- [dashboard.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/routes/dashboard.py)

Motivo para manter:
- normaliza rótulos agregados vindos de dados antigos

Risco de remoção agora:
- baixo

Recomendação:
- pode ser simplificado quando os nomes agregados do banco estiverem totalmente normalizados

## Candidatos à remoção futura

### Prioridade baixa

- normalizador de [dashboard.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/routes/dashboard.py)
- parte do normalizador de [service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/telematica/service.py)

Critério para remover:
- ausência de novos casos reais em homologação
- confirmação de que os dados persistidos já chegam limpos

### Prioridade média

- blocos redundantes de [service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/logistica/service.py)

Critério para remover:
- saneamento dos dados legados de estoque, materiais e TPD
- revisão das exportações do P4 após remoção parcial

### Prioridade alta de cuidado

- normalizadores de [service.py](/c:/Users/Telematica/Documents/erp5bprv/backend/app/modules/rh/service.py)

Critério para remover:
- validação de ficha individual
- validação de PDF
- validação de blocos históricos do policial

## Estratégia segura para próximas rodadas

1. observar os módulos em homologação e registrar ocorrências reais de texto legado
2. simplificar primeiro Dashboard e Telemática
3. depois simplificar Logística em blocos pequenos
4. deixar RH por último, com teste orientado a PDF e ficha

## Resumo executivo

Hoje, o legado restante está isolado e controlado.

- não é um problema estrutural do ERP
- não representa regressão funcional imediata
- funciona como camada de compatibilidade para dados antigos

A próxima limpeza deve ser seletiva e guiada por teste real, não por remoção massiva.
