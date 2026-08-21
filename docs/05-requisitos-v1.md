# 05 - Requisitos Herdados Da V1 Web

Este documento lista as funcionalidades observadas na primeira versao web do My Finance Control para apoiar a selecao do que sera herdado na V2.

Campo **Presente no v2?**: use `Sim`, `Nao`, `Parcial`, `Futuro` ou outra marcacao que preferir.

Fontes avaliadas:

- `C:\Users\Natan\Documents\MyAndroidCustomApps\web\README.md`
- `C:\Users\Natan\Documents\MyAndroidCustomApps\docs\app-documentation.html`
- `C:\Users\Natan\Documents\MyAndroidCustomApps\web\src\App.tsx`
- `C:\Users\Natan\Documents\MyAndroidCustomApps\web\src\ui`
- `C:\Users\Natan\Documents\MyAndroidCustomApps\web\src\data`
- `C:\Users\Natan\Documents\MyAndroidCustomApps\web\src\backend`
- `C:\Users\Natan\Documents\MyAndroidCustomApps\web\src\reports`
- `C:\Users\Natan\Documents\MyAndroidCustomApps\web\src\importExport`

## Requisitos Funcionais

| Codigo | Requisito funcional | Presente no v2? |
| --- | --- | --- |
| RF-001 | O sistema deve permitir criar conta de usuario por email e senha usando Supabase Auth. | Sim |
| RF-002 | O sistema deve permitir login por email e senha usando Supabase Auth. | Sim |
| RF-003 | O sistema deve exigir usuario autenticado para acessar qualquer funcionalidade privada da aplicacao. | Sim |
| RF-004 | O sistema deve restaurar sessao autenticada ao abrir o app quando houver sessao Supabase valida. | Sim |
| RF-005 | O sistema deve redirecionar usuarios nao autenticados para a tela de login. | Sim |
| RF-006 | O sistema deve carregar dados diretamente da conta autenticada no Supabase apos login bem-sucedido. | Sim |
| RF-007 | O sistema deve manter os dados de cada usuario isolados por autenticacao e politicas de acesso. | Sim |
| RF-008 | O sistema deve solicitar novo login quando a sessao autenticada expirar. | Sim |
| RF-009 | O sistema deve exibir menu de perfil com identificacao do usuario autenticado. | Sim |
| RF-010 | O sistema deve permitir logout encerrando a sessao autenticada. | Sim |
| RF-011 | O sistema deve redirecionar para login apos logout. | Sim |
| RF-012 | O sistema deve impedir mutacoes quando nao houver sessao autenticada valida. | Sim |
| RF-013 | O sistema deve oferecer uma tela de configuracoes de conta, mesmo que inicialmente simples. | Sim |
| RF-014 | O sistema deve apresentar layout principal com topbar, menu lateral, conteudo central e painel rapido lateral. | Sim |
| RF-015 | O sistema deve permitir recolher e expandir o menu lateral. | Sim |
| RF-016 | O sistema deve persistir a preferencia de menu lateral recolhido no navegador. | Sim |
| RF-017 | O sistema deve navegar entre Home, Add expense, Visualize, Financial configurations, Settings e Account settings. | Sim |
| RF-018 | O sistema deve refletir a navegacao em rotas de browser: `/`, `/add-expense`, `/visualize`, `/financial-configurations`, `/settings`, `/account-settings`. | A definir |
| RF-019 | O sistema deve permitir selecionar o mes ativo no topo do app. | Sim |
| RF-020 | O sistema deve permitir alternar meses por atalho de teclado `Alt + ArrowLeft` e `Alt + ArrowRight`. | Não |
| RF-021 | O sistema deve oferecer atalhos no menu lateral para as secoes Expenses e Payments da tela Visualize. | Sim |
| RF-022 | O sistema deve exibir painel rapido com proximo pagamento do mes selecionado. | Não |
| RF-023 | O sistema deve permitir abrir o calendario de pagamentos a partir do painel rapido. | Sim |
| RF-024 | A Home deve exibir resumo financeiro do mes selecionado. | Sim |
| RF-025 | A Home deve exibir orcamento, renda, despesas recorrentes, despesas do mes e saldo restante. | Sim |
| RF-026 | A Home deve considerar carteiras no calculo de saldo ajustado. | Sim |
| RF-027 | A Home deve exibir mensagem de estado vazio quando nao houver despesas no mes e oferecer acao para adicionar despesa. | Sim |
| RF-028 | A Home deve exibir gastos por categoria. | Não | Correção -> A home deve exibir um resumo apenas
| RF-029 | A Home deve permitir expandir e recolher graficos de gastos. | Sim |
| RF-030 | A Home deve destacar despesas separadas do total geral quando categorias assim configuradas existirem. | Sim |
| RF-031 | A Home deve exibir despesas recentes do mes selecionado. | Sim |
| RF-032 | O sistema deve permitir criar despesa com descricao, valor total, data informativa de lancamento, mes operacional selecionado no topo, categoria, vencimento opcional, carteira opcional e status pago. | Sim |
| RF-033 | O sistema deve gerar identificador estavel para novas despesas. |Sim |
| RF-034 | O sistema deve validar que descricao e valor valido sejam informados antes de salvar despesa. | Sim |
| RF-035 | O sistema deve validar que a data de lancamento use formato valido. | Sim |
| RF-036 | O sistema deve permitir informar valores parciais e somar ao campo de valor total da despesa. | Sim |
| RF-037 | O sistema deve permitir marcar se a despesa possui ou nao data de vencimento. | Sim |
| RF-038 | O sistema deve permitir selecionar data de vencimento manualmente. | Sim |
| RF-039 | O sistema deve oferecer opcoes rapidas de vencimento baseadas em dias configurados. | Sim |
| RF-040 | O sistema deve permitir associar despesa a uma carteira configurada ou deixar sem carteira. | Sim |
| RF-041 | O sistema deve permitir marcar despesa como paga ou nao paga. | Sim |
| RF-042 | O sistema deve permitir salvar despesa e permanecer no formulario para adicionar outra. | Sim |
| RF-043 | O sistema deve permitir editar uma despesa existente. | Sim |
| RF-044 | O sistema deve permitir salvar alteracoes de uma despesa existente. |Sim |
| RF-045 | O sistema deve permitir criar uma nova despesa a partir dos dados de uma despesa em edicao. | Sim |
| RF-046 | O sistema deve permitir cancelar a edicao e limpar o formulario. | Sim |
| RF-047 | O sistema deve permitir excluir despesa usando soft delete. | Sim |
| RF-048 | O sistema deve permitir alternar rapidamente o status pago/nao pago de uma despesa. | Sim |
| RF-049 | O sistema deve permitir mover uma despesa para outro mes, removendo-a do mes original. | Sim |
| RF-050 | O sistema deve permitir copiar uma despesa para o proximo mes. | Sim |
| RF-051 | O sistema deve permitir copiar uma despesa para todos os meses seguintes disponiveis. | Sim |
| RF-052 | O sistema deve permitir copiar uma despesa para todos os outros meses disponiveis. | Sim |
| RF-053 | Ao copiar uma despesa com vencimento, o sistema deve permitir manter vencimento, adicionar tempo ao vencimento ou remover vencimento nas copias. | Sim |
| RF-054 | A tela Add expense deve listar despesas do mes selecionado. | Sim |
| RF-055 | A lista de despesas deve permitir ordenar por descricao, categoria, grupo, vencimento, data de criacao ascendente, data de criacao descendente, valor ascendente e valor descendente. | Sim |
| RF-056 | A lista de despesas deve permitir filtrar por grupo de despesa. | Sim |
| RF-057 | A lista de despesas deve permitir filtrar por categoria. | Sim |
| RF-058 | A lista de despesas deve permitir filtrar por carteira, incluindo despesas com ou sem carteira. | Sim |
| RF-059 | A lista de despesas deve permitir filtrar somente despesas com vencimento. | Sim |
| RF-060 | A lista de despesas deve permitir filtrar somente despesas sem vencimento. | Sim |
| RF-061 | A lista de despesas deve permitir filtrar por intervalo de vencimento. | Sim |
| RF-062 | A lista de despesas deve permitir busca por texto na descricao. | Sim |
| RF-063 | A lista de despesas deve oferecer modos de visualizacao em lista, duas colunas e tres colunas. | Não |
| RF-064 | O sistema deve exibir notificacoes de sucesso e erro para operacoes de despesa. | Sim |
| RF-065 | O sistema deve permitir configurar renda liquida global. | Não | -> A renda liquida global será definida automaticamente a cada mês, dependendo as rendas definidas em cada mês
| RF-066 | O sistema deve permitir configurar o dia inicial do ciclo financeiro mensal. | Sim |
| RF-067 | O sistema deve exibir o intervalo real do ciclo financeiro do mes selecionado. | Sim |
| RF-068 | O sistema deve permitir adicionar renda mensal para o mes selecionado com descricao, valor, dia, flag de dia util e carteira opcional. | Sim |
| RF-069 | O sistema deve permitir editar rendas mensais configuradas. | Sim |
| RF-070 | O sistema deve permitir remover rendas mensais configuradas. | Sim |
| RF-071 | O sistema deve permitir aplicar uma renda mensal para os proximos meses. | Sim |
| RF-072 | O sistema deve permitir aplicar uma renda mensal para todos os meses futuros. | Sim |
| RF-073 | O sistema deve permitir aplicar uma renda mensal para todos os meses disponiveis. | Sim |
| RF-074 | O sistema deve permitir atualizar rendas de mesmo nome em outros meses. | Sim |
| RF-075 | O sistema deve permitir adicionar, editar e remover despesas recorrentes. | Sim |
| RF-076 | O sistema deve permitir adicionar, editar e remover carteiras com nome e valor. | Sim |
| RF-077 | O sistema deve salvar configuracoes financeiras de renda, ciclo, recorrencias e carteiras. | Sim |
| RF-078 | A tela Visualize deve ter secoes Expenses e Payments. | Sim |
| RF-079 | A secao Expenses deve permitir filtrar a visualizacao por carteira. |Sim |
| RF-080 | A secao Expenses deve exibir total de gastos do mes selecionado. | Sim |
| RF-081 | A secao Expenses deve exibir despesas separadas do total geral em bloco proprio. | Sim |
| RF-082 | A secao Expenses deve exibir lista de totais por categoria. | Sim |
| RF-083 | A lista de totais por categoria deve permitir expandir e recolher cards de categoria. | Sim |
| RF-084 | A lista de totais por categoria deve permitir expandir ou recolher todos os cards visiveis. |Sim |
| RF-085 | A lista de totais por categoria deve permitir filtros por grupo e categoria. | Sim |
| RF-086 | A lista de totais por categoria deve permitir filtros por vencimento, intervalo de vencimento e busca por descricao. | Sim |
| RF-087 | A lista de totais por categoria deve permitir ordenar por categoria, grupo, vencimento, data de criacao, participacao percentual e total. | Sim |
| RF-088 | A lista de totais por categoria deve oferecer modos lista, duas colunas, tres colunas e despesas individuais. | Não |
| RF-089 | A partir da visualizacao por categoria, o sistema deve permitir editar, excluir, alternar pago, mover e copiar despesas. | Sim |
| RF-090 | O sistema deve permitir focar uma despesa especifica na visualizacao e abrir sua categoria correspondente. | Sim |
| RF-091 | O sistema deve exibir graficos de gastos em barras, pizza e Sankey. | Sim |
| RF-092 | Os graficos devem permitir agrupamento por grupos, categorias e descricoes. | Sim |
| RF-093 | O Sankey deve representar fluxo entre renda/configuracao financeira, grupos, categorias e despesas quando houver dados suficientes. | Sim |
| RF-094 | A secao Payments deve exibir calendario do ciclo financeiro do mes selecionado. | Sim |
| RF-095 | O calendario de pagamentos deve destacar dias com pagamentos e dias com rendas. | Sim |
| RF-096 | Ao selecionar uma data no calendario, o sistema deve exibir despesas vencidas ate a data, rendas ate a data e saldo ajustado por carteira. | Sim |
| RF-097 | Ao selecionar uma data no calendario, o sistema deve listar rendas do dia. | Sim |
| RF-098 | Ao selecionar uma data no calendario, o sistema deve listar pagamentos vencidos no dia. |Sim |
| RF-099 | A secao Payments deve permitir abrir a despesa relacionada ao pagamento. | Sim |
| RF-100 | A secao Payments deve perguntar se o usuario deseja visualizar a despesa selecionada na visualizacao de despesas. | Sim |
| RF-101 | A secao Payments deve permitir abrir acoes em massa para uma data selecionada. | Sim |
| RF-102 | As acoes em massa devem permitir marcar todas as despesas do dia como pagas. | Sim |
| RF-103 | As acoes em massa devem permitir marcar despesas nao pagas do dia como pagas. | Sim |
| RF-104 | As acoes em massa devem permitir marcar todas as despesas do dia como nao pagas. | Sim |
| RF-105 | As acoes em massa devem permitir atribuir uma carteira a todas as despesas do dia. | Sim |
| RF-106 | As acoes em massa devem permitir limpar a carteira de todas as despesas do dia. | Sim |
| RF-107 | As acoes em massa devem permitir atribuir uma categoria a todas as despesas do dia. | Sim |
| RF-108 | As acoes em massa devem permitir deslocar vencimentos do dia em 1 dia, 7 dias ou para o proximo dia util. | Sim |
| RF-109 | As acoes em massa devem permitir copiar despesas do dia para o proximo mes. | Sim |
| RF-110 | As acoes em massa devem permitir mover despesas do dia para outro mes. | Sim |
| RF-111 | As acoes em massa devem permitir excluir todas as despesas do dia mediante confirmacao. | Sim |
| RF-112 | As acoes em massa devem permitir definir vencimentos individualmente para despesas do dia. | Sim |
| RF-113 | A tela Settings deve permitir configurar moeda do app. | Sim |
| RF-114 | A tela Settings deve permitir exportar um arquivo JSON dos dados atuais. | Não |
| RF-115 | A tela Settings deve permitir importar um arquivo JSON compativel. | Não |
| RF-116 | A importacao deve validar o JSON contra o schema de exportacao suportado. | Não |
| RF-117 | A exportacao deve incluir schemaVersion, exportedAt, financialConfigurations, appConfigurations, categoryCatalog e expenses. | Não |
| RF-118 | A tela Settings deve exibir informacoes basicas da conta autenticada. | Sim |
| RF-119 | O sistema deve salvar alteracoes diretamente no banco persistente da aplicacao. | Sim |
| RF-120 | O sistema deve recarregar dados do usuario autenticado apos operacoes de criacao, edicao, exclusao e importacao. | Sim |
| RF-121 | O sistema deve impedir que um usuario acesse dados pertencentes a outro usuario. | Sim |
| RF-122 | O sistema deve tratar falhas de leitura e gravacao com mensagens claras. | Sim |
| RF-123 | O menu de perfil deve oferecer acesso a configuracoes de conta e logout. | Sim |
| RF-124 | O sistema deve bloquear rotas privadas para visitantes nao autenticados. | Sim |
| RF-125 | A tela Settings deve permitir limpar todos os dados da conta e resetar configuracoes mediante confirmacao. | Sim |
| RF-126 | A tela Settings deve permitir excluir todas as despesas da conta. | Sim |
| RF-127 | A tela Settings deve permitir excluir despesas apenas do mes selecionado. | Sim |
| RF-128 | A tela Settings deve permitir resetar configuracoes financeiras. | Sim |
| RF-129 | A tela Settings deve permitir configurar dias rapidos de vencimento entre 1 e 31. | Sim |
| RF-130 | A tela Settings deve impedir dias rapidos duplicados. | Não |
| RF-131 | A tela Settings deve permitir remover dias rapidos de vencimento. | Sim |
| RF-132 | A tela Settings deve permitir gerenciar catalogo de grupos e categorias. | Sim |
| RF-133 | O catalogo deve permitir adicionar grupo. | Sim |
| RF-134 | O catalogo deve permitir editar grupo. | Sim |
| RF-135 | O catalogo deve permitir excluir grupo por soft delete. | Sim |
| RF-136 | O catalogo deve permitir restaurar grupo excluido. | Sim |
| RF-137 | O catalogo deve permitir adicionar categoria a um grupo. | Sim |
| RF-138 | O catalogo nao deve oferecer subcategorias nesta fase da V2. Categorias ficam diretamente abaixo de grupos. | Sim |
| RF-139 | O catalogo deve permitir editar categorias de nivel unico. | Sim |
| RF-140 | O catalogo deve permitir excluir categorias de nivel unico por soft delete. | Sim |
| RF-141 | O catalogo deve permitir restaurar categorias de nivel unico excluidas. | Sim |
| RF-142 | O catalogo deve permitir configurar codigo, rotulo, grupo, cor, icone, ordem e separacao dos totais. | Sim |
| RF-143 | O catalogo deve permitir marcar categoria para ficar separada dos totais de despesas. | Sim |
| RF-144 | O catalogo deve permitir mostrar ou esconder itens excluidos. | Sim |
| RF-145 | O sistema deve manter catalogo padrao de grupos e categorias quando nao houver catalogo personalizado. | Sim |
| RF-146 | O sistema deve normalizar dados legados de importacao para configuracoes financeiras atuais. | Sim |
| RF-147 | O sistema deve manter IDs unicos para grupos e categorias de nivel unico. | Sim |
| RF-148 | O sistema deve manter import/export compativel com Android e web da V1. | Não |
| RF-149 | O sistema deve persistir despesas e configuracoes em tabelas relacionais do Supabase. | Sim |
| RF-150 | O sistema deve registrar metadados de criacao, atualizacao e exclusao logica quando aplicavel. | Sim |
| RF-151 | O sistema deve atualizar a interface apos criar, editar, excluir, importar ou alterar configuracoes. | Sim |
| RF-152 | O sistema deve usar o banco persistente como fonte operacional unica dos dados. | Sim |

