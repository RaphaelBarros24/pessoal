# Controle de despesas

## Instruções para os agentes

`AGENTS.md` e `CLAUDE.md` devem manter as mesmas instruções e o mesmo estado da sessão. Ao alterar um deles, atualize o outro na mesma sessão.

## Encerramento de cada sessão

1. Atualize `AGENTS.md` e `CLAUDE.md` com um resumo objetivo das alterações, verificações realizadas, pendências e próximos passos. Mantenha os dois sincronizados.
2. Revise as alterações do projeto e execute as verificações adequadas ao trabalho realizado.
3. Faça commit das alterações desta sessão e envie para o repositório GitHub configurado. O usuário autoriza esse envio ao final de cada sessão.
4. Inclua apenas arquivos deste projeto e alterações autorizadas. Não publique credenciais, segredos ou dados pessoais de despesas. Não inclua alterações de projetos vizinhos nem use push forçado.
5. Se o remoto, a autenticação ou o acesso ao GitHub estiverem indisponíveis, preserve os arquivos locais, registre a pendência nos dois arquivos e informe o impedimento. Não declare o envio concluído sem verificar seu resultado.

## Agent skills

### Instalação

As 37 skills de `mattpocock/skills` estão instaladas globalmente em `C:/Users/rapha/.codex/skills`, incluindo as categorias engineering, productivity, misc e in-progress. Referência instalada: `3cca18b368ae95cdbdebbff572ccafa662551015`.

As skills estão disponíveis ao Codex. As skills da categoria in-progress estão em desenvolvimento no repositório do autor.

### Issue tracker

As tarefas são acompanhadas em `RaphaelBarros24/pessoal` no GitHub. Consulte `docs/agents/issue-tracker.md`.

### Triage labels

Use os cinco rótulos padrão de triagem. Antes de classificar tarefas, leia `docs/agents/triage-labels.md`.

### Domain docs

Layout single-context: `CONTEXT.md` e `docs/adr/` na raiz deste projeto. Consulte `docs/agents/domain.md`.

Antes de retomar arquitetura, funcionalidades, limitações ou planejamento, leia `docs/PROJECT_CONTEXT.md` para o estado consolidado do projeto.

## Estado da última sessão

### Sessão 2026-10-05 — previsões recorrentes e baixa direta (0.6.0)

- Orçamento permite realizar a previsão diretamente pelo valor efetivamente pago, com vínculo e baixa automáticos em transação única. O valor previsto permanece para comparação e a reserva do mês é liberada; meses seguintes são preservados. Lançamento já vinculado deve ser editado, evitando duplicação.
- Previsões podem ser repetidas mensalmente até um mês final, por até 120 meses, com remoção individual da previsão sem excluir pagamentos. Guia e limites em `docs/previsoes-recorrentes.md`.
- Painel, orçamento e PDF mostram previsto, realizado, ainda reservado e comprometido. Grupos mostram percentual consumido e saldo após reservas. Saldo previsto desconta também reservas; mantém a regra anterior para pagamentos pendentes. CSV e histórico continuam baseados em lançamentos.
- Schema 7 adiciona vínculo da conversão. Migrações com backup integral verificado, reabertura, exclusão e alteração do mês/vínculo cobertas por testes fictícios. `npm.cmd test`: 27/27; sintaxe e whitespace aprovados; interface de desenvolvimento e EXE empacotado retornaram `SMOKE_OK`; captura do orçamento conferida.
- Instalador 0.6.0 gerado em staging com dependências completas; desktop/ui empacotados idênticos ao código final. SHA-256: `6be7dc5cb35f98d5841a54a1f9ad3b743a8f34585f017d29968f319e5534e9b6`. Dados pessoais e instalação 0.5.0 não alterados.
- Pendências: instalar 0.6.0 para uso pessoal; validar Windows 10. Publicação de release e Store continuam pendentes. Encerramento autorizado com commit/push somente dos arquivos do projeto; banco, backups, instaladores e projetos vizinhos fora do Git.

