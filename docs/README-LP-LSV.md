# LP x LSV

Foi mantida a separação entre os módulos `Bloco LP` e `Bloco LSV` no `P1 - Recursos Humanos`.

## Estado atual

- `Bloco LP`
  - é o módulo operacional ativo
  - usa rota própria: `/api/lp`
  - usa tabelas próprias: `rh.lp_registros` e `rh.lp_blocos`
  - recebeu a regra nova por tipo de bloco:
    - `Fruição`
    - `Conversão em Pecúnia`

- `Bloco LSV`
  - permanece separado na navegação
  - está reservado para implementação futura
  - não é o fluxo operacional ativo neste momento

## Motivo da decisão

A regra nova de formulário por tipo havia sido aplicada no `LSV`, mas a necessidade funcional real era no `LP`.

Para evitar mistura de domínio:

- a regra foi portada para o `Bloco LP`
- o `Bloco LSV` voltou a funcionar apenas como card reservado

## Impacto técnico

- frontend
  - `Bloco LP` agora usa o formulário novo com campos condicionais por tipo
  - `Bloco LSV` voltou para a tela institucional reservada

- backend
  - `LP` ganhou compatibilidade com os campos:
    - `tipo_bloco`
    - `dias`
    - `inicio_gozo`
    - `boletim_interno`
    - `mes_conversao`
    - `pecunia_bol_g`
  - a serialização do `LP` mantém fallback para dados antigos

- banco
  - `rh.lp_blocos` recebeu as colunas novas
  - as colunas antigas do modelo anterior foram preservadas por compatibilidade

## Observação

No momento desta separação, as contagens verificadas estavam assim:

- `lp_registros = 0`
- `lsv_registros = 0`

Ou seja, nesta base atual não houve risco de conversão de registros já cadastrados ao portar a regra para o `LP`.

