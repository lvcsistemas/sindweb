param(
  [switch]$Execute,
  [int]$BatchSize = 250
)

$ErrorActionPreference = "Stop"

function Require-Env($name) {
  $value = [Environment]::GetEnvironmentVariable($name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    $value = [Environment]::GetEnvironmentVariable($name, "User")
  }
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Variavel de ambiente obrigatoria ausente: $name"
  }
  return $value
}

function Optional-Env($name, $fallback) {
  $value = [Environment]::GetEnvironmentVariable($name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    $value = [Environment]::GetEnvironmentVariable($name, "User")
  }
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $fallback
  }
  return $value
}

function DbValue {
  param([System.Data.DataRow]$row, [string]$name)
  $value = $row.Item($name)
  if ($null -eq $value -or $value -is [DBNull]) {
    return $null
  }
  return $value
}

function Clean-String($value, [int]$maxLength) {
  if ($null -eq $value) {
    return $null
  }
  $text = ([string]$value).Trim()
  if ($text.Length -eq 0) {
    return $null
  }
  if ($text.Length -gt $maxLength) {
    return $text.Substring(0, $maxLength)
  }
  return $text
}

function Only-Digits($value, [int]$maxLength) {
  $text = Clean-String $value 4000
  if ($null -eq $text) {
    return $null
  }
  $digits = [regex]::Replace($text, "\D", "")
  if ($digits.Length -eq 0) {
    return $null
  }
  if ($digits.Length -gt $maxLength) {
    return $digits.Substring(0, $maxLength)
  }
  return $digits
}

function Date-Only($value) {
  if ($null -eq $value) {
    return $null
  }
  return ([datetime]$value).ToString("yyyy-MM-dd")
}

function Date-Time-Iso($value) {
  if ($null -eq $value) {
    return (Get-Date).ToUniversalTime().ToString("o")
  }
  return ([datetime]$value).ToUniversalTime().ToString("o")
}

function To-Decimal($value) {
  if ($null -eq $value) {
    return 0
  }
  return [math]::Round([decimal]$value, 2)
}

