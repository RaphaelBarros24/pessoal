# Previsões recorrentes e realização

Na tela **Orçamento**, cadastre ou edite uma despesa e informe **Repetir mensalmente até (inclusive)**. A previsão começa no mês selecionado e pode abranger até 120 meses. Cada mês recebe o valor integral informado, sem dividir o valor em parcelas. Previsões anteriores dentro do período escolhido são substituídas; pagamentos existentes são preservados. Meses fora do período não são alterados.

Para pagar, use **Realizar e dar baixa** na linha da despesa. Informe o valor efetivamente pago, vencimento no mês da previsão, data do pagamento e forma de pagamento. A operação cria o lançamento real e seu vínculo automaticamente, em uma única transação. A previsão original permanece disponível para comparação, mas a reserva daquele mês é liberada integralmente, inclusive se o valor pago for menor ou maior que o previsto. Os meses seguintes permanecem provisionados.

Se já houver lançamento vinculado, a tela oferece **Ver lançamento / dar baixa**. A conversão recusa criar outro lançamento para o mesmo item/mês. Despesas com várias compras vinculadas continuam permitindo acompanhamento parcial: sua reserva é a diferença positiva entre previsão e valor lançado, até que consumida. O fluxo de conversão direta é para uma despesa ainda sem lançamento vinculado. Pagamentos de cartão continuam pela compra/fatura.

O painel e o orçamento mostram:

- **Previsões cadastradas:** soma das previsões das despesas no mês, sem somar novamente a previsão independente do grupo.
- **Ainda reservado:** parcela das previsões que ainda compromete o orçamento; zero para previsão convertida em lançamento real.
- **Lançamentos reais:** despesas registradas, pagas ou pendentes, sem duplicar faturas de cartão.
- **Comprometido:** lançamentos reais + ainda reservado. Os grupos mostram o valor e o percentual da previsão do grupo consumidos.

O saldo previsto passa a descontar o comprometido e os pagamentos pendentes. Mantém a decisão anterior de descontar também os pagamentos pendentes de despesas já lançadas. A reserva não é um pagamento pendente e é descontada uma única vez. O gráfico histórico continua mostrando somente receitas/despesas lançadas. O PDF inclui as previsões e suas reservas; o CSV continua exportando lançamentos reais/faturas.

**Remover previsão do mês** preserva os lançamentos e os outros meses. Para encerrar previsões já criadas além de um novo prazo menor, remova-as nos respectivos meses. Excluir a despesa remove todas as suas previsões e preserva os lançamentos sem vínculo. Excluir o lançamento convertido restaura a reserva original; alterar seu mês ou vínculo também libera a previsão original para nova conversão.

O schema 7 adiciona apenas o vínculo entre a previsão mensal e o lançamento convertido. A atualização de banco existente exige backup integral anterior automático. Testes usam bancos fictícios; nenhuma previsão ou pagamento é criado automaticamente no banco pessoal pela entrega.
