$files = @(
  'frontend/src/pages/FleetVehiclesPage.jsx',
  'frontend/src/pages/FleetGeneralControlPage.jsx'
)
$replacements = @(
  @('CONCESSIONÃRIA','CONCESSIONÁRIA'),
  @('Baixa MecÃ¢nica','Baixa Mecânica'),
  @('BordÃ´','Bordô'),
  @('ElÃ©trico','Elétrico'),
  @('HÃ­brido','Híbrido'),
  @('AutomÃ³vel','Automóvel'),
  @('Van/UtilitÃ¡rio','Van/Utilitário'),
  @('CaminhÃ£o','Caminhão'),
  @('Ã”nibus/Micro-Ã´nibus','Ônibus/Micro-ônibus'),
  @('CitroÃ«n','Citroën'),
  @('SÃ©rie 3','Série 3'),
  @('vÃ­nculos','vínculos'),
  @('revisÃ£o','revisão'),
  @('identificaÃ§Ã£o','identificação'),
  @('patrimÃ´nio','patrimônio'),
  @('botÃ£o','botão'),
  @('responsÃ¡vel','responsável'),
  @('SubmÃ³dulo','Submódulo'),
  @('mÃ³dulo','módulo'),
  @('PatrimÃ´nio','Patrimônio'),
  @('SituaÃ§Ã£o','Situação'),
  @('NÂº','Nº'),
  @('InÃ­cio','Início'),
  @('TÃ©rmino','Término'),
  @('VigÃªncia','Vigência'),
  @('Ãšltima RevisÃ£o','Última Revisão'),
  @('KM RevisÃ£o','KM Revisão'),
  @('NÃ£o','Não'),
  @('vÃ¡lida','válida'),
  @('opÃ§Ã£o','opção'),
  @('Consulta do mÃ³dulo','Consulta do módulo'),
  @('visÃ­veis','visíveis'),
  @('detenÃ§Ã£o','detenção'),
  @('IdentificaÃ§Ã£o da viatura','Identificação da viatura'),
  @('DetenÃ§Ã£o e situaÃ§Ã£o','Detenção e situação'),
  @('concessionÃ¡ria','concessionária'),
  @('Policial responsÃ¡vel','Policial responsável'),
  @('NÃ£o vincular','Não vincular'),
  @('Contrato e documentaÃ§Ã£o','Contrato e documentação'),
  @('IdentificaÃ§Ã£o tÃ©cnica','Identificação técnica'),
  @('VÃ­nculos operacionais','Vínculos operacionais'),
  @('Ãšltima revisÃ£o','Última revisão'),
  @('Data da Ãºltima revisÃ£o','Data da última revisão'),
  @('ObservaÃ§Ãµes','Observações'),
  @('Salvar alteraÃ§Ãµes','Salvar alterações'),
  @('atÃ©','até'),
  @('AÃ§Ãµes','Ações'),
  @('visÃ£o operacional Ãºnica','visão operacional única'),
  @('situaÃ§Ã£o da viatura','situação da viatura'),
  @('CombustÃ­vel','Combustível'),
  @('visÃ£o','visão')
)
foreach ($file in $files) {
  $content = Get-Content -Raw -Path $file
  foreach ($pair in $replacements) {
    $content = $content.Replace($pair[0], $pair[1])
  }
  Set-Content -Path $file -Value $content -Encoding UTF8
}
