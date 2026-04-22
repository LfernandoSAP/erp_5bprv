# Documentação do ERP 5BPRv

## Como esta pasta está organizada

Esta pasta foi organizada em três blocos de leitura.

### 1. Estado atual do sistema

Arquivos que representam a referência principal do projeto hoje:

- [estado-atual.md](C:/Users/Telematica/Documents/erp5bprv/docs/estado-atual.md)
- [README-ARQUITETURA.md](C:/Users/Telematica/Documents/erp5bprv/docs/README-ARQUITETURA.md)
- [HANDOVER-TECNICO.md](C:/Users/Telematica/Documents/erp5bprv/docs/HANDOVER-TECNICO.md)
- [api.md](C:/Users/Telematica/Documents/erp5bprv/docs/api.md)

### 2. Operação e homologação

Arquivos voltados para uso prático, validação e acompanhamento:

- [homologacao.md](C:/Users/Telematica/Documents/erp5bprv/docs/homologacao.md)
- [operacao-local.md](C:/Users/Telematica/Documents/erp5bprv/docs/operacao-local.md)
- [codificacao-e-textos.md](C:/Users/Telematica/Documents/erp5bprv/docs/codificacao-e-textos.md)
- [flows.md](C:/Users/Telematica/Documents/erp5bprv/docs/flows.md)
- [rules.md](C:/Users/Telematica/Documents/erp5bprv/docs/rules.md)
- [business-rules.md](C:/Users/Telematica/Documents/erp5bprv/docs/business-rules.md)
- [modules/README.md](C:/Users/Telematica/Documents/erp5bprv/docs/modules/README.md)
- [agents/README.md](C:/Users/Telematica/Documents/erp5bprv/docs/agents/README.md)

### 3. Histórico e decisões

Arquivos que preservam decisões e contexto de evolução:

- [decisions.md](C:/Users/Telematica/Documents/erp5bprv/docs/decisions.md)
- [cleanup-backlog.md](C:/Users/Telematica/Documents/erp5bprv/docs/cleanup-backlog.md)
- [README-LP-LSV.md](C:/Users/Telematica/Documents/erp5bprv/docs/README-LP-LSV.md)

## Ordem recomendada de leitura

1. [estado-atual.md](C:/Users/Telematica/Documents/erp5bprv/docs/estado-atual.md)
2. [README-ARQUITETURA.md](C:/Users/Telematica/Documents/erp5bprv/docs/README-ARQUITETURA.md)
3. [HANDOVER-TECNICO.md](C:/Users/Telematica/Documents/erp5bprv/docs/HANDOVER-TECNICO.md)
4. [api.md](C:/Users/Telematica/Documents/erp5bprv/docs/api.md)
5. [homologacao.md](C:/Users/Telematica/Documents/erp5bprv/docs/homologacao.md)
6. [modules/README.md](C:/Users/Telematica/Documents/erp5bprv/docs/modules/README.md)
7. [agents/README.md](C:/Users/Telematica/Documents/erp5bprv/docs/agents/README.md)

## Resumo executivo

O ERP 5BPRv está organizado como um monólito modular, com:

- frontend em `React + Vite`
- backend em `FastAPI + SQLAlchemy`
- persistência principal em `PostgreSQL`
- compatibilidade local e legado com `SQLite`
- evolução incremental com foco em preservar a operação

O sistema já cobre:

- autenticação e autorização institucional
- dashboard
- navegação por cards e hubs
- policiais
- quinquênio
- previsão de rancho
- controle de velocidade noturno
- planilha de acidentes de viatura
- unidades e setores
- usuários
- materiais e estoque
- material bélico
- frota
- TPD/Talonário
- LP, LSV e Controle de Efetivo
- exportação em `Excel` e `PDF`
- auditoria de segurança

## Observação importante

Quando houver divergência entre documentos:

- [estado-atual.md](C:/Users/Telematica/Documents/erp5bprv/docs/estado-atual.md) e [README-ARQUITETURA.md](C:/Users/Telematica/Documents/erp5bprv/docs/README-ARQUITETURA.md) devem ser tratados como referência principal do estado atual
- [HANDOVER-TECNICO.md](C:/Users/Telematica/Documents/erp5bprv/docs/HANDOVER-TECNICO.md) deve ser tratado como material de transferência, venda técnica e onboarding
- [agents/README.md](C:/Users/Telematica/Documents/erp5bprv/docs/agents/README.md) deve ser tratado como base operacional para agentes e skills
- [decisions.md](C:/Users/Telematica/Documents/erp5bprv/docs/decisions.md) deve ser tratado como histórico de evolução
