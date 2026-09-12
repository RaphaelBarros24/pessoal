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
- Lançamentos comuns são contabilizados pelo vencimento. No cartão, cada parcela consome o orçamento do mês da compra e dos seguintes, com faturas separadas por vencimento.
- Português do Brasil e valores em reais.
- Sugestões automáticas por regras locais, sem serviços de IA ou dependência de internet.
- Backup automático local diário, além de exportação e restauração manual do banco.
- Recuperação offline por código individual gerado no cadastro e renovado após cada uso.
- Relatórios CSV para planilhas e PDF para impressão.
- Testes autorizados nas operações públicas de acesso, persistência, edição/exclusão compartilhada, totais por vencimento, limites e backup/restauração.

## Limites

- Compartilhamento entre logins do aplicativo dentro da mesma conta do Windows. Contas distintas do Windows usam bancos separados.
- Não inclui recorrências, importação de extratos ou comprovantes.
- Banco e backups não são criptografados. Credenciais de login são armazenadas como hashes.
- Instalador NSIS completo por usuário do Windows, sem assinatura digital comercial.
- Sugestões indicam limites excedidos, despesas superiores às receitas previstas, crescimento mensal superior a 20% e ausência de limites definidos.

## Critérios de aceitação

- Instalação e funcionamento sem ambiente de desenvolvimento e sem servidor externo.
- Banco local preservado ao reabrir o aplicativo e ao desinstalar.
- Cadastro de familiares disponível a usuários já conectados.
- Recuperação invalida o código anterior e exige login com a nova senha.
- Valores armazenados em centavos; despesas do orçamento e pagamentos de cartão separados, sem duplicação.
- Datas inexistentes, valores inválidos e categorias incompatíveis rejeitados.
- Edição e exclusão refletidas nos totais compartilhados.
- Backup automático atualizado com as alterações; restauração rejeita arquivos inválidos, preserva uma cópia anterior e exige novo login.
- Exportações CSV/PDF incluem os lançamentos do mês selecionado.

## Atualização 0.2.0 confirmada

- Valor total dividido em até 120 parcelas mensais; diferenças de centavos nas primeiras parcelas. Dias inexistentes ajustados sem perder o dia original nos meses seguintes.
- Meios de pagamento e acumulados: Pix, dinheiro, débito, crédito, transferência, boleto e outro. Dados antigos ficam como não informados.
- Cartões com nome, fechamento e vencimento. Compras no fechamento pertencem ao próximo ciclo: fechamento 25, vencimento 5, compra em 25/09 vence em 05/11.
- Parcelas de cartão consomem o orçamento mês a mês a partir da compra. Faturas são pagamentos previstos sem nova despesa no orçamento.
- Faturas por cartão e mês, detalhamento e registro/reabertura de pagamento.
- Edição/exclusão individuais preservam as outras parcelas. Exclusão da série disponível; mudar a quantidade requer novo cadastro.
- Configurações de cartão alteradas aplicam-se às novas compras; vencimentos existentes permanecem.
- Migração aditiva preserva caminho do banco, usuários, senhas, IDs, pagamentos, notas, categorias e limites, com cópia integral anterior obrigatória. Restauração aceita backups antigos.
- Bancos futuros recusados sem alteração. Testes somente com dados fictícios.

## Destino da entrega

Repositório autorizado: https://github.com/RaphaelBarros24/pessoal.git.

Este projeto fica na subpasta `Controle de despesas` do repositório. Dados reais de despesas e credenciais ficam fora do versionamento.
