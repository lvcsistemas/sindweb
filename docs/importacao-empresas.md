# Importacao de empresas do SQL Server legado

Origem: `SINDB.dbo.tb_empresas`

Destino: `public.empresas`

Script: `scripts/import-empresas.ps1`

## Regras gerais

- Antes da importacao, a tabela `public.empresas` e truncada.
- O campo `ID_EMPRESA` do legado e gravado como `empresas.id`.
- As chaves auxiliares ficam zeradas conforme definido:
  - `estabelecimento_id = 0`
  - `estabelecimento_tipo_id = 0`
  - `escritorio_id = 0`
  - `ramo_atividade_id = 0`
  - `convencao_id = 0`
  - `cnae_id = 0`
- O script solta temporariamente FKs que apontam para `empresas`, trunca/importa e recria as FKs ao final.
- A senha do SQL Server e o token de gerenciamento do Supabase nao ficam salvos no repositorio.

## Mapeamento

| SQL Server `tb_empresas` | Supabase `empresas` |
| --- | --- |
| `ID_EMPRESA` | `id` |
| `ATIVO` | `ativo` (`1 = S`, `0 = N`) |
| `DT_CADASTRO` | `created_at` |
| `DT_ALTERADO` | `updated_at` |
| `DT_INICIO` | `dt_inicio_atividades` |
| `NM_FANTASIA` | `nm_fantasia` |
| `RAZAO_SOCIAL` | `razao_social` |
| `ENDERECO` | `endereco` |
| sem origem | `numero = null` |
| `COMPLEMENTO` | `complemento` |
| `BAIRRO` | `bairro` |
| `CIDADE` | `cidade` |
| `UF` | `uf` |
| `CEP` | `cep` somente digitos |
| `CNPJ` | `cei_cnpj` somente digitos |
| `TIPO_INSCRICAO` | `tipo_cei_cnpj` (`1 = CNPJ`, `2 = CEI`) |
| `INSC_ESTADUAL` | `insc_estadual` |
| `RESPONSAVEL` | `nm_contato1` |
| `RESP_SINDICALIZACAO` | `nm_contato2` |
| `CONTATO` | `nm_contato3` |
| `EMAIL1` | `email1` |
| sem origem | `email2 = null` |
| sem origem | `email3 = null` |
| `SITE` | `site` |
| `TEL1` | `tel1` somente digitos |
| `TEL2` | `tel2` somente digitos |
| `TEL3` | `tel3` somente digitos |
| `OBS` | `obs` |
| `VLR_CSOCIAL` | `capital_social` |
| `FOTO` | nao importado; `logo_path = null` |

## Como executar

Primeiro rode em modo conferencia, sem alterar o Supabase:

```powershell
$env:LEGACY_SQLSERVER_PASSWORD = "<senha>"
$env:SUPABASE_ACCESS_TOKEN = "<token-supabase>"
$env:SUPABASE_PROJECT_REF = "qpylbiywcpvcxrroljmj"
.\scripts\import-empresas.ps1
```

Depois execute a importacao:

```powershell
.\scripts\import-empresas.ps1 -Execute
```
