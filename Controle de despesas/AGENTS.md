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

## Estado da última sessão

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
