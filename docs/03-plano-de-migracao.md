# 03 - Plano De Migracao

## Fase 1 - Fundacao

1. Criar projeto Supabase.
2. Aplicar `supabase/migrations/202608200001_initial_relational_schema.sql`.
3. Gerar tipos TypeScript do banco.
4. Configurar Vercel com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Fase 2 - Portar Web App

1. Copiar a estrutura visual do web app atual.
2. Manter `src/domain`, `src/reports`, `src/ui` onde fizer sentido.
3. Trocar `src/data/db.ts` por repositorios Supabase:
   - `expenseRepository`
   - `categoryRepository`
   - `walletRepository`
   - `settingsRepository`
4. Introduzir TanStack Query para leituras e invalidacao.

## Fase 3 - Migracao De Dados Existentes

1. Exportar JSON do app atual.
2. Validar com o schema version 10.
3. Criar importador que:
   - cria app/financial settings;
   - cria grupos/categorias;
   - cria carteiras;
   - cria rendas/recorrencias;
   - cria despesas;
   - registra inconsistencias em relatorio de importacao.

## Fase 4 - Desativar Snapshot Como Fluxo Principal

1. Manter snapshot apenas como backup/export legado.
2. Remover botoes de push/pull como mecanismo primario.
3. Trocar a mensagem de "cloud backup" por "dados salvos automaticamente".

## Fase 5 - Offline Opcional

Depois que o banco relacional estiver estavel:

1. Reintroduzir Dexie como cache local.
2. Criar fila de mutacoes offline.
3. Resolver conflitos por `updated_at`/`sync_version`.

## Criterio de pronto da 2.0 inicial

- Login cria ou carrega dados do usuario.
- Despesas CRUD persistem no Supabase.
- Categorias e carteiras sao relacionais.
- Relatorios mensais funcionam a partir do banco.
- Import JSON antigo funciona para uma conta nova.
- RLS impede leitura/escrita entre usuarios.