### Sessão 2026-10-01 — investimentos em CDB (0.5.0)

- Nova tela Investimentos: aplicações prefixadas ou em percentual do CDI, objetivo, emissor, liquidez, vencimento, cadastro/edição/exclusão e registro/reabertura de resgate total pelo valor efetivamente recebido.
- Carteira com capital, saldo/ganho líquido estimados, projeção de 3 a 60 meses, gráfico/tabela mensal, cenários de CDI, vencimentos e distribuição por emissor. Simulador independente com aportes mensais por até 120 meses e IR/IOF por lote.
- Premissas e fontes oficiais em `docs/investimentos-cdb.md`: CDI constante manual (10% inicial é exemplo), dias úteis aproximados por dias corridos × 252/365, rendimento/tributação limitados ao vencimento. Sem saldo histórico real, resgate parcial ou integração automática ao orçamento.
- Schema 6 com backup obrigatório. `npm.cmd test` aprovou 24/24; sintaxe/whitespace aprovados; smoke da interface no desenvolvimento e no binário empacotado retornou `SMOKE_OK`. Capturas da carteira e do simulador conferidas; largura mínima de 1000 pixels validada.
- Instalador 0.5.0 gerado em staging limpo, instalado e conteúdo comparado ao código testado. SHA-256: `e00ee96b5295ba29710078cd8934b799c68fa3d9040cdadccafccf4ab2ec6641`. Backup pré-instalação e backup automático de migração verificados; nove tabelas anteriores idênticas, banco íntegro, sem violações de chave estrangeira e carteira vazia.
- A execução automatizada do EXE exige remover `ELECTRON_RUN_AS_NODE` somente do ambiente do processo filho. A variável herdada explicava a saída imediata registrada na sessão anterior; o binário 0.5.0 passou no smoke e iniciou com ambiente normal.
- Pendências: Windows 10, distribuição pública e Store continuam sem validação/publicação nesta sessão. Resgates parciais, outros ativos e CDI histórico permanecem fora desta entrega. Encerramento: commit/push somente dos arquivos do projeto; artefatos, banco e dados pessoais ficam fora do Git.

### Sessão 2026-10-01 — correção de banco inválido após excluir despesa planejada

- Diagnosticado e reproduzido o erro de abertura “Banco inválido”: o `sql.js` desativa chaves estrangeiras após `db.export()`, e a exclusão de despesas planejadas podia preservar suas previsões mensais como vínculos órfãos.
- Versão 0.4.3 reativa `PRAGMA foreign_keys=ON` na abertura e após toda exportação. Teste regressivo cobre reabertura, exclusão com previsão e nova abertura; `npm.cmd test` aprovou 16/16 e `npm.cmd run test:ui` retornou `SMOKE_OK` fora do sandbox.
- O banco local foi reparado após backup integral verificado: somente cinco registros de `planned_expense_budgets` ligados a despesas já excluídas foram removidos. `integrity_check` retornou `ok`, `foreign_key_check` ficou sem violações e uma cópia abriu pelo código corrigido.
- Instalador 0.4.3 gerado em staging limpo e instalado. SHA-256: `64e0019ee618254698a504b130801acd6d7e478be8ec849392ef4c924133cd04`. O executável instalado informa 0.4.3 e o `app.asar` contém a correção.
- Pendência: confirmar manualmente a janela de login, pois o EXE encerrou sem janela na sessão automatizada apesar de o pacote, o banco e o runtime isolado estarem válidos. Cinco pontos de reanálise com nomes corrompidos na raiz impediram o build direto; foram preservados e o empacotamento foi feito em staging temporário.

### Sessão 2026-09-30 — recuperação administrativa local

