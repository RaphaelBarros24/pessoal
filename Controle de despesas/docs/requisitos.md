# Controle de despesas pessoais

## Requisitos confirmados

- Software para controle de despesas pessoais.
- Banco de dados próprio que acompanha o aplicativo.
- Tela de login.
- Dashboard com informações relevantes do orçamento, análise dos gastos mensais e sugestões de melhorias no orçamento.
- Cadastro de despesas, com edição e exclusão.
- Instalador com todos os arquivos necessários para instalar e executar o aplicativo nos sistemas suportados, sem ambiente de desenvolvimento.
- Publicação do projeto completo no GitHub ao final do desenvolvimento.
- Usar Expensify e Brex como referências de produto.
- Esclarecer com o usuário as decisões ainda desconhecidas.
- Primeira plataforma: Windows.
- Banco de dados local, incluído no aplicativo, com login offline por máquina.
- Uso familiar, com orçamento compartilhado no banco da mesma máquina. Sincronização entre máquinas não faz parte da configuração escolhida.
- Nome: Saldo Familiar; interface clara com detalhes em verde.
- Compatibilidade escolhida: Windows 10 e 11 de 64 bits.
- Primeira versão: despesas, receitas, categorias, orçamento mensal e relatórios.
- Cada familiar tem seu login; todos podem editar e excluir os lançamentos e alterar o orçamento compartilhado.
- O mês de contabilização é o mês do vencimento. Parcelas lançadas manualmente entram nos respectivos vencimentos; geração automática de parcelas fica fora da primeira versão.
- Português do Brasil e valores em reais.
- Sugestões automáticas por regras locais, sem serviços de IA ou dependência de internet.
- Backup automático local diário, além de exportação e restauração manual do banco.
- Recuperação offline por código individual gerado no cadastro e renovado após cada uso.
- Relatórios CSV para planilhas e PDF para impressão.
- Testes autorizados nas operações públicas de acesso, persistência, edição/exclusão compartilhada, totais por vencimento, limites e backup/restauração.

## Limites da primeira versão

- Compartilhamento entre logins do aplicativo dentro da mesma conta do Windows. Contas distintas do Windows usam bancos separados.
- Não inclui cartões, geração automática de parcelas, recorrências, importação de extratos ou comprovantes.
- Banco e backups não são criptografados. Credenciais de login são armazenadas como hashes.
- Instalador NSIS completo por usuário do Windows, sem assinatura digital comercial.
- Sugestões indicam limites excedidos, despesas superiores às receitas previstas, crescimento mensal superior a 20% e ausência de limites definidos.

## Critérios de aceitação

- Instalação e funcionamento sem ambiente de desenvolvimento e sem servidor externo.
- Banco local preservado ao reabrir o aplicativo e ao desinstalar.
- Cadastro de familiares disponível a usuários já conectados.
- Recuperação invalida o código anterior e exige login com a nova senha.
- Valores armazenados em centavos e classificados por vencimento.
- Datas inexistentes, valores inválidos e categorias incompatíveis rejeitados.
- Edição e exclusão refletidas nos totais compartilhados.
- Backup automático atualizado com as alterações; restauração rejeita arquivos inválidos, preserva uma cópia anterior e exige novo login.
- Exportações CSV/PDF incluem os lançamentos do mês selecionado.

## Destino da entrega

Repositório autorizado: https://github.com/RaphaelBarros24/pessoal.git.

Este projeto fica na subpasta `Controle de despesas` do repositório. Dados reais de despesas e credenciais ficam fora do versionamento.
