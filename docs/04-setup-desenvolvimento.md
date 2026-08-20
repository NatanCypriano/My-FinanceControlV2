# 04 - Setup De Desenvolvimento

## Requisitos

- Node.js LTS.
- npm.
- Supabase CLI.
- Conta Supabase.
- Conta Vercel.

## Ambiente local

```bash
cd "C:\Users\Natan\Documents\Finance Control 2.0"
supabase init
supabase start
supabase db reset
cd web
npm install
npm run dev
```

## Variaveis

Crie `web/.env.local` a partir de `web/.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Scripts planejados

No `web/package.json`:

- `npm run dev`: servidor Vite.
- `npm run build`: typecheck e build de producao.
- `npm test`: testes unitarios.
- `npm run lint`: lint quando a configuracao for adicionada.

## Banco

Fluxo recomendado:

```bash
supabase migration new nome_da_mudanca
supabase db reset
supabase db push
```

Depois de alterar schema:

```bash
supabase gen types typescript --local > web/src/backend/database.types.ts
```

## Deploy

Na Vercel:

- Root directory: `web`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Variaveis:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

