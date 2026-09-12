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

- Desenvolvida a primeira versão do Saldo Familiar: aplicativo Windows offline com Electron e SQLite incluído.
- Implementados login individual, recuperação por código de uso único, receitas/despesas, edição/exclusão compartilhada, categorias, limites mensais, dashboard, histórico de seis meses, sugestões locais e relatórios CSV/PDF.
- Implementados backup manual, backup automático diário atualizado a cada alteração (30 cópias diárias) e restauração validada com cópia de segurança anterior.
- Confirmados português do Brasil, reais, competência por vencimento, uso familiar e Windows 10/11 de 64 bits. Todos os logins do aplicativo compartilham o banco dentro da mesma conta do Windows.
- Testes das operações públicas passaram; teste da interface passou com cadastro e lançamentos pelas telas, navegação, exportações e backup. PDF e dashboard conferidos visualmente.
- Instalador completo gerado; instalação, teste do aplicativo instalado e desinstalação de teste passaram nesta máquina Windows 11. Windows 10 ainda não foi testado diretamente.
- Dependências verificadas com `npm audit`: zero vulnerabilidades conhecidas no momento da verificação.
- Documentação de uso, requisitos e notas da versão adicionadas. Entrega da versão: tag `v0.1.0`, instalador `Saldo-Familiar-0.1.0-Windows-x64.exe` e `SHA256SUMS.txt` nos anexos da release.
- Este projeto usa o repositório Git da pasta superior `Pessoal`. Destino autorizado: `https://github.com/RaphaelBarros24/pessoal.git`.
- Banco e backups são locais e não criptografados; o instalador não possui assinatura digital comercial. Dados reais, dependências instaladas e artefatos de teste ficam fora do Git.
- Próximos passos opcionais: validar em Windows 10 e, se solicitado, ampliar para cartões, geração de parcelas, recorrências e importação. Esses recursos ficam fora da versão atual confirmada.
