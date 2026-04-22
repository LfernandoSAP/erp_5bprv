# Checklist de Homologação

## Objetivo

Este documento serve como roteiro prático para testes internos com usuários finais do ERP 5BPRv.

O foco aqui não é testar código, e sim validar:

- fluxo funcional
- clareza da interface
- consistência dos textos
- comportamento em desktop, tablet e smartphone
- exportação de relatórios

## Preparação do ambiente

Antes da rodada de homologação:

- subir o backend
- subir o frontend
- confirmar acesso com um perfil global
- confirmar acesso com um perfil local
- validar se a base de teste possui unidades, setores, usuários, policiais, materiais e históricos

## Validação geral

- abrir a aplicação em desktop
- abrir a aplicação em smartphone ou tablet
- confirmar que o menu lateral funciona em telas menores
- confirmar que o menu lateral mostra apenas módulos de 1º nível
- confirmar que o clique em cada módulo abre a tela de cards correspondente
- confirmar que erros e sucessos aparecem inline, sem depender de `alert`
- confirmar que os botões principais usam nomenclatura coerente com o módulo
- confirmar que as telas densas usam cards no mobile quando aplicável

## Navegação por cards

- validar a tela inicial de boas-vindas após login
- validar o hub de `P1 - Recursos Humanos`
- confirmar os cards `Controle de Bloco Quinquênio`, `Controle de Bloco Lic Prêmio` e `Controle de Fruição LSV` dentro de `P1`
- validar o card `Previsão de Rancho` em `Assuntos Gerais`
- validar os cards `Controle de Velocidade Noturno` e `Planilha de Acidentes de Viatura` dentro de `P3`
- validar o hub de `P4 - Logística/Frota`
- confirmar o botão `← Voltar` nos hubs de 2º nível
- confirmar destaque ativo do módulo no menu lateral durante formulários e submódulos

## Bateria autenticada registrada em 28/03/2026

Usuário de homologação utilizado:

- CPF: `16445111858`
- perfil validado: acesso autenticado com token JWT ativo

### Frota

- login autenticado: OK
- listagem de viaturas: OK
- detalhe de viatura: OK
- histórico de movimentações: OK
- criação controlada de registro de teste: OK
- movimentação controlada do registro criado: OK

Resultado registrado:

- viatura criada com prefixo `TESTE-FROTA-2803`
- registro criado com `id=2`
- movimentação criada com `id=1`
- unidade final após movimentação: `1Cia`

### Material Bélico

- login autenticado: OK
- listagem de registros: OK
- detalhe do item `19`: OK
- histórico de transferências do item `19`: OK
- criação controlada de munição de teste: OK
- transferência parcial por quantidade: OK

Resultado registrado:

- material criado com `id=27`
- lote `AUTHTEST-20260328`
- quantidade inicial de teste: `10`
- quantidade transferida: `4`
- saldo restante validado: `6`
- histórico de transferência criado: `1` registro

Observação:

- na primeira tentativa, o PowerShell falhou no parsing do corpo JSON com acentuação
- o fluxo do backend passou normalmente com payload ASCII controlado

### Romaneio

- busca do policial por `RE-DC`: OK
- leitura do romaneio existente: OK
- atualização do mesmo registro via `PUT`: OK

Resultado registrado:

- policial pesquisado: `117021-0`
- nome de guerra retornado: `F. Gonçalves`
- romaneio validado no registro `id=1`
- campo de calça confirmado: `Masculina - 42`

## Revisão operacional curta - 29/03/2026

### Infraestrutura

- `GET /health`: OK
- frontend local em `http://localhost:3000`: OK
- `npm run lint` no frontend: OK

### Autenticação

- login com usuário real de homologação: OK

### Leitura autenticada validada

- `P1 - Recursos Humanos`
  - detalhe do policial `117021-0`: OK
- `P4 - Materiais`
  - listagem principal: OK
  - quantidade retornada na revisão: `15`
- `P4 - Frota`
  - listagem principal: OK
  - quantidade retornada na revisão: `4`
- `P4 - Material Bélico`
  - listagem de `Municoes`: OK
  - quantidade retornada na revisão: `4`
