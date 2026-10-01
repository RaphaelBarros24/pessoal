# Contexto do projeto — Saldo Familiar

Atualizado em 2026-10-01. Versão implementada e instalada: 0.4.3. Além do orçamento em três níveis, existe recuperação administrativa local com backup obrigatório.

## Arquitetura

Aplicativo desktop offline para orçamento familiar, em português do Brasil e reais. O alvo é Windows 10/11 x64; Windows 10 ainda requer validação direta. Não há servidor, sincronização entre máquinas ou serviço externo de IA.

| Componente | Responsabilidade |
| --- | --- |
| `desktop/main.cjs` | Inicialização Electron, instância única, janela, IPC, diálogos, prévia de importação e exportações. |
| `desktop/preload.cjs` | Expõe `window.family.call` ao renderer; encaminha operações e erros pelo IPC. |
| `desktop/store.cjs` | Autenticação, validação, SQLite, migrações, lançamentos, cartões, orçamento, classificação e backups. |
| `desktop/itau.cjs` | Leitura local de XLSX com ExcelJS e normalização das descrições. |
| `desktop/reports.cjs` | CSV e HTML escapado para PDF, produzido pelo Electron. |
| `ui/` | HTML, CSS e JavaScript sem framework; telas, filtros, formulários e gráficos. |
| `desktop/launch.cjs` | Inicialização do runtime de desenvolvimento e modo de teste das telas. |
| `tests/` | Testes das operações públicas, importação e preparação de banco antigo fictício. |

O fluxo é tela → preload → IPC no processo principal → serviço de persistência → resposta para a tela. O processo principal valida a origem do IPC e controla as operações permitidas. A janela usa sandbox, isolamento de contexto e Node desativado no renderer; navegação externa, novas janelas e permissões são bloqueadas. A CSP da interface impede conexões de rede.

O SQLite é executado em memória por `sql.js`/WASM e exportado integralmente para arquivo temporário, renomeado para `family.sqlite`. Operações de parcelas e importação usam transação e recuperação do estado anterior em caso de erro. O schema atual é 5, com tabelas `users`, `categories`, `entries`, `budgets`, `cards`, `expense_groups`, `group_budgets`, `planned_expenses` e `planned_expense_budgets`; faturas são calculadas a partir dos lançamentos, sem tabela de despesa duplicada.

O banco fica em `%APPDATA%\Saldo Familiar\family.sqlite`; backups ficam na subpasta `backups`. Todos os logins do aplicativo compartilham o orçamento na mesma conta do Windows. Contas do Windows distintas usam bancos diferentes. Banco e backups não são criptografados; senhas e códigos de recuperação usam hashes scrypt com salt.

## Funcionalidades concluídas

- Cadastro e login offline, cadastro de familiares por usuário conectado e recuperação individual com código renovado após o uso.
- Recuperação administrativa local na tela de login para perda simultânea de senha e código. Exige seleção do usuário, confirmação textual exata e nova senha; cria backup anterior, gira senha/código e não autentica identidade além do controle do computador e do banco local.
- Receitas/despesas com categorias, observações, vencimento, pagamento, edição e exclusão compartilhadas.
- Dashboard mensal, histórico de seis meses, filtros e orçamento em três níveis: grupo, despesa planejada e classificação. Cada despesa tem previsão e realizado próprios; itens sem grupo permanecem em “Sem grupo”.
- Meios de pagamento e acumulados mensais; parcelamento de valor total em até 120 parcelas, com distribuição em centavos e ajuste de dias em meses curtos.
- Cartões com fechamento/vencimento; faturas por cartão e mês, detalhamento, pagamento/reabertura, edição de parcela e exclusão individual ou da série manual.
- Importação local de fatura Itaú XLSX, seleção do cartão, prévia, atualização incremental por linha, prevenção de duplicados e classificação por histórico ou regras conservadoras. Reexportações com descrição ou identificador mascarado alterados usam uma assinatura secundária por ocorrência; créditos/estornos são informados e ignorados sem bloquear as compras positivas. Pendências de todos os meses aparecem como A classificar e já consomem orçamento.
- CSV/PDF, backup manual, backup diário atualizado nas alterações com retenção de 30 cópias diárias e restauração validada com cópia anterior e novo login.
- Migrações de schema 1/2/3/4 para 5 com cópia integral anterior obrigatória; preservação dos dados existentes e recusa de bancos futuros.
- Instalador NSIS por usuário, runtime incluído e dados preservados na desinstalação. Instalador 0.4.3 gerado e instalado localmente; artefatos em `release/` ficam fora do Git.

## Decisões técnicas e regras financeiras

