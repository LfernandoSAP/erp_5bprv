# Codificacao e Textos

## Objetivo

Registrar o padrao adotado pelo ERP 5BPRv para evitar textos corrompidos, mojibake e inconsistencias visuais em PT-BR.

## Regra principal

- todos os arquivos-fonte do projeto devem ser salvos em `UTF-8`
- textos visiveis ao usuario devem permanecer em `PT-BR`
- novos modulos, clones de tela e utilitarios compartilhados precisam ser revisados apos criacao para evitar reaproveitar conteudo com encoding incorreto

## Riscos ja observados no projeto

Os principais sintomas ja encontrados foram:

- texto de "belico" exibido com caracteres quebrados
- texto de "manutencao" exibido com interrogacoes
- texto de "Relatorio" exibido com mojibake
- texto de "Concessionaria" exibido com mojibake
- duplicacao de labels e rotulos institucionais

Esses problemas ja apareceram em:

- frontend
- documentacao
- comentarios de bootstrap
- dados legados gravados no banco

## Estrategia adotada

### 1. Corrigir na origem

Sempre que possivel:

- regravar o arquivo-fonte em `UTF-8`
- corrigir o texto diretamente no componente, utilitario ou documento
- evitar manter texto corrompido mesmo em comentarios ou arquivos auxiliares

### 2. Blindagem no frontend

Em modulos mais sensiveis, o frontend pode aplicar normalizacao defensiva de texto para proteger a renderizacao.

Modulos onde isso ja foi aplicado:

- `Estoque/Manutencao`
- `Material Belico`

Objetivo:

- impedir que registros antigos com texto corrompido reaparecam na UI
- manter listagens, cards, relatorios e formularios legiveis mesmo durante a transicao

### 3. Blindagem no backend

Quando o problema tambem existe em dados legados, o backend pode normalizar campos antes de devolver a resposta da API.

Objetivo:

- devolver JSON ja saneado
- reduzir dependencia do frontend para "consertar" dados
- preservar compatibilidade durante limpeza gradual do banco

### 4. Correcao no banco

Quando forem encontrados dados antigos realmente gravados com encoding inconsistente:

- corrigir os registros existentes
- validar os textos mais visiveis do modulo afetado
- confirmar no banco os valores finais esperados

## Procedimento recomendado apos mudancas

Sempre que houver:

- criacao de novo modulo
- copia de telas existentes
- inclusao de novos textos institucionais
- alteracao de menu lateral
- criacao de relatorios/exportacoes

executar:

1. varredura por mojibake no codigo-fonte
2. revisao visual das telas principais do fluxo alterado
3. validacao de `lint`
4. se necessario, checagem de dados ja gravados no banco

## Observacao importante

A presenca de saneamento defensivo nao substitui a correcao na origem.

O padrao do projeto continua sendo:

- codigo limpo em `UTF-8`
- dados corretos no banco
- saneamento apenas como protecao complementar
