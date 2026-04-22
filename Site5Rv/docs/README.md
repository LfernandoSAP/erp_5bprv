# Portal Institucional 5º BPRv

## Objetivo

Este diretório reúne a documentação do novo portal institucional do `5º Batalhão de Polícia Rodoviária`.

O projeto foi desenvolvido do zero em `Laravel`, substituindo o antigo site em `WordPress/PHP` legado, com foco em:

- compatibilidade com `PHP 8.3+`
- compatibilidade com `MySQL` atual
- segurança e manutenção facilitada
- implantação simples em `Apache`
- visual institucional sóbrio e responsivo

## Escopo inicial

O portal está dividido em duas áreas:

- área pública institucional
- área administrativa autenticada

Os módulos iniciais previstos são:

- autenticação de usuários
- páginas institucionais
- notícias e publicações
- banners e destaques
- galerias e fotos
- configurações básicas do portal

## Stack definida

- `Laravel` atualizado e compatível com `PHP 8.3`
- `Blade`
- `Bootstrap 5`
- `Eloquent ORM`
- `MySQL`
- autenticação leve com `Laravel Breeze`

## Estrutura desta documentação

- [arquitetura.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/arquitetura.md)
- [comandos-iniciais.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/comandos-iniciais.md)
- [instalacao-windows-php-composer.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/instalacao-windows-php-composer.md)
- [plano-fase-1.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/plano-fase-1.md)
- [padroes.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/padroes.md)
- [deploy-apache.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/deploy-apache.md)
- [deploy-cpd-pmesp.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/deploy-cpd-pmesp.md)
- [checklist-homologacao.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/checklist-homologacao.md)
- [publicacao-smb.md](C:/Users/Telematica/Documents/erp5bprv/Site5Rv/docs/publicacao-smb.md)

## Diretriz de isolamento

Este portal foi isolado em [Site5Rv](C:/Users/Telematica/Documents/erp5bprv/Site5Rv) para não conflitar com o ERP já existente na raiz do repositório.

Toda a implementação do novo portal deve ficar dentro dessa pasta.