- Versão 0.4.2 adiciona **Recuperação administrativa local** na tela de login para perda simultânea de senha e código. O fluxo lista contas do banco local, exige confirmação exata do usuário e nova senha confirmada.
- Antes da troca, é criado `backups/antes-recuperacao-administrativa-*.sqlite`; senha e código anteriores são invalidados e um novo código é exibido uma única vez. A autorização decorre do controle da conta do Windows e do banco, que permanece local e não criptografado.
- Teste regressivo confirmou backup, confirmação obrigatória, invalidação das credenciais antigas e login com a nova senha. `npm.cmd test` aprovou 15/15; sintaxe, whitespace e `npm.cmd run test:ui` com fluxo completo retornaram sucesso.
- Instalador 0.4.2 gerado, instalado e aberto. SHA-256: `46883c1c4ccf0f2d6c299bd0bad3f76bee6cefa6d19c0eef4262e7d48bf1ab1a`. Backup pré-instalação verificado. O instalador deve ser executado no computador que contém o banco do Flávio.
- Pendências: entregar/executar o instalador no computador do Flávio e guardar o novo código em local seguro; validar em Windows 10. Não versionar credenciais, banco, backups ou instaladores.

### Sessão 2026-09-30 — correção da hierarquia do orçamento

- Corrigida a interpretação do requisito: grupo, despesa planejada e classificação são três conceitos distintos. Um grupo aceita várias despesas, inclusive várias com a mesma classificação, cada uma com previsão própria.
- Lançamentos podem apontar para uma despesa planejada; o realizado é calculado por esse vínculo. Alterar a classificação da despesa atualiza seus lançamentos vinculados. O schema 5 adiciona `planned_expenses`, `planned_expense_budgets` e o vínculo opcional em `entries`.
- Diagnóstico reproduzido por teste mínimo antes da correção; `npm.cmd test` aprovou 14/14 e `npm.cmd run test:ui` retornou `SMOKE_OK`. A captura visual confirmou “Necessidades → Mercado → Alimentação”.
- Instalador 0.4.1 gerado e instalado. SHA-256: `b4a485f47f5ca51f98e249f65a3c965afecde77e02f9e3b7244e864b2a27aa2f`. Backups pré-instalação e pré-migração verificados; banco no schema 5, íntegro e sem violações de chave estrangeira.
- Pendências: validar em Windows 10 e publicar/distribuir somente quando solicitado. Banco, backups, código de recuperação, instalador e dados pessoais permanecem fora do Git.

### Sessão 2026-09-30 — orçamento por grupos e despesas

- Versão 0.4.0 implementada: grupos de despesas permanentes, previsão mensal independente no grupo e na categoria, realizado e saldo nos dois níveis, além de área “Sem grupo”.
- Excluir um grupo preserva categorias, lançamentos e previsões das despesas; somente a previsão do grupo é removida. A migração aditiva para o schema 4 cria `expense_groups`, `group_budgets` e o vínculo opcional da categoria, com cópia integral anterior.
- Criado `CONTEXT.md` com a linguagem do domínio. Testes: `npm.cmd test` 13/13, verificações de sintaxe e whitespace, `npm.cmd run test:ui` com `SMOKE_OK` e inspeção visual da tela de orçamento.
- Instalador 0.4.0 gerado e instalado sobre a 0.3.2. SHA-256: `2cbbc1066731ae270e8a6d16259cb45cc49a05aed6d3bcc9aeeb061ccf8ef54b`. Backup integral prévio e backup automático da migração foram verificados; banco ativo no schema 4 com integridade e chaves estrangeiras válidas. Aplicativo instalado confirmado em execução.
- Pendências: validar em Windows 10 e publicar/distribuir somente quando solicitado; instalador continua sem assinatura comercial ou da Microsoft Store. Não versionar banco, backups, código de recuperação, instalador nem dados pessoais.

### Sessão 2026-09-30 — saldo previsto considera despesas a pagar