## Requisitos Nao Funcionais

| Codigo | Requisito nao funcional | Presente no v2? |
| --- | --- | --- |
| RNF-001 | O frontend deve ser uma aplicacao React com TypeScript. | Sim |
| RNF-002 | O build web deve usar Vite. | Sim |
| RNF-003 | A aplicacao deve ser executavel em navegador desktop moderno. | Sim |
| RNF-004 | A aplicacao deve ser adequada para uso mobile web responsivo na V2. | Sim |
| RNF-005 | A aplicacao deve operar com uma unica fonte persistente de dados: Supabase Postgres. | Sim |
| RNF-006 | A V2 deve usar Supabase Postgres como fonte de verdade persistente. | Sim |
| RNF-007 | A autenticacao deve usar Supabase Auth. | Sim |
| RNF-008 | Dados privados devem ser protegidos por escopo de usuario. | Sim |
| RNF-009 | Valores monetarios devem ser processados de forma consistente por utilitarios centralizados. | Sim |
| RNF-010 | Valores monetarios persistidos no modelo novo devem preferir centavos inteiros para evitar erro decimal. | Sim |
| RNF-011 | Datas de negocio devem usar formato ISO `YYYY-MM-DD`. | Sim |
| RNF-012 | Meses devem usar prefixo `YYYY-MM`. | Sim |
| RNF-012-extra | O sistema deve adaptar a visualização das datas para melhor leitura. | Sim |
| RNF-013 | O sistema deve validar dados importados antes de substituir dados existentes. | Não | -> Não há mais sistema de import/export
| RNF-014 | O schema de exportacao deve ser versionado. | Não  -> Não há mais sistema de import/export |
| RNF-015 | O app deve conseguir lidar com dados legados de versoes anteriores do schema de exportacao. | Não  -> Não há mais sistema de import/export |
| RNF-016 | Operacoes destrutivas devem exigir confirmacao explicita. | Sim |
| RNF-017 | Operacoes destrutivas sobre dados da conta devem exibir aviso claro. | Sim |
| RNF-018 | Mutacoes no banco devem respeitar integridade relacional e escopo do usuario autenticado. | Sim |
| RNF-019 | O app deve exibir estados de carregamento durante leituras e gravacoes remotas. | Sim |
| RNF-020 | O app deve exibir mensagens de erro recuperaveis ao usuario em falhas de autenticacao, importacao ou persistencia. | Sim |
| RNF-021 | A UI deve expor labels e `aria-labels` para navegacao e botoes importantes. | Sim |
| RNF-022 | A UI deve incluir textos de ajuda via `data-help` para acoes relevantes. | Sim |
| RNF-023 | O app deve ser testavel com Vitest. | Sim |
| RNF-024 | Funcoes puras de relatorio, datas, carteira e Sankey devem ter testes unitarios. | Sim |
| RNF-025 | A camada visual de graficos deve usar biblioteca de graficos compativel com React, como por exemplo, Recharts. | Sim |
| RNF-026 | O app deve manter modelos de dominio alinhados entre web e Android enquanto a V1 Android existir. | Não |
| RNF-027 | Segredos e chaves locais nao devem ser versionados. | Sim |
| RNF-028 | Configuracoes de ambiente web devem ser lidas por variaveis `VITE_*`. | Sim |
| RNF-029 | O sistema deve suportar soft delete em dados financeiros para preservar historico e permitir recuperacao logica quando aplicavel. | Sim |
| RNF-030 | A V2 deve permitir evolucao de banco por migrations SQL versionadas. | Sim |
| RNF-031 | A aplicacao deve manter navegacao por historico do browser. | Sim |
| RNF-032 | Chamadas ao banco devem ser feitas com cliente Supabase e protegidas por RLS. | Sim |
| RNF-033 | O app deve separar modelos de dominio, persistencia, relatorios e componentes de UI. | Sim |
| RNF-034 | O app deve preservar compatibilidade de importacao com export JSON da V1 para migracao inicial. | Não |
| RNF-035 | O app deve ter feedback visual para estados vazios de despesas, graficos, Sankey, carteiras e filtros. | Sim |