function Invoke-SupabaseSql($sql) {
  $body = ([pscustomobject]@{ query = $sql }) | ConvertTo-Json -Compress
  $response = Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.supabase.com/v1/projects/$script:SupabaseProjectRef/database/query" `
    -Headers @{ Authorization = "Bearer $script:SupabaseAccessToken"; "Content-Type" = "application/json" } `
    -Body $body
  return @($response.value)
}

function Sql-Literal($value) {
  if ($null -eq $value) {
    return "null"
  }
  if ($value -is [int] -or $value -is [long] -or $value -is [decimal] -or $value -is [double]) {
    return $value.ToString([Globalization.CultureInfo]::InvariantCulture)
  }
  $text = ([string]$value).Replace("'", "''")
  return "'$text'"
}

function Invoke-SupabaseInsert($rows) {
  if ($rows.Count -eq 0) {
    return
  }

  $columns = @(
    "id",
    "user_resp_id",
    "estabelecimento_id",
    "estabelecimento_tipo_id",
    "escritorio_id",
    "ramo_atividade_id",
    "convencao_id",
    "cnae_id",
    "tipo_cei_cnpj",
    "dt_inicio_atividades",
    "ativo",
    "razao_social",
    "nm_fantasia",
    "cei_cnpj",
    "insc_estadual",
    "nm_contato1",
    "nm_contato2",
    "nm_contato3",
    "email1",
    "email2",
    "email3",
    "tel1",
    "tel2",
    "tel3",
    "site",
    "endereco",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "uf",
    "cep",
    "capital_social",
    "logo_path",
    "obs",
    "created_at",
    "updated_at"
  )

  $values = foreach ($row in @($rows)) {
    $rowValues = foreach ($column in $columns) {
      Sql-Literal $row.$column
    }
    "(" + ($rowValues -join ",") + ")"
  }

  $sql = "insert into public.empresas (" + ($columns -join ",") + ") values " + ($values -join ",") + ";"
  Invoke-SupabaseSql $sql | Out-Null
}

function Get-LegacyRows() {
  $server           = Optional-Env "LEGACY_SQLSERVER_SERVER" "sintacluns.no-ip.org,8888"
  $database         = Optional-Env "LEGACY_SQLSERVER_DATABASE" "SINDB"
  $user             = Optional-Env "LEGACY_SQLSERVER_USER" "mago"
  $password         = Require-Env "LEGACY_SQLSERVER_PASSWORD"
  $connectionString = Optional-Env "LEGACY_SQLSERVER_CONNECTION" "Data Source=$server;Network Library=DBMSSOCN;Persist Security Info=False;Initial Catalog=$database;User ID=$user;Password=$password;TrustServerCertificate=True"
  $query = @"
select
  ID_EMPRESA,
  ATIVO,
  DT_CADASTRO,
  DT_ALTERADO,
  DT_INICIO,
  NM_FANTASIA,
  RAZAO_SOCIAL,
  ENDERECO,
  COMPLEMENTO,
  BAIRRO,
  CIDADE,
  UF,
  CEP,
  CNPJ,
  INSC_ESTADUAL,
  RESPONSAVEL,
  RESP_SINDICALIZACAO,
  CONTATO,
  EMAIL1,
  SITE,
  TEL1,
  TEL2,
  TEL3,
  OBS,
  TIPO_INSCRICAO,
  VLR_CSOCIAL
from dbo.tb_empresas
order by ID_EMPRESA
"@

  $table                  = New-Object System.Data.DataTable
  $connection             = New-Object System.Data.SqlClient.SqlConnection $connectionString
  $command                = $connection.CreateCommand()
  $command.CommandText    = $query
  $command.CommandTimeout = 120
  $adapter                = New-Object System.Data.SqlClient.SqlDataAdapter $command
  [void]$adapter.Fill($table)
  return ,$table
}

function Convert-Empresa {
  param([System.Data.DataRow]$row)
  $id       = [int](DbValue $row "ID_EMPRESA")
  $fantasia = Clean-String (DbValue $row "NM_FANTASIA") 50
  $razao    = Clean-String (DbValue $row "RAZAO_SOCIAL") 100
  if ($null -eq $fantasia) {
    $fantasia = $razao
  }
  if ($null -eq $razao) {
    $razao = $fantasia
  }
  if ($null -eq $fantasia) {
    $fantasia = "EMPRESA $id"
  }
  if ($null -eq $razao) {
    $razao = $fantasia
  }

  $documento = Only-Digits (DbValue $row "CNPJ") 14
  if ($null -eq $documento) {
    $documento = "LEGACY$id"
  }

  $tipoInscricao = Clean-String (DbValue $row "TIPO_INSCRICAO") 1
  $tipoCeiCnpj = 1
  if ($tipoInscricao -eq "2" -or $documento.Length -ne 14) {
    $tipoCeiCnpj = 2
  }

  $ativo = "S"
  $ativoLegacy = DbValue $row "ATIVO"
  if ($null -ne $ativoLegacy -and [bool]$ativoLegacy -eq $false) {
    $ativo = "N"
  }

  $createdAt = Date-Time-Iso (DbValue $row "DT_CADASTRO")
  $updatedAtValue = DbValue $row "DT_ALTERADO"
  if ($null -eq $updatedAtValue) {
    $updatedAtValue = DbValue $row "DT_CADASTRO"
  }

  $uf = Clean-String (DbValue $row "UF") 2
  if ($null -eq $uf) {
    $uf = "RJ"
  }

  return [pscustomobject][ordered]@{
    id                      = $id
    user_resp_id            = "0"
    estabelecimento_id      = 0
    estabelecimento_tipo_id = 0
    escritorio_id           = 0
    ramo_atividade_id       = 0
    convencao_id            = 0
    cnae_id                 = 0
    tipo_cei_cnpj           = $tipoCeiCnpj
    dt_inicio_atividades    = Date-Only (DbValue $row "DT_INICIO")
    ativo                   = $ativo
    razao_social            = $razao
    nm_fantasia             = $fantasia
    cei_cnpj                = $documento
    insc_estadual           = Clean-String (DbValue $row "INSC_ESTADUAL") 25
    nm_contato1             = Clean-String (DbValue $row "RESPONSAVEL") 40
    nm_contato2             = Clean-String (DbValue $row "RESP_SINDICALIZACAO") 40
    nm_contato3             = Clean-String (DbValue $row "CONTATO") 40
    email1                  = Clean-String (DbValue $row "EMAIL1") 100
    email2                  = $null
    email3                  = $null
    tel1                    = Only-Digits (DbValue $row "TEL1") 11
    tel2                    = Only-Digits (DbValue $row "TEL2") 11
    tel3                    = Only-Digits (DbValue $row "TEL3") 11
    site                    = Clean-String (DbValue $row "SITE") 100
    endereco                = Clean-String (DbValue $row "ENDERECO") 50
    numero                  = $null
    complemento             = Clean-String (DbValue $row "COMPLEMENTO") 30
    bairro                  = Clean-String (DbValue $row "BAIRRO") 30
    cidade                  = Clean-String (DbValue $row "CIDADE") 30
    uf                      = $uf.ToUpperInvariant()
    cep                     = Only-Digits (DbValue $row "CEP") 10
    capital_social          = To-Decimal (DbValue $row "VLR_CSOCIAL")
    logo_path               = $null
    obs                     = Clean-String (DbValue $row "OBS") 4000
    created_at              = $createdAt
    updated_at              = Date-Time-Iso $updatedAtValue
  }
}

$script:SupabaseAccessToken = Require-Env "SUPABASE_ACCESS_TOKEN"
$script:SupabaseProjectRef  = Optional-Env "SUPABASE_PROJECT_REF" "qpylbiywcpvcxrroljmj"

$legacyRows = Get-LegacyRows
$empresas   = New-Object System.Collections.Generic.List[object]
for ($rowIndex = 0; $rowIndex -lt $legacyRows.Rows.Count; $rowIndex++) {
  $currentRow = $legacyRows.Rows.Item($rowIndex)
  $empresas.Add((Convert-Empresa -row $currentRow))
}

$duplicateDocs = $empresas | Group-Object cei_cnpj | Where-Object { $_.Count -gt 1 }
if ($duplicateDocs.Count -gt 0) {
  $docs = ($duplicateDocs | Select-Object -First 10 | ForEach-Object { $_.Name }) -join ", "
  throw "Existem documentos duplicados no legado: $docs"
}

Write-Host "Empresas lidas do SQL Server: $($empresas.Count)"

if (-not $Execute) {
  Write-Host "Dry-run concluido. Rode novamente com -Execute para truncar e importar."
  return
}

$dropFkSql = @"
alter table public.associados drop constraint if exists associados_empresa_id_fkey;
alter table public.atendimento_homologacao drop constraint if exists atendimento_homologacao_empresa_id_fkey;
alter table public.empresas_contribuicoes drop constraint if exists empresas_contribuicoes_empresa_id_fkey;
alter table public.faturas drop constraint if exists faturas_empresa_id_fkey;
"@

$createFkSql = @"
alter table public.associados add constraint associados_empresa_id_fkey foreign key (empresa_id) references public.empresas(id);
alter table public.atendimento_homologacao add constraint atendimento_homologacao_empresa_id_fkey foreign key (empresa_id) references public.empresas(id);
alter table public.empresas_contribuicoes add constraint empresas_contribuicoes_empresa_id_fkey foreign key (empresa_id) references public.empresas(id) on delete cascade;
alter table public.faturas add constraint faturas_empresa_id_fkey foreign key (empresa_id) references public.empresas(id);
"@

Invoke-SupabaseSql @"
begin;
$dropFkSql
truncate table public.empresas restart identity;
commit;
"@ | Out-Null

$imported = 0
for ($i = 0; $i -lt $empresas.Count; $i += $BatchSize) {
  $end = [math]::Min($i + $BatchSize - 1, $empresas.Count - 1)
  $chunk = $empresas[$i..$end]
  Invoke-SupabaseInsert $chunk
  $imported += $chunk.Count
  Write-Host "Importadas: $imported / $($empresas.Count)"
}

$maxId = ($empresas | Measure-Object id -Maximum).Maximum
Invoke-SupabaseSql @"
begin;
$createFkSql
select setval(pg_get_serial_sequence('public.empresas', 'id'), greatest($maxId, 1), true);
commit;
"@ | Out-Null

$validationRows = @(Invoke-SupabaseSql "select count(*)::int as total, min(id)::int as menor_id, max(id)::int as maior_id from public.empresas;")
$validation     = $validationRows | Select-Object -First 1
if ($null -eq $validation) {
  throw "Nao foi possivel ler a validacao final no Supabase."
}
$totalImported = [int]$validation.total
if ($totalImported -ne $empresas.Count) {
  throw "Importacao inconsistente. SQL Server=$($empresas.Count), Supabase=$totalImported"
}

Write-Host "Importacao finalizada com sucesso."
Write-Host "Total no Supabase: $totalImported"
Write-Host "IDs: $($validation.menor_id) ate $($validation.maior_id)"
