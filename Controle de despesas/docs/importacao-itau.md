# Importação de fatura Itaú — 0.3.0

1. Cadastre o cartão em **Cartões e faturas**, caso ainda não exista. Use o mesmo cadastro em todas as importações dessa fatura, inclusive cartões adicionais e virtuais que a compõem.
2. Abra **Importar fatura** e clique em **Selecionar planilha**. Escolha o `.xlsx` exportado pelo Itaú.
3. Confira a quantidade, o total das compras e o vencimento. Selecione o cartão correspondente e clique em **Importar lançamentos**.
4. Confira o resultado: importados, duplicados ignorados e pendências. Em **Classificação pendente**, clique em **Classificar**, escolha uma categoria e salve.

O processamento é local. Nome do titular, agência e conta não são copiados para os lançamentos. O identificador de origem usa um hash; o número mascarado presente no arquivo ajuda a distinguir compras iguais em cartões físicos, virtuais ou adicionais.

## Duplicados

Reimportações usam cartão cadastrado, data, descrição normalizada, valor em centavos, parcela, total de parcelas e cartão mascarado da origem. Ocorrências iguais dentro da mesma fatura são preservadas individualmente. A ordem das linhas não altera a comparação entre itens diferentes.

Lançamentos manuais são comparados pelo cartão cadastrado, data da compra, descrição normalizada, valor, parcela e mês de vencimento. Uma correspondência é vinculada à importação sem alterar valor, categoria, notas ou pagamento. Descrições diferentes, valor modificado ou compra cadastrada em outro cartão podem impedir a identificação; confira esses casos após importar. A planilha não fornece um identificador único de transação, portanto compras indistinguíveis em exportações parciais não podem ser diferenciadas com certeza.

## Classificação e parcelas

Uma descrição já classificada com uma única categoria no histórico recebe essa categoria. Históricos com categorias conflitantes ficam pendentes. Sem histórico, regras conservadoras reconhecem descrições de alimentação, transporte e saúde quando a categoria correspondente existe. Descrições genéricas de lojas ficam pendentes.

As pendências aparecem em todos os meses e já contam nos totais como **A classificar**. A categoria escolhida fica disponível para futuras importações da mesma descrição. A classificação pode ser ajustada pela edição comum do lançamento.

Cada linha gera somente a parcela que consta na fatura, com seu valor integral em centavos. Não há geração de parcelas futuras. O vencimento vem da planilha; o mês de orçamento segue a data original da compra mais o número da parcela menos um, como nas compras parceladas cadastradas no aplicativo. Parcelas importadas são independentes e podem ser excluídas individualmente.

Pagamentos efetuados são ignorados para não duplicar despesas e não marcam automaticamente a fatura como paga. Subtotais e dados cadastrais são ignorados. Créditos/estornos são recusados com aviso, sem importar o arquivo parcialmente. São aceitos arquivos de até 10 MB e até 5.000 compras no layout conferido do Itaú, com colunas Data, Lançamento, Parcelamento e Valor.

## Atualização e verificações

O banco permanece em `%APPDATA%\Saldo Familiar\family.sqlite`. A migração aditiva para schema 3 preserva os dados e cria uma cópia integral do banco anterior em `backups/antes-atualizacao-v1-*` ou `backups/antes-atualizacao-v2-*`. Backups antigos continuam aceitos; versões futuras são recusadas.

Onze testes automatizados passaram, incluindo migração v1/v2, backup/restauração, duplicados manuais, ocorrências repetidas, classificação, parcelas e reversão de lote inválido. O fluxo das telas foi testado com uma planilha fictícia. A planilha fornecida pelo usuário foi lida e importada em banco isolado temporário, com conferência de total e reimportação sem duplicação; o banco de teste foi removido. O banco pessoal e a instalação existente não foram alterados.

O instalador 0.3.0 foi gerado e seu binário empacotado passou no teste completo das telas, incluindo importação, classificação e reimportação. Instalação por cima da versão atual e Windows 10 ainda não foram testados. A distribuição pela Microsoft Store continua pendente do cadastro e identificadores oficiais do titular. A auditoria npm após atualização da dependência UUID do ExcelJS encontrou zero vulnerabilidades.