- Regra confirmada pelo usuário: `saldo previsto = receitas previstas - despesas previstas - despesas a pagar`. Uma despesa comum pendente pode participar das duas parcelas de despesa; essa sobreposição é intencional nesta decisão.
- Backend centraliza o total a pagar e o reutiliza no saldo, em `pending` e em `payable`. A tela e o relatório PDF explicam a mesma fórmula.
- Teste regressivo passou de vermelho para verde; `npm.cmd test` aprovou 12/12, `node --check`, `git diff --check` e `npm.cmd run test:ui` com `SMOKE_OK`. A fórmula foi conferida em cópia temporária do banco real, removida ao final; o banco pessoal não foi alterado.
- Instalador 0.3.2 gerado, conteúdo empacotado conferido e instalação por cima da 0.3.1 concluída com backup integral verificado. A versão instalada e os arquivos de cálculo foram confirmados como 0.3.2. Encerramento: revisar diff, commit e push; arquivos pessoais permanecem fora do Git.

### Sessão 2026-09-30 — saneamento local após reimportação

- Após a instalação 0.3.1, a fatura atualizada foi comparada em leitura com o banco pessoal. A auditoria reproduziu excesso composto por duplicidades e lançamentos antigos que não pertenciam ao arquivo canônico.
- Com autorização do usuário, o aplicativo foi fechado normalmente, foi criado e verificado um backup integral e somente as linhas excedentes daquela fatura/cartão foram removidas. Outros cartões e meses permaneceram fora do escopo.
- A mesma auditoria passou de `RED` para `GREEN`: todas as compras positivas do Excel ficaram presentes uma única vez, sem linhas extras. Créditos/estornos continuam informados e ignorados pela versão 0.3.1; nenhuma informação financeira ou planilha foi adicionada ao Git.
- A instalação local foi confirmada como 0.3.1. Utilitários temporários de auditoria e reparo foram removidos; o arquivo pessoal de recuperação continua não rastreado e fora do commit.

### Sessão 2026-09-30 — correção da reimportação de fatura atualizada

- Reproduzido o bloqueio da fatura atualizada: créditos/estornos negativos interrompiam a leitura antes da comparação, e o Itaú havia alterado descrições e o identificador mascarado entre exportações.
- Versão 0.3.1 preparada. Compras positivas continuam sendo importadas; créditos/estornos são ignorados com quantidade e total informados. Reimportações usam correspondência secundária por cartão, mês, data, valor, parcela, total de parcelas e ocorrência quando os campos da origem mudam.
- Lançamentos existentes são preservados sem sobrescrever descrição, categoria, notas, valor ou pagamento. Não há substituição destrutiva da fatura; compras indistinguíveis continuam limitadas pela ausência de ID estável no Excel do Itaú.
- Testes: regressão vermelho/verde, simulação em cópia temporária do banco real, `npm.cmd test` com 12/12, `node --check`, `git diff --check` e `npm.cmd run test:ui` com `SMOKE_OK`. O banco pessoal não foi alterado durante o diagnóstico.
- Instalador 0.3.1 gerado e conteúdo da correção conferido; SHA-256 registrado localmente. A política de Controle de Aplicativo bloqueou sua execução, portanto a instalação permanece em 0.3.0. Backup integral verificado foi criado antes da tentativa. Pendências: instalar em ambiente permitido e confirmar a reimportação real.
- Encerramento: revisar diff, commit e push. Não incluir fatura, banco, código de recuperação ou instalador no Git.

### Sessão 2026-09-14 — revisão e contexto do projeto

