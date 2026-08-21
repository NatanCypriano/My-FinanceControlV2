# 02 - Modelo Relacional Supabase

## Objetivo

Substituir o modelo local/snapshot por tabelas relacionais com ownership por usuario, RLS e integridade de referencias.

## Principios

- Toda linha privada pertence a `auth.users.id`.
- O cliente usa a anon key; a seguranca vem de RLS.
- Valores monetarios sao armazenados em centavos (`bigint`) e exibidos pelo cliente.
- Entidades editaveis usam soft delete para preservar historico.
- Import/export JSON continua existindo como camada de migracao e backup manual.

## Tabelas principais

### `profiles`

Perfil publico/privado minimo do usuario.

- `id`: referencia `auth.users`.
- `display_name`.
- `default_currency`.
- `locale`.

### `app_settings`

Preferencias do app por usuario.

- `currency_code`.
- `quick_due_date_days`.

### `financial_settings`

Configuracao financeira global.

- `financial_cycle_start_day`.

### `wallets`

Carteiras/contas configuradas pelo usuario.

- `name`.
- `balance_cents`.
- `currency`.
- timestamps e soft delete.

### `income_sources`

Rendas recorrentes ou padrao.

- `description`.
- `amount_cents`.
- `day_of_month`.
- `business_only`.
- `wallet_id` opcional.

### `monthly_income_entries`

Override/congelamento mensal de renda, substituindo o atual `incomesByMonth`.

- `month_start`.
- `description`.
- `amount_cents`.
- `day_of_month`.
- `source_id` opcional.

### `recurring_expenses`

Despesas recorrentes configuradas.

- `description`.
- `amount_cents`.
- `currency`.

### `expense_groups`

Catalogo de grupos do usuario.

- `code`.
- `label`.
- `color_hex`.
- `icon_key`.
- `sort_order`.

### `expense_categories`

Catalogo de categorias. Na fase atual da V2, categorias ficam diretamente abaixo de grupos; subcategorias estao fora do escopo operacional.

- `code`.
- `group_id`.
- `parent_category_id`: coluna mantida para compatibilidade evolutiva/legada, mas gravada como `null` pela aplicacao atual.
- `separate_from_expense_totals`.
- metadados visuais e ordenacao.

### `expenses`

Lancamentos financeiros.

- `title`.
- `amount_cents`.
- `currency`.
- `expense_date`: data informativa em que a despesa foi feita/lancada.
- `month_start`: mes operacional da despesa, definido pelo mes selecionado na barra superior quando a despesa e criada.
- `due_date`.
- `paid`.
- `wallet_id`.
- `category_id`.
- timestamps, soft delete e `sync_version`.

## Compatibilidade com o sistema atual

O schema atual de exportacao version 10 pode ser usado como ponte:

- `expenses[].category` mapeia para `expense_categories.code`.
- `expenses[].walletName` mapeia para `wallets.name`.
- `financialConfigurations.incomes` mapeia para `income_sources`.
- `financialConfigurations.incomesByMonth` mapeia para `monthly_income_entries`.
- `financialConfigurations.recurringExpenses` mapeia para `recurring_expenses`.
- `categoryCatalog.groups` e `categoryCatalog.categories` mapeiam para `expense_groups` e `expense_categories`.

## Agregacoes

Criar views para leituras comuns:

- `monthly_expense_totals`: total por usuario/mes/categoria.
- `monthly_wallet_payments`: pagamentos por data/carteira.

Essas views devem usar `security_invoker = true` para respeitar RLS das tabelas base.