## Regras De Negocio

| Codigo | Regra de negocio | Presente no v2? |
| --- | --- | --- |
| RN-001 | Uma despesa pertence a exatamente um mes operacional, independente da data informativa em que foi feita/lancada. | Sim |
| RN-002 | Na V2, o mes operacional da despesa deve ser definido pelo mes selecionado na barra superior no momento da criacao; `expense_date` nao deve determinar o mes financeiro. | Sim |
| RN-003 | O ciclo financeiro pode comecar em qualquer dia de 1 a 31. | Sim |
| RN-004 | Quando o dia inicial do ciclo for maior que o numero de dias do mes, deve ser usado o ultimo dia valido daquele mes. | Sim |
| RN-005 | O intervalo do ciclo financeiro termina imediatamente antes do inicio do proximo ciclo. | Sim |
| RN-006 | Datas invalidas nao devem entrar em calculos de ciclo financeiro. | Sim |
| RN-007 | Dias rapidos de vencimento devem estar entre 1 e 31. | Sim |
| RN-008 | Dias rapidos de vencimento devem ser unicos e ordenados. | Sim |
| RN-009 | Uma despesa sem descricao ou sem valor monetario valido nao pode ser salva. | Sim |
| RN-010 | Uma despesa sem vencimento nao deve aparecer em filtros que exigem vencimento. | Sim |
| RN-011 | Filtros de intervalo de pagamento devem considerar apenas despesas com vencimento. | Sim |
| RN-012 | Despesas excluidas por soft delete nao devem aparecer nas listas padrao. | Sim |
| RN-013 | Ao salvar uma despesa, o valor textual deve ser convertido para centavos para calculos. | Sim |
| RN-014 | A moeda da despesa deve derivar da configuracao atual da conta no momento da gravacao. | Sim |
| RN-015 | Despesas marcadas como pagas e associadas a carteira nao entram no calculo de despesa pendente do orcamento. | Sim |
| RN-016 | Despesas nao pagas associadas a carteira reduzem o saldo ajustado da carteira. | Sim |
| RN-017 | Rendas associadas a carteira aumentam o saldo ajustado da carteira. | Sim |
| RN-018 | Ao marcar como paga uma despesa associada a carteira, o valor deve ser subtraido do saldo persistido da carteira. | Sim |
| RN-019 | Ao desfazer pagamento de uma despesa associada a carteira, o valor deve ser devolvido ao saldo persistido da carteira. | Sim |
| RN-020 | Se uma despesa paga trocar de carteira ou valor, o saldo da carteira anterior e da nova carteira deve ser ajustado corretamente. | Sim |
| RN-021 | Categorias marcadas como separadas dos totais devem ser excluidas do total geral de despesas. | Sim |
| RN-022 | Subcategorias nao fazem parte do escopo atual da V2; separacao de totais e aplicada apenas na categoria selecionada. | Sim |
| RN-023 | Nao deve haver heranca de separacao por categoria raiz enquanto subcategorias estiverem fora do escopo. | Sim |
| RN-024 | Totais por categoria devem ignorar categorias sem gasto positivo. | Sim |
| RN-025 | O catalogo deve considerar apenas grupos e categorias sem `deletedAt` nas selecoes ativas. | Sim |
| RN-026 | Quando uma categoria armazenada nao for encontrada, o sistema deve tentar resolver por codigo/rotulo normalizado. | Sim |
| RN-027 | Quando uma categoria armazenada antiga for conhecida, o sistema deve mapear para categoria atual equivalente. | Sim |
| RN-028 | Quando nenhuma categoria for resolvida, deve ser usada a categoria `OTHER`. | Sim |
| RN-029 | Categorias nao devem referenciar categoria pai nesta fase da V2. | Sim |
| RN-030 | Uma categoria deve pertencer a um grupo. | Sim |
| RN-031 | Um grupo ou categoria excluido nao deve ficar selecionavel em novas despesas. | Sim |
| RN-032 | Rendas mensais podem ser especificas por mes e substituir/estender configuracoes globais. | Sim |
| RN-033 | Uma renda mensal com flag de dia util deve ser posicionada conforme a regra de data util da V1. | Sim |
| RN-034 | Ao copiar despesa para outro mes com modo `MAINTAIN`, o vencimento original deve ser preservado. | Sim |
| RN-035 | Ao copiar despesa para outro mes com modo `ADD_TIME`, o vencimento deve receber deslocamento proporcional ao mes de destino. | Sim |
| RN-036 | Ao copiar despesa para outro mes com modo `REMOVE`, o vencimento deve ser removido. | Sim |
| RN-037 | Ao mover uma despesa para outro mes, a V1 cria uma nova despesa no mes destino e marca a origem como excluida. | Sim |
| RN-038 | Ao importar arquivo JSON, os dados existentes da conta podem ser substituidos pelo conteudo importado normalizado, mediante confirmacao. | Não | Não há mais import com JSON
| RN-039 | Ao limpar todos os dados, despesas, configuracoes financeiras, configuracoes do app e catalogo devem voltar ao padrao. | Sim |
| RN-040 | Ao excluir despesas de um mes, apenas despesas pertencentes ao mes selecionado devem ser afetadas. | Sim |
| RN-041 | Todo registro financeiro privado deve pertencer a um usuario autenticado. | Sim |
| RN-042 | Um usuario so pode ler, criar, editar ou excluir dados pertencentes a sua propria conta. | Sim |
| RN-043 | Insercoes feitas pelo cliente devem gravar o identificador do usuario autenticado conforme as politicas do banco. | Sim |
| RN-044 | Logout nao deve apagar dados persistidos da conta. | Sim |
| RN-045 | Sessao expirada deve impedir novas leituras ou gravacoes ate novo login. | Sim |
| RN-046 | Visitantes nao autenticados nao podem acessar rotas privadas nem dados financeiros. | Sim |
| RN-047 | Exclusao ou reset de dados da conta deve exigir confirmacao explicita. | Sim |
| RN-048 | Importacao de dados deve respeitar o escopo do usuario autenticado e nao pode afetar outras contas. | Sim |
| RN-049 | Export JSON deve gravar despesas usando o campo `category`, nao o campo legado `type`. | Não | Não há mais import com JSON
| RN-050 | Export JSON deve gravar `createdAt` quando existir, ou usar a data da despesa como fallback. | Não | Não há mais import com JSON
| RN-051 | Normalizadores devem aceitar formatos legados de renda global, rendas variaveis, recorrencias e rendas congeladas por mes. | Não | Não há mais import com JSON
| RN-052 | O app deve manter a ordem de exibicao de grupos e categorias por `sortOrder` e depois por rotulo. | Sim |
| RN-053 | Carteiras sem saldo ajustado diferente de zero nao precisam aparecer no resumo de saldo por carteira. | Sim |
| RN-054 | Pagamentos planejados recorrentes podem aparecer na visualizacao de pagamentos sem serem despesas reais cadastradas. | Sim |
| RN-055 | Uma despesa associada a pagamento deve exibir status pago, nao pago ou recorrente planejado conforme sua origem. | Sim |

## Observacoes Para A V2

- A V2 funcionara como uma aplicacao autenticada comum: o usuario deve fazer login para utilizar o sistema.
- A fonte operacional dos dados sera o Supabase Postgres, com tabelas relacionais e politicas de acesso por usuario.
- Import/export JSON permanece apenas como recurso de portabilidade, migracao ou copia manual de dados, nao como mecanismo operacional da aplicacao.
- O campo `Presente no v2?` foi deixado como `A definir` para triagem manual.
- Subcategorias foram removidas do escopo atual da V2. O catalogo operacional passa a usar apenas `grupo > categoria`.
