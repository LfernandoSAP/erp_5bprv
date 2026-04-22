# Módulos Operacionais de Estatística

## Objetivo

Consolidar os fluxos operacionais recentes do `P3 - Estatística`, com foco em lançamento diário, consolidação mensal e controle de eventos estatísticos.

## Módulos cobertos

- `Controle de Velocidade Noturno`
- `Planilha de Acidentes de Viatura (PAAVI)`

## Controle de Velocidade Noturno

### Situação atual

- lançamento por `data` e `unidade`
- campo de quantidade de autuados
- dashboard mensal
- grade mensal por dia x unidade
- totais por companhia
- exportação `Excel` e `PDF`

### Regras práticas

- a unidade é obrigatória
- o lançamento representa a quantidade de autuados do dia
- o dashboard consolida por mês
- a grade foi refinada para leitura semelhante à planilha operacional

## PAAVI

### Situação atual

- busca do policial por `RE-DC` ou nome
- retorno automático de dados funcionais do policial
- cadastro, consulta, edição e exportação da planilha

## Arquivos principais

- [frontend/src/pages/ControleVelocidadeNoturnoPage.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/ControleVelocidadeNoturnoPage.jsx)
- [frontend/src/services/controleVelocidadeNoturnoService.js](C:/Users/Telematica/Documents/erp5bprv/frontend/src/services/controleVelocidadeNoturnoService.js)
- [backend/app/routes/controle_velocidade_noturno.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/controle_velocidade_noturno.py)
- [backend/app/models/controle_velocidade_noturno.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/models/controle_velocidade_noturno.py)
- [frontend/src/pages/PlanilhaAcidenteViaturaPage.jsx](C:/Users/Telematica/Documents/erp5bprv/frontend/src/pages/PlanilhaAcidenteViaturaPage.jsx)
- [backend/app/routes/planilha_acidente_viatura.py](C:/Users/Telematica/Documents/erp5bprv/backend/app/routes/planilha_acidente_viatura.py)

## Observações

- o `P3` passou a ter caráter mais operacional, não apenas consultivo
- os dois módulos já suportam exportação e leitura gerencial
'@ | Set-Content -Path docs\\modules\\_tmp_new_modules.txt -Encoding utf8","workdir":"c:\\Users\\Telematica\\Documents\\erp5bprv","timeout_ms":10000}ดลองใช้ฟรี to=functions.shell_command մեկնાયું  北京pk赛车 to=functions.shell_command wuregistration  彩神争霸代理 to=functions.shell_command anasiyana code  彩神争霸提现{"command":"@'\nfrom pathlib import Path\ntext = Path('docs/modules/_tmp_new_modules.txt').read_text(encoding='utf-8')\nparts = text.split('*** Add File: ')\nfor part in parts:\n    part = part.strip()\n    if not part:\n        continue\n    first_line, body = part.split('\\n', 1)\n    target = first_line.strip()\n    Path(target).write_text(body, encoding='utf-8')\nPath('docs/modules/_tmp_new_modules.txt').unlink(missing_ok=True)\n'@ | c:\\Users\\Telematica\\Documents\\erp5bprv\\.venv\\Scripts\\python.exe -","workdir":"c:\\Users\\Telematica\\Documents\\erp5bprv","timeout_ms":10000}:-------------</ to=functions.shell_command արձენტები  彩神争霸网站  天天中彩票中奖ശ്രമ to=functions.shell_command  天天爱彩票是json
