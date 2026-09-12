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

- Setup das skills concluído e publicado no commit `b5be9c7`: GitHub Issues, rótulos padrão e domínio single-context.
- Confirmados pelo usuário: Windows como primeira plataforma, banco local com login offline por máquina e orçamento familiar compartilhado.
- Atualizado `docs/requisitos.md` com essas escolhas. O compartilhamento familiar ocorre no banco da mesma máquina, sem sincronização entre máquinas.
- Este projeto usa o repositório Git da pasta superior `Pessoal`. Destino autorizado: `https://github.com/RaphaelBarros24/pessoal.git`.
- Autenticação do GitHub confirmada para `RaphaelBarros24` fora do sandbox.
- O usuário solicitou desenvolver um software de despesas pessoais com banco próprio, login, dashboard, análises mensais, sugestões de orçamento e cadastro/edição/exclusão de despesas.
- A entrega deve incluir instalador com todos os arquivos necessários e publicação do projeto completo no GitHub. Referências: Expensify e Brex.
- Pendente: confirmar escopo da primeira versão, contas e permissões familiares, mês de contabilização das despesas e padrões de idioma, moeda e sugestões offline.
- Antes da entrega, definir também backup/restauração, recuperação de acesso e versões de Windows suportadas; implementar e verificar o instalador completo.