- `P4 - Romaneio`
  - leitura do cadastro vinculado ao RE `117021-0`: OK
- `Telemática`
  - listagem de usuários: OK
  - quantidade retornada na revisão: `14`

### Escrita controlada

#### Estoque / Manutenção

- entrada autenticada de mercadoria: OK
- saída autenticada de mercadoria: OK
- leitura final do produto após movimentações: OK

Resultado registrado:

- produto de revisão criado automaticamente: `id=7`
- entrada validada: `8`
- saída validada: `3`
- saldo final validado: `5`

#### Materiais

- criação autenticada com payload mínimo ASCII: OK
- leitura do item criado: OK

Resultado registrado:

- item criado com `id=16`
- nome: `Material Minimo ASCII`
- categoria: `Diversos`

#### TPD / Talonário

- criação autenticada com payload mínimo ASCII: OK
- leitura do registro criado: OK

Resultado registrado:

- registro criado com `id=4`
- nome: `TPD Minimo ASCII`
- categoria: `Diversos`

## Ajuste fino final do P4 - 29/03/2026

Rodada final de acabamento visual e textual validada em:

- `Materiais`
- `TPD / Talonário`
- `Frota`
- `Material Bélico`
- `Romaneio`
- navegação central por cards

Pontos consolidados:

- textos críticos em PT-BR limpos
- catálogos compartilhados de `Frota` e `Material Bélico` saneados
- `TPD/Talonário` com criação e edição alinhadas na lógica de categoria
- `Materiais` e `TPD/Talonário` com acabamento visual equivalente
- navegação institucional e cards principais sem resíduos de encoding

## Critérios de aceite

Uma rodada pode ser considerada aprovada quando:

- os fluxos principais executam sem erro funcional
- os perfis respeitam o escopo esperado
- os relatórios exportam corretamente
- a aplicação permanece utilizável em smartphone e tablet
- os textos da interface fazem sentido para o usuário final
- não houver bloqueios graves de navegação, cadastro, edição ou movimentação

## Roteiro adicional de homologação - módulos novos

### P1 - Controle de Bloco Quinquênio

- buscar policial por `RE-DC`
- confirmar exibição de `data de admissão` e tempo de serviço
- validar cálculo dos blocos por ciclos de `1825 dias`
- registrar interrupção e confirmar recálculo
- registrar próximo bloco
- validar bloqueio de mais de `1 Pecúnia` por bloco

### Assuntos Gerais - Previsão de Rancho

- criar planejamento mensal
- adicionar PM pela base de policiais
- adicionar civil e visitante
- confirmar que sábados e domingos não aparecem na grade
- marcar `Café` e `Almoço`
- exportar planilha em `Excel`

### P3 - Controle de Velocidade Noturno

- cadastrar lançamento por data e unidade
- validar quantidade de autuados
- confirmar atualização do dashboard mensal
- conferir grade mensal por dia x unidade

### P3 - Planilha de Acidentes de Viatura

- buscar policial por `RE-DC` parcial ou nome
- confirmar retorno de `RE`, `Posto/Graduação` e `Nome`
- criar ficha `PAAVI`
- abrir detalhe, editar e excluir
- validar exportação `Excel` e `PDF`

## Revisão global de módulos - 30/03/2026

### Infraestrutura

- `GET /health`: OK
- frontend local em `http://localhost:3000`: OK
- backend local em `http://127.0.0.1:8000`: OK

### Escopo da revisão

- `P1 - Recursos Humanos`
- `P4 - Logística/Frota`
- `Telemática`
- `Dashboard`

### Itens validados

- saneamento de respostas da API para reduzir textos legados quebrados
- limpeza de retornos de `Materiais` e `TPD/Talonário`
- limpeza de retornos de `Usuários`
- limpeza de retornos de `Policiais`, `Setores` e `Unidades`
- revisão do bloco de PDF do policial em campos mais visíveis

### Resultado registrado

- módulos centrais seguem operacionais
- textos visíveis ficaram mais consistentes entre frontend e backend
- o residual encontrado em buscas técnicas ficou concentrado em mapas defensivos de saneamento, não em texto final de tela

