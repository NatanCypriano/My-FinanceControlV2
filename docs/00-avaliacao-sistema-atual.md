# 00 - Avaliacao Do Sistema Atual

Origem avaliada:

- Documentacao: `C:\Users\Natan\Documents\MyAndroidCustomApps\AGENTS.md`, `ROADMAP.md`, `docs\app-documentation.html`, `web\README.md`.
- Sistema web: `C:\Users\Natan\Documents\MyAndroidCustomApps\web`.

## Resumo

O sistema atual evoluiu de um app Android Kotlin/Room para um web app React/Vite que hoje parece ser a interface principal. O web app tem boa separacao conceitual para um MVP: modelos de dominio, camada local Dexie, utilitarios de relatorio, import/export validado com Zod e telas React.

A limitacao central e que a persistencia principal ainda e local-first em IndexedDB. O Supabase ja aparece no projeto, mas principalmente como autenticacao e backup por snapshot completo na tabela `finance_snapshots`. Isso resolve backup manual, mas nao resolve bem consultas relacionais, integridade, filtros eficientes, multi-dispositivo e evolucao de dados.

## Stack atual observada

- React 18, Vite, TypeScript.
- Dexie/IndexedDB para despesas e configuracoes locais.
- Supabase JS para autenticacao e snapshot cloud.
- Zod para validacao de import/export.
- Recharts para graficos.
- Lucide React para icones.
- Vitest e Testing Library para testes.

## Areas funcionais

- Home mensal.
- Cadastro/edicao/exclusao de despesas.
- Visualizacao por categorias, pagamentos e Sankey.
- Configuracoes financeiras: renda, recorrencias, carteiras, ciclo financeiro.
- Configuracoes do app: moeda, opcoes rapidas, catalogo de categorias.
- Import/export JSON.
- Login Supabase e modo local.
- Push/pull manual de snapshot cloud.

## Modelo de dados atual

Entidades principais identificadas:

- `Expense`: titulo, valor textual, data, vencimento opcional, pago, carteira opcional, categoria, criado em.
- `LocalExpense`: adiciona valor em centavos, moeda, mes, timestamps, soft delete e versoes locais.
- `FinancialConfigurations`: renda global, dia inicial do ciclo financeiro, rendas, rendas por mes, despesas recorrentes e carteiras.
- `AppConfigurations`: moeda e opcoes rapidas.
- `CategoryCatalog`: grupos e categorias editaveis, com subcategoria, cor, icone, ordem e soft delete.

## Riscos atuais

- Snapshot unico por usuario limita concorrencia: dois dispositivos podem sobrescrever dados recentes.
- Relatorios dependem do cliente reconstruir tudo a partir de arrays locais.
- Configuracoes complexas ficam em JSON/localStorage, com pouca integridade.
- Categorias e carteiras sao referenciadas por texto/id solto, sem foreign keys.
- A evolucao de schema depende de migracoes Dexie e normalizadores no cliente.
- Dados locais podem ser perdidos no logout se nao houver push recente.

## O que deve ser preservado

- A experiencia de lancamento manual mensal.
- O modelo mental de grupo > categoria > subcategoria.
- Mes financeiro configuravel por dia de inicio.
- Import/export para migrar dados antigos.
- Testes de utilitarios financeiros ja existentes.
- Vite/React/TypeScript como base principal do web app.