- Revisada a implementação 0.3.0 já versionada em `bc51e1c`: arquitetura Electron/IPC/SQLite, autenticação, persistência, migrações, orçamento, parcelas, cartões, importação Itaú, relatórios e backups. Não havia alterações de código pendentes neste projeto.
- Criado `docs/PROJECT_CONTEXT.md` com arquitetura, funcionalidades concluídas/pendentes, limitações, decisões técnicas, verificações e próximos passos. AGENTS.md e CLAUDE.md mantidos idênticos e com referência ao contexto consolidado.
- Onze testes passaram com `npm.cmd test`; sintaxe dos arquivos JavaScript de desktop/ui/tests aprovada por `node --check`. Diff revisado e verificação de whitespace realizada. Testes das telas, instalação e empacotamento não repetidos nesta sessão documental; banco pessoal não alterado.
- Nenhum novo bug funcional reproduzido. Registradas limitações da deduplicação e do layout Itaú, ausência de criptografia/assinatura e inconsistências antigas do README/requisitos sobre o estado 0.3.0.
- Pendências e próximos passos: validar atualização por instalação e Windows 10; alinhar README/requisitos; publicação 0.3.0 e Store continuam pendentes. Store depende do cadastro/identificadores do titular e testes MSIX. Recorrências, extratos genéricos, comprovantes e sincronização permanecem fora do escopo atual.
- Encerramento preparado para commit e envio a `origin/master`, somente com os três documentos deste projeto. Arquivos não rastreados de projetos vizinhos foram excluídos do escopo; nenhum dado pessoal ou instalador incluído.

### Sessão 2026-09-13 — versão 0.3.0

- Implementada importação local de fatura Itaú Excel (.xlsx), com seleção do cartão, prévia de quantidade/total/vencimento e lançamentos individuais por linha. Pagamentos e subtotais ignorados; não são geradas parcelas futuras. Créditos/estornos são recusados com aviso sem importar parcialmente.
- Duplicados identificados por hash dos campos da origem e ocorrência; lançamentos manuais comparados por cartão, data, descrição normalizada, valor, parcela e mês da fatura. Descrições/valores alterados e exportações parciais de compras indistinguíveis exigem conferência. Consultar `docs/importacao-itau.md`.
- Classificação automática por histórico sem conflito e regras conservadoras. Tela Importar fatura lista pendências de todos os meses, já incluídas no orçamento como A classificar. Classificação salva serve de histórico para novas importações.
- Schema 3 adiciona chave de importação e estado de classificação, com cópia integral obrigatória antes da migração v1/v2. IDs, usuários, senhas, cartões, parcelas, valores, pagamentos e limites preservados. Backup/restauração preservam deduplicação e pendências.
- Onze testes automatizados passaram. Teste das telas passou no runtime de desenvolvimento e no próprio binário 0.3.0 empacotado, incluindo seleção Excel, importação, classificação e reimportação. Sintaxe JavaScript, diff e conteúdo do pacote revisados. npm install/audit: zero vulnerabilidades após override UUID 11.1.1 para ExcelJS 4.4.0.
- Planilha pessoal fornecida conferida em banco isolado temporário: 54 compras/parcelas, um pagamento ignorado, total conferido e segunda importação sem duplicados. Banco temporário removido; banco pessoal e instalação existente não alterados. Faturas pessoais ignoradas pelo Git; dados cadastrais da planilha não copiados para os lançamentos.
- Instalador `release/Saldo-Familiar-0.3.0-Windows-x64.exe` gerado; SHA-256 `9d4ffbdef27bbc8fd498d4c91c36b2c7d8e46d31d654bc85793fd21e83c8474e`, registrado em `release/SHA256SUMS-0.3.0.txt`. Nenhuma release 0.3.0 ou submissão à Store publicada nesta sessão.
- Pendências: instalação por cima da versão atual e teste em Windows 10. Microsoft Store permanece dependente do cadastro/identificadores oficiais do titular; EXE 0.3.0 continua sem assinatura comercial ou da loja. Recorrências e importação genérica de extratos continuam fora do escopo.
- Encerramento: revisão concluída; destino autorizado do código é `origin/master` em `RaphaelBarros24/pessoal`. Instalador fica local na pasta release, fora do Git.

### Histórico anterior