- Valores são inteiros em centavos. Lançamentos comuns entram no orçamento pelo vencimento, independentemente da data de pagamento.
- A previsão do grupo é independente da soma das previsões das despesas planejadas. Várias despesas podem compartilhar a mesma classificação. Excluir um grupo mantém despesas planejadas, classificações e lançamentos em “Sem grupo”; somente as previsões mensais do grupo são removidas.
- Parcelas de cartão consomem orçamento a partir do mês da compra. Faturas representam pagamentos pelo vencimento. Saldo previsto é receitas previstas menos despesas previstas do orçamento menos despesas a pagar; por decisão do usuário, uma despesa comum pendente pode participar das duas parcelas da fórmula. Não representa saldo bancário.
- Compra no dia do fechamento entra no próximo ciclo. Alterar configuração do cartão afeta novas compras; vencimentos existentes são preservados.
- Edição/exclusão individual afeta somente a parcela escolhida. Para mudar a quantidade de parcelas manuais, excluir a série e cadastrar novamente.
- Importação cria somente a parcela presente em cada linha, sem antecipar parcelas futuras nem criar uma série vinculada. O vencimento vem da planilha; o mês de orçamento deriva da compra e do número da parcela.
- Deduplicação usa SHA-256 de campos normalizados da origem e número da ocorrência. Quando a origem muda descrição ou cartão mascarado, a assinatura secundária usa cartão cadastrado, mês da fatura, data, valor, parcela, total de parcelas e ocorrência. Correspondências são vinculadas sem sobrescrever descrição, categoria, notas, valor ou pagamento. A planilha não fornece ID único de transação.
- Pagamentos e subtotais da planilha são ignorados; pagamentos não quitam automaticamente a fatura. Créditos/estornos também são ignorados, com quantidade e total exibidos; precisam ser tratados separadamente. Limites: 10 MB e 5.000 compras positivas no layout Itaú conferido.
- Classificação usa categoria única no histórico; conflito exige classificação manual. Regras locais conservadoras cobrem alimentação, transporte e saúde quando suas categorias existem.
- Identidade do aplicativo e caminho de dados permanecem estáveis entre versões. Distribuição pela Microsoft Store foi escolhida pelo usuário, mas o pacote atual continua NSIS sem assinatura comercial ou da loja. Consultar o roteiro antes de retomar publicação.
- O repositório Git fica na pasta superior `Pessoal`; destino autorizado é `origin/master` em `RaphaelBarros24/pessoal`. Versionar somente arquivos deste projeto; dados pessoais, dependências, instaladores e artefatos de teste ficam fora do Git.

## Funcionalidades e entregas pendentes

- Validar instalação 0.3.0 por cima da instalação atual e preservação dos dados, com backup prévio; validar em Windows 10.
- Publicar a release 0.3.0 com instalador e checksum, quando solicitado. A geração local não equivale a publicação.
- Microsoft Store: cadastro e reserva pelo titular, identificadores oficiais, privacidade/contato, ferramenta e pacote MSIX, testes de transferência do banco e atualização. Não houve submissão. O builder configurado usa NSIS; o roteiro registra suporte AppX e ausência de alvo MSIX nativo no builder instalado.
- Recorrências, importação genérica de extratos e comprovantes não estão implementados e permanecem fora do escopo atual. Sincronização entre máquinas também está fora da configuração escolhida.

## Bugs conhecidos e limitações

O bug de reimportação de fatura atualizada foi reproduzido e corrigido na versão 0.3.1. Isso não substitui os testes de instalação e compatibilidade pendentes.

O erro de abertura após excluir despesas planejadas foi reproduzido e corrigido na versão 0.4.3. `sql.js` desativa chaves estrangeiras depois de exportar o banco; por isso toda exportação agora as reativa. O banco local afetado teve cinco previsões órfãs removidas após backup verificado e voltou a passar em integridade e chaves estrangeiras.

- Limitação de deduplicação: valor alterado, outro cartão cadastrado e compras indistinguíveis com a mesma data, valor e parcela exigem conferência; não há identificação inequívoca sem ID de transação na origem.
- O parser aceita o layout Itaú conferido; outros layouts não são suportados. Créditos/estornos são informados e ignorados, sem reduzir automaticamente a fatura ou o orçamento.
- Banco e backups sem criptografia e instalador sem assinatura são limites conhecidos do produto. Houve bloqueio do binário 0.2.0 por política do Windows na sessão anterior; o binário 0.3.0 passou no teste registrado em 2026-09-13.
- Documentação anterior parcialmente desatualizada: README ainda descreve testes/bloqueio da 0.2.0 e somente o backup de migração v1. A 0.3.0 teve teste do binário empacotado e migra também schema 2. `docs/requisitos.md` ainda não consolida a importação Itaú; seu comportamento está em `docs/importacao-itau.md`.

