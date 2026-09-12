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

### Issue tracker

As tarefas são acompanhadas em `RaphaelBarros24/pessoal` no GitHub. Consulte `docs/agents/issue-tracker.md`.

### Domain docs

Layout single-context: `CONTEXT.md` e `docs/adr/` na raiz deste projeto. Consulte `docs/agents/domain.md`.

## Estado da última sessão

- Criados `AGENTS.md` e `CLAUDE.md` com instruções idênticas e a rotina de encerramento solicitada pelo usuário.
- Criadas as convenções de tarefas e documentação das skills de engenharia de Matt Pocock.
- Este projeto usa o repositório Git da pasta superior `Pessoal`. Destino autorizado: `https://github.com/RaphaelBarros24/pessoal.git`.
- Autenticação do GitHub confirmada para `RaphaelBarros24` fora do sandbox.
- Preparado o primeiro commit com os quatro arquivos de configuração deste projeto. Ao encerrar as próximas sessões, atualize ambos os arquivos, faça commit e envie para o mesmo remoto.
- As skills de Matt Pocock ainda não foram instaladas; os arquivos atuais configuram as convenções do projeto.
