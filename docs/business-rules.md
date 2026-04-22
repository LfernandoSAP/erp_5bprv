# Regras de Negócio

## Regra principal do ERP

O sistema representa a estrutura administrativa do `5BPRv - EM` e das companhias subordinadas.

O `5BPRv - EM` é a unidade principal e deve ter visão global sobre o sistema.

As unidades subordinadas são:

- `1Cia`
- `2Cia`
- `3Cia`
- `4Cia`

## Regra de visibilidade por unidade

- cada registro operacional deve estar vinculado a uma unidade
- usuário comum enxerga apenas dados da própria unidade
- usuários das CIAs não podem consultar ou alterar dados de outras CIAs
- usuários do `5BPRv - EM` podem consultar dados de todas as unidades subordinadas
- o backend deve aplicar esse filtro automaticamente

## Regra de perfil de acesso

Perfis previstos para evolução:

- `ADMIN_GLOBAL`
- `ADMIN_UNIDADE`
- `OPERADOR`
- `CONSULTA`

Regras esperadas:

- `ADMIN_GLOBAL`: visão total e administração global
- `ADMIN_UNIDADE`: gestão da própria unidade
- `OPERADOR`: operação da própria unidade
- `CONSULTA`: apenas leitura da própria unidade

### Comportamento atual aproximado

Mesmo antes da introdução formal de `role`, o sistema passou a seguir esta lógica:

- unidade com `can_view_all`: visão global
- usuário com `is_admin` sem visão global: administração local da própria unidade
- usuário sem `is_admin`: acesso restrito ao próprio escopo

## Unidades e setores

Cada usuário deve pertencer a:

- uma unidade
- opcionalmente um setor

Setores do `5BPRv - EM`:

- `P1`
- `P2`
- `P3`
- `P4`
- `P5`
- `UGE/Convênios`
- `PJMD`
- `Sala de Operações`
- `Telemática`

Setores previstos para as CIAs:

- `P1`
- `P3`
- `P4`
- `P5`
- `UGE/Convênios`
- `PJMD`
- `Sala de Operações`
- `Telemática`

## Cadastro de materiais

Todo material deve ser vinculado à unidade correta.

Campos básicos esperados:

- nome
- categoria
- número de série, quando existir
- patrimônio, quando existir
- localização
- status
- observações
- unidade responsável

Regras:

- materiais ativos aparecem nas listagens principais
- materiais inativados não devem desaparecer do histórico
- número de série deve ser único quando aplicável
- alterações importantes devem gerar log

## Entrada e saída de material

Movimentações devem registrar:

- item movimentado
- origem
- destino
- usuário responsável
- data da ação
- motivo

Toda movimentação deve respeitar a permissão do usuário e o escopo da unidade.

## Estoque e patrimônio

Regras iniciais:

- itens devem possuir status padronizado
- itens ativos e inativos devem ser controlados
- histórico deve permitir rastreamento mínimo das alterações
- a unidade dona do item deve permanecer clara

## Usuários

Regras iniciais:

- cada usuário deve estar vinculado a uma unidade
- apenas perfis autorizados podem criar outros usuários
- senha nunca deve ser salva em texto puro
- login deve gerar token autenticado

## Permissões

Permissões devem ser aplicadas no backend.

O frontend pode esconder botões e menus por usabilidade, mas isso não substitui validação real.

## Status de item

Status previstos no estado atual e na evolução:

- `EM_USO`
- `EM_ESTOQUE`
- `EM_MANUTENÇÃO`
- `BAIXADO`
- outros status controlados por tabela ou constante centralizada

## Fluxo de aprovação

Ainda não existe fluxo formal de aprovação implementado no projeto atual.

Direção sugerida:

- registrar solicitação
- validar permissão do solicitante
- permitir aprovação por perfil autorizado
- registrar log da aprovação

Esse fluxo deve ser implementado apenas quando houver regra de negócio confirmada.

## Material bélico

O módulo de material bélico deve permanecer separado do módulo de materiais comuns.

Motivos:

- possui campos específicos
- possui controle mais sensível
- pode exigir permissões mais restritas no futuro

## Regra de crescimento do sistema

Qualquer novo módulo deve nascer com:

- vínculo de unidade
- regra clara de permissão
- validação no backend
- documentação em `docs/modules/`
