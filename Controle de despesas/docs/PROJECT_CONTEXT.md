# Contexto do projeto — Saldo Familiar

Atualizado em 2026-09-14. Versão implementada: 0.3.0, commit de referência `bc51e1c`. Esta sessão revisou a implementação existente e atualizou documentação; não alterou funcionalidades ou o banco pessoal.

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
- Importação local de fatura Itaú XLSX, seleção do cartão, prévia, importação por linha, prevenção de duplicados e classificação por histórico ou regras conservadoras. Pendências de todos os meses aparecem como A classificar e já consomem orçamento.
- CSV/PDF, backup manual, backup diário atualizado nas alterações com retenção de 30 cópias diárias e restauração validada com cópia anterior e novo login.
- Migrações de schema 1/2 para 3 com cópia integral anterior obrigatória; preservação dos dados existentes e recusa de bancos futuros.
- Instalador NSIS por usuário, runtime incluído e dados preservados na desinstalação. Instalador 0.3.0 gerado localmente em `release/`, fora do Git.

## Decisões técnicas e regras financeiras

- Valores são inteiros em centavos. Lançamentos comuns entram no orçamento pelo vencimento, independentemente da data de pagamento.
- Parcelas de cartão consomem orçamento a partir do mês da compra. Faturas representam pagamentos pelo vencimento e não somam novamente às despesas do orçamento. Saldo previsto é receitas menos despesas cadastradas, não saldo bancário.
- Compra no dia do fechamento entra no próximo ciclo. Alterar configuração do cartão afeta novas compras; vencimentos existentes são preservados.
- Edição/exclusão individual afeta somente a parcela escolhida. Para mudar a quantidade de parcelas manuais, excluir a série e cadastrar novamente.
- Importação cria somente a parcela presente em cada linha, sem antecipar parcelas futuras nem criar uma série vinculada. O vencimento vem da planilha; o mês de orçamento deriva da compra e do número da parcela.
- Deduplicação usa SHA-256 de campos normalizados da origem e número da ocorrência. Correspondências manuais são vinculadas sem sobrescrever categoria, notas, valor ou pagamento. A planilha não fornece ID único de transação.
- Pagamentos e subtotais da planilha são ignorados; pagamentos não quitam automaticamente a fatura. Créditos/estornos impedem a importação do arquivo inteiro. Limites: 10 MB e 5.000 compras no layout Itaú conferido.
- Classificação usa categoria única no histórico; conflito exige classificação manual. Regras locais conservadoras cobrem alimentação, transporte e saúde quando suas categorias existem.
- Identidade do aplicativo e caminho de dados permanecem estáveis entre versões. Distribuição pela Microsoft Store foi escolhida pelo usuário, mas o pacote atual continua NSIS sem assinatura comercial ou da loja. Consultar o roteiro antes de retomar publicação.
- O repositório Git fica na pasta superior `Pessoal`; destino autorizado é `origin/master` em `RaphaelBarros24/pessoal`. Versionar somente arquivos deste projeto; dados pessoais, dependências, instaladores e artefatos de teste ficam fora do Git.

## Funcionalidades e entregas pendentes

- Validar instalação 0.3.0 por cima da instalação atual e preservação dos dados, com backup prévio; validar em Windows 10.
- Publicar a release 0.3.0 com instalador e checksum, quando solicitado. A geração local não equivale a publicação.
- Microsoft Store: cadastro e reserva pelo titular, identificadores oficiais, privacidade/contato, ferramenta e pacote MSIX, testes de transferência do banco e atualização. Não houve submissão. O builder configurado usa NSIS; o roteiro registra suporte AppX e ausência de alvo MSIX nativo no builder instalado.
- Recorrências, importação genérica de extratos e comprovantes não estão implementados e permanecem fora do escopo atual. Sincronização entre máquinas também está fora da configuração escolhida.

## Bugs conhecidos e limitações

Nenhum novo bug funcional foi reproduzido nesta revisão e os 11 testes passaram. Isso não substitui os testes de instalação e compatibilidade pendentes.

- Limitação de deduplicação: descrição/valor alterados, outro cartão cadastrado e exportações parciais de compras indistinguíveis exigem conferência; não há identificação inequívoca sem ID de transação na origem.
- O parser aceita o layout Itaú conferido; outros layouts e créditos/estornos não são suportados.
- Banco e backups sem criptografia e instalador sem assinatura são limites conhecidos do produto. Houve bloqueio do binário 0.2.0 por política do Windows na sessão anterior; o binário 0.3.0 passou no teste registrado em 2026-09-13.
- Documentação anterior parcialmente desatualizada: README ainda descreve testes/bloqueio da 0.2.0 e somente o backup de migração v1. A 0.3.0 teve teste do binário empacotado e migra também schema 2. `docs/requisitos.md` ainda não consolida a importação Itaú; seu comportamento está em `docs/importacao-itau.md`.

## Verificações e próximos passos

Nesta sessão: código e documentos existentes revisados, `npm.cmd test` com 11/11 testes aprovados, sintaxe verificada por `node --check` em `desktop`, `ui` e `tests`, e diff revisado com `git diff --check`. O uso de `npm.cmd` contornou o bloqueio de `npm.ps1` pela política de scripts sem mudar a configuração do Windows. Não foram repetidos testes das telas ou gerado novo instalador para esta alteração documental.

Na sessão 2026-09-13, estão registrados testes das telas no runtime e no binário 0.3.0, migração, importação e reimportação em banco isolado; não são novos testes desta sessão. O checksum do instalador está em `release/SHA256SUMS-0.3.0.txt`.

Priorizar a validação de atualização e Windows 10, depois alinhar README/requisitos ao estado 0.3.0. Retomar a Store somente com os dados oficiais do titular e o roteiro de publicação. Ao encerrar trabalhos futuros, atualizar este contexto e manter AGENTS.md/CLAUDE.md idênticos, executar verificações proporcionais e conferir commit/push sem incluir projetos vizinhos.

## Referências locais

- `docs/requisitos.md`: requisitos e decisões confirmadas.
- `docs/importacao-itau.md`: operação, deduplicação e limites da importação.
- `docs/notas-versao.md`: histórico das versões.
- `docs/publicacao-microsoft-store.md`: roteiro e pendências de publicação.
- `docs/agents/`: convenções de domínio, triagem e issue tracker. `CONTEXT.md` e `docs/adr/` não existem no estado revisado; este documento consolida o contexto técnico e operacional sem criar ADRs nesta sessão.
