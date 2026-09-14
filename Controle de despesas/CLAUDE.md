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