## Verificações e próximos passos

Nesta sessão: falha reproduzida com teste regressivo e com a fatura real somente para leitura; a importação foi simulada em cópia temporária do banco pessoal e a cópia foi removida. `npm.cmd test` aprovou 12/12 testes, `node --check` passou nos arquivos alterados, `git diff --check` passou e `npm.cmd run test:ui` retornou `SMOKE_OK`. O instalador 0.3.1 foi gerado e os arquivos da correção dentro do pacote correspondem ao código testado. A primeira tentativa foi bloqueada pela política de Controle de Aplicativo; após liberação administrativa, a instalação local foi confirmada como 0.3.1. Um backup integral verificado foi criado antes da tentativa inicial.

Após a liberação administrativa e instalação 0.3.1, uma reimportação já realizada deixou linhas excedentes no banco pessoal. O saneamento foi limitado à fatura e ao cartão afetados, com backup integral verificado. Uma auditoria comparou as chaves canônicas do Excel antes e depois: todas as compras positivas ficaram presentes uma única vez e nenhuma linha fora do arquivo permaneceu naquele escopo. Planilha, banco, valores e dados pessoais não foram versionados.

Na versão 0.3.2, um teste regressivo reproduziu o saldo previsto sem despesas a pagar e passou após centralizar esse total no backend. A fórmula confirmada pelo usuário é receitas previstas menos despesas previstas menos despesas a pagar; tela, PDF e contexto usam a mesma definição. A regra foi validada também em cópia temporária do banco real, removida após a conferência.

O instalador 0.4.0 foi gerado e instalado sobre a 0.3.2 após backup integral verificado. A migração para o schema 4 gerou também o backup automático da versão 3; integridade e chaves estrangeiras foram aprovadas. A instalação ativa foi confirmada como 0.4.0 e o aplicativo foi aberto com o banco migrado.

A versão 0.4.1 corrigiu a equivalência incorreta entre despesa planejada e classificação. O teste regressivo confirmou duas despesas distintas no mesmo grupo compartilhando uma classificação. O instalador foi aplicado sobre a 0.4.0; a migração para o schema 5 preservou o banco, converteu previsões existentes em despesas planejadas e gerou backup automático da versão 4. Integridade e chaves estrangeiras foram aprovadas.

A versão 0.4.2 adicionou a recuperação administrativa local solicitada para o computador do Flávio. O fluxo foi validado de ponta a ponta: lista o usuário local, exige confirmação textual, cria backup anterior, redefine a senha, invalida o código antigo e exibe um novo código. O instalador foi aplicado localmente sobre a 0.4.1 após backup verificado.

A versão 0.4.3 corrige a desativação de chaves estrangeiras após `db.export()`. O teste regressivo passou de vermelho para verde e a suíte aprovou 16/16 testes; o teste completo da interface retornou `SMOKE_OK`. O banco local foi reparado após cópia integral conferida, e uma cópia do arquivo reparado abriu com o código corrigido. O instalador foi gerado em staging limpo, pois pontos de reanálise corrompidos na raiz impediam o build direto, e foi instalado com executável e `app.asar` confirmados como 0.4.3. A confirmação visual da janela instalada permanece pendente porque o EXE encerrou sem janela na sessão automatizada.

Na sessão 2026-09-13, estão registrados testes das telas no runtime e no binário 0.3.0, migração, importação e reimportação em banco isolado. O checksum do instalador atual está em `release/SHA256SUMS-0.4.3.txt`.

Priorizar a validação de atualização e Windows 10, depois alinhar README/requisitos ao estado 0.3.0. Retomar a Store somente com os dados oficiais do titular e o roteiro de publicação. Ao encerrar trabalhos futuros, atualizar este contexto e manter AGENTS.md/CLAUDE.md idênticos, executar verificações proporcionais e conferir commit/push sem incluir projetos vizinhos.

## Referências locais

- `docs/requisitos.md`: requisitos e decisões confirmadas.
- `docs/importacao-itau.md`: operação, deduplicação e limites da importação.
- `docs/notas-versao.md`: histórico das versões.
- `docs/publicacao-microsoft-store.md`: roteiro e pendências de publicação.
- `CONTEXT.md`: vocabulário canônico de grupos, despesas planejadas, previsões e realizado.
- `docs/agents/`: convenções de domínio, triagem e issue tracker. Nenhum ADR foi necessário para esta evolução aditiva.
