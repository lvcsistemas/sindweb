# SindWeb

Sistema web do LSIND em Vite, React, TypeScript e Supabase.

## Stack

- Vite + React + TypeScript
- Supabase Auth, Postgres, Storage e RLS
- TanStack Query
- React Hook Form + Zod

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie `.env` com:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. Execute:

```bash
npm run dev
```

## Supabase

A migration inicial está em `supabase/migrations/20260701120000_initial_sindweb.sql` e cria a fundação para:

- Supabase Auth + `profiles`
- módulos e permissões
- empresas
- associados
- dependentes
- auditoria
- bucket `associados-fotos`
- RLS
- função `save_associado`

## Primeiro módulo

O módulo inicial é `Associados`, com login protegido, busca, listagem, formulário, validação de CPF, upload de foto e gravação via função SQL.

## Próximos passos

- Aplicar a migration no Supabase.
- Criar o primeiro usuário administrador.
- Importar dados do SQL Server antigo.
- Expandir módulos de Empresas, Dependentes, Contribuições e Financeiro.
