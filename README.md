# My FinanceControlV2

Versao 2.0 do My Finance Control, com foco em transformar o app web atual em um produto com persistencia relacional, autenticacao e sincronizacao correta via Supabase.

## Decisao inicial de stack

- Frontend: React + Vite + TypeScript, preservando a base atual do projeto web.
- Banco e Auth: Supabase Auth + Supabase Postgres com RLS.
- Hospedagem recomendada: Vercel para o frontend estatico Vite, Supabase para banco/auth/storage.
- Persistencia local opcional: IndexedDB/Dexie pode continuar como cache/offline, mas deixa de ser a fonte de verdade.
- Validacao: Zod no cliente e constraints/policies no banco.
- Tipos de banco: gerar tipos TypeScript a partir do schema Supabase.

## Estrutura

```text
.
├── docs/
│   ├── 00-avaliacao-sistema-atual.md
│   ├── 01-infraestrutura-recomendada.md
│   ├── 02-modelo-relacional-supabase.md
│   ├── 03-plano-de-migracao.md
│   └── 04-setup-desenvolvimento.md
├── supabase/
│   └── migrations/
│       └── 202608200001_initial_relational_schema.sql
└── web/
    ├── README.md
    ├── package.json
    └── .env.example
```

## Proximos passos sugeridos

1. Criar ou linkar um projeto Supabase.
2. Aplicar a migration inicial em ambiente local.
3. Copiar gradualmente a UI da pasta antiga `MyAndroidCustomApps/web`.
4. Substituir a camada Dexie/snapshot por repositorios Supabase.
5. Importar dados antigos usando o export JSON schema version 10.