- Atualização 0.2.0: parcelas automáticas pelo valor total, meios de pagamento e acumulados, cartões com fechamento/vencimento e faturas por cartão e mês.
- Compras no dia do fechamento entram no próximo ciclo. Parcelas do cartão consomem orçamento desde o mês da compra; faturas são pagamentos sem duplicação. Demais lançamentos continuam por vencimento.
- Edição/exclusão individual de parcelas, exclusão da série, detalhamento e pagamento/reabertura de fatura. Configurações de cartão alteradas afetam novas compras.
- Migração aditiva de schema 1 para 2 com cópia integral anterior obrigatória; usuários, senhas, IDs, pagamentos, notas, categorias e limites preservados. Restauração aceita bancos antigos; versões futuras recusadas sem alteração.
- Mantidos caminho do banco, identidade do aplicativo e preservação de dados na desinstalação. Todos os logins compartilham dados dentro da mesma conta do Windows.
- Sete testes públicos passaram, incluindo regressões, migração, recuperação, backup/restauração, centavos, parcelas em meses curtos, fechamento e faturas sem duplicação.
- Testes das telas passaram no runtime de desenvolvimento com cadastro, parcelas, cartões, edição pela fatura, pagamento, exportações e backup; teste de atualização com banco antigo fictício passou. Dashboard, formulário e PDF conferidos visualmente.
- Instalador 0.2.0 gerado. A política de Controle de Aplicativo do Windows bloqueou o novo executável empacotado: execução do binário e instalação desta atualização permanecem pendentes em outro Windows. Não foi alterado o banco pessoal nem a instalação existente para testes. Windows 10 não testado diretamente.
- Código enviado no commit `7de6a7f`. Release `v0.2.0` publicada com instalador `Saldo-Familiar-0.2.0-Windows-x64.exe` e `SHA256SUMS.txt`; ambos os anexos conferidos como uploaded. SHA-256 remoto do instalador corresponde ao arquivo local: `e49628e66672faff0edbd71c886f78a3ca725b781fe6726a2d6bcce27782f0a1`.
- Este projeto usa o repositório Git da pasta superior `Pessoal`. Destino autorizado: `https://github.com/RaphaelBarros24/pessoal.git`.
- Banco e backups são locais e não criptografados; o instalador não possui assinatura digital comercial. Dados reais, dependências instaladas e artefatos de teste ficam fora do Git.
- Próximo passo: validar instalador e binário 0.2.0 em Windows que permita execução e em Windows 10. Recorrências e importação continuam fora do escopo atual.
- Diagnóstico do aviso apresentado pelo usuário: SmartScreen informa download pouco comum e fornecedor desconhecido, sem indicar detecção de malware nesse print. `Get-AuthenticodeSignature` confirmou `NotSigned` no instalador 0.2.0. Referência: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation . Assinatura com identidade validada ou distribuição pela Microsoft Store depende de conta/certificado do titular; assinatura nova não garante reputação imediata. Não foram desativadas proteções nem alterados o instalador ou banco nesta investigação.
- Usuário escolheu obter assinatura como pessoa física. Pesquisa: SSL.com oferece IV Code Signing sem empresa, com token/HSM ou eSigner; referência https://www.ssl.com/products/software-integrity/code-signing/ . Confirmar emissão para residente no Brasil, documentos e custo total antes de contratar. Azure Artifact Signing público para indivíduos limitado a EUA/Canadá na documentação consultada: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options . Nenhuma compra, cadastro ou envio de documentos realizado. Integração de assinatura depende da contratação e validação do titular.
- Decisão posterior: usuário escolheu Microsoft Store (MSIX), com assinatura pela loja, em lugar de comprar certificado. Preparados roteiro e descrição em `docs/publicacao-microsoft-store.md`; consultar ao retomar empacotamento/publicação. Documentação oficial verificada; builder 26.15.3 instalado possui AppX, sem alvo MSIX nativo. Pendências: cadastro individual gratuito e reserva pelo titular, identificadores oficiais, ferramenta/pacote MSIX, privacidade/contato e testes de transferência do banco e atualização. Nenhuma submissão ou mudança no aplicativo/banco nesta sessão. A assinatura da loja não se aplica ao EXE atual do GitHub.
