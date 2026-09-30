# Contexto do projeto — Saldo Familiar

Atualizado em 2026-09-30. Versão implementada: 0.3.1. A correção permite reimportar faturas atualizadas mesmo quando o Itaú altera descrições ou o identificador mascarado e deixa créditos/estornos de bloquear as compras positivas.

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

O SQLite é executado em memória por `sql.js`/WASM e exportado integralmente para arquivo temporário, renomeado para `family.sqlite`. Operações de parcelas e importação usam transação e recuperação do estado anterior em caso de erro. O schema atual é 3, com tabelas `users`, `categories`, `entries`, `budgets` e `cards`; faturas são calculadas a partir dos lançamentos, sem tabela de despesa duplicada.

O banco fica em `%APPDATA%\Saldo Familiar\family.sqlite`; backups ficam na subpasta `backups`. Todos os logins do aplicativo compartilham o orçamento na mesma conta do Windows. Contas do Windows distintas usam bancos diferentes. Banco e backups não são criptografados; senhas e códigos de recuperação usam hashes scrypt com salt.

## Funcionalidades concluídas

- Cadastro e login offline, cadastro de familiares por usuário conectado e recuperação individual com código renovado após o uso.
- Receitas/despesas com categorias, observações, vencimento, pagamento, edição e exclusão compartilhadas.
- Dashboard mensal, histórico de seis meses, filtros, limites por categoria e sugestões por regras locais.
- Meios de pagamento e acumulados mensais; parcelamento de valor total em até 120 parcelas, com distribuição em centavos e ajuste de dias em meses curtos.
- Cartões com fechamento/vencimento; faturas por cartão e mês, detalhamento, pagamento/reabertura, edição de parcela e exclusão individual ou da série manual.
- Importação local de fatura Itaú XLSX, seleção do cartão, prévia, atualização incremental por linha, prevenção de duplicados e classificação por histórico ou regras conservadoras. Reexportações com descrição ou identificador mascarado alterados usam uma assinatura secundária por ocorrência; créditos/estornos são informados e ignorados sem bloquear as compras positivas. Pendências de todos os meses aparecem como A classificar e já consomem orçamento.
- CSV/PDF, backup manual, backup diário atualizado nas alterações com retenção de 30 cópias diárias e restauração validada com cópia anterior e novo login.
- Migrações de schema 1/2 para 3 com cópia integral anterior obrigatória; preservação dos dados existentes e recusa de bancos futuros.
- Instalador NSIS por usuário, runtime incluído e dados preservados na desinstalação. Instalador 0.3.1 gerado localmente em `release/`, fora do Git; sua execução foi bloqueada pela política desta máquina.

## Decisões técnicas e regras financeiras

- Valores são inteiros em centavos. Lançamentos comuns entram no orçamento pelo vencimento, independentemente da data de pagamento.
- Parcelas de cartão consomem orçamento a partir do mês da compra. Faturas representam pagamentos pelo vencimento e não somam novamente às despesas do orçamento. Saldo previsto é receitas menos despesas cadastradas, não saldo bancário.
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

- Limitação de deduplicação: valor alterado, outro cartão cadastrado e compras indistinguíveis com a mesma data, valor e parcela exigem conferência; não há identificação inequívoca sem ID de transação na origem.
- O parser aceita o layout Itaú conferido; outros layouts não são suportados. Créditos/estornos são informados e ignorados, sem reduzir automaticamente a fatura ou o orçamento.
- Banco e backups sem criptografia e instalador sem assinatura são limites conhecidos do produto. Houve bloqueio do binário 0.2.0 por política do Windows na sessão anterior; o binário 0.3.0 passou no teste registrado em 2026-09-13.
- Documentação anterior parcialmente desatualizada: README ainda descreve testes/bloqueio da 0.2.0 e somente o backup de migração v1. A 0.3.0 teve teste do binário empacotado e migra também schema 2. `docs/requisitos.md` ainda não consolida a importação Itaú; seu comportamento está em `docs/importacao-itau.md`.

## Verificações e próximos passos

Nesta sessão: falha reproduzida com teste regressivo e com a fatura real somente para leitura; a importação foi simulada em cópia temporária do banco pessoal e a cópia foi removida. `npm.cmd test` aprovou 12/12 testes, `node --check` passou nos arquivos alterados, `git diff --check` passou e `npm.cmd run test:ui` retornou `SMOKE_OK`. O instalador 0.3.1 foi gerado e os arquivos da correção dentro do pacote correspondem ao código testado. A primeira tentativa foi bloqueada pela política de Controle de Aplicativo; após liberação administrativa, a instalação local foi confirmada como 0.3.1. Um backup integral verificado foi criado antes da tentativa inicial.

Após a liberação administrativa e instalação 0.3.1, uma reimportação já realizada deixou linhas excedentes no banco pessoal. O saneamento foi limitado à fatura e ao cartão afetados, com backup integral verificado. Uma auditoria comparou as chaves canônicas do Excel antes e depois: todas as compras positivas ficaram presentes uma única vez e nenhuma linha fora do arquivo permaneceu naquele escopo. Planilha, banco, valores e dados pessoais não foram versionados.

Na sessão 2026-09-13, estão registrados testes das telas no runtime e no binário 0.3.0, migração, importação e reimportação em banco isolado. O checksum do novo instalador está em `release/SHA256SUMS-0.3.1.txt`.

Priorizar a validação de atualização e Windows 10, depois alinhar README/requisitos ao estado 0.3.0. Retomar a Store somente com os dados oficiais do titular e o roteiro de publicação. Ao encerrar trabalhos futuros, atualizar este contexto e manter AGENTS.md/CLAUDE.md idênticos, executar verificações proporcionais e conferir commit/push sem incluir projetos vizinhos.

## Referências locais

- `docs/requisitos.md`: requisitos e decisões confirmadas.
- `docs/importacao-itau.md`: operação, deduplicação e limites da importação.
- `docs/notas-versao.md`: histórico das versões.
- `docs/publicacao-microsoft-store.md`: roteiro e pendências de publicação.
- `docs/agents/`: convenções de domínio, triagem e issue tracker. `CONTEXT.md` e `docs/adr/` não existem no estado revisado; este documento consolida o contexto técnico e operacional sem criar ADRs nesta sessão.
