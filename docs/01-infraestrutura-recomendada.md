# 01 - Infraestrutura Recomendada

## Arquitetura alvo

```text
Usuario
  -> Web app React/Vite hospedado na Vercel
  -> Supabase Auth
  -> Supabase Postgres + RLS
  -> Supabase Storage futuramente, se houver anexos/comprovantes
```

## Recomendacao principal

Use:

- **Vercel** para hospedar o frontend Vite.
- **Supabase** para Auth, Postgres, migrations, Row Level Security e backups.
- **GitHub** como origem de deploy automatico.

Essa combinacao mantem o web app como SPA simples, evita backend proprio no primeiro momento e permite consultar o banco diretamente pelo cliente com seguranca via RLS.

## Por que nao manter snapshot como fonte principal

O snapshot e util como backup e migracao, mas nao como banco operacional. A versao 2.0 precisa que despesas, carteiras, categorias, rendas e configuracoes sejam linhas relacionais para:

- consultar por mes, categoria e carteira;
- aplicar foreign keys;
- evitar sobrescrita completa de dados;
- permitir sincronizacao incremental;
- gerar relatorios sem baixar tudo;
- evoluir schema com migrations.

## Componentes

### Frontend

- React + Vite + TypeScript.
- Supabase JS no cliente.
- Zod para formularios/importacao.
- TanStack Query recomendado para cache, loading states e invalidacao.
- Dexie opcional apenas para cache/offline depois que a API relacional estiver estavel.

### Banco

- Supabase Postgres.
- Tabelas relacionais por usuario.
- RLS em todas as tabelas com dados privados.
- Views `security_invoker` para agregacoes mensais.
- Soft delete em entidades financeiras principais.

### Autenticacao

- Supabase Auth por email/senha inicialmente.
- Futuramente: magic link, OAuth ou MFA se necessario.

### Deploy

Vercel:

- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Supabase:

- Manter migrations SQL em `supabase/migrations`.
- Aplicar localmente antes de publicar.
- Gerar tipos TypeScript do banco apos alteracoes de schema.

## Ambientes

- `local`: Supabase CLI local + Vite dev server.
- `preview`: branch/PR na Vercel apontando para projeto Supabase de staging, se possivel.
- `production`: Vercel production + Supabase production.

## Decisoes futuras

- Backend proprio: nao e necessario no inicio. Considere apenas quando houver webhooks bancarios, integracoes secretas ou jobs server-side.
- Storage: usar Supabase Storage se forem anexados recibos, notas ou imagens.
- Edge Functions: usar para importadores bancarios, enriquecimento de dados ou tarefas que nao devem expor segredo ao cliente.

