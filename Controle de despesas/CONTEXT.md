# Saldo Familiar

Aplicativo familiar offline que organiza previsões, lançamentos e pagamentos mensais sem confundir consumo do orçamento com movimentação bancária.

## Orçamento

**Grupo de despesas**:
Conjunto permanente de categorias de despesa usado para organizar o orçamento, como Necessidades ou Lazer. Pode ter uma previsão mensal própria.
_Evitar_: Categoria principal, macro categoria

**Despesa planejada**:
Item nomeado dentro de um grupo, com classificação e previsão mensal próprias, como Mercado classificado em Alimentação.
_Evitar_: Categoria, classificação

**Classificação**:
Categoria usada para analisar lançamentos de despesas, compartilhável por várias despesas planejadas.
_Evitar_: Despesa planejada, grupo

**Previsão do grupo**:
Valor mensal definido para o grupo, independente da soma das previsões de suas despesas.
_Evitar_: Total automático do grupo

**Realizado**:
Soma dos lançamentos de despesa que consomem o orçamento no mês selecionado.
_Evitar_: Pago, fatura

**Sem grupo**:
Área que reúne categorias de despesa ainda não associadas a um grupo. Não possui previsão própria.
_Evitar_: Outros

## Investimentos

**Aplicação em CDB**:
Lote de capital aplicado em uma data, com banco emissor, modalidade de rentabilidade, taxa, vencimento e liquidez próprios. Um novo aporte é outra aplicação.
_Evitar_: Despesa, receita

**Capital aplicado**:
Valor original das aplicações em acompanhamento, sem incluir rendimentos.
_Evitar_: Saldo líquido, patrimônio total da família

**Saldo líquido estimado**:
Capital mais rendimento calculado sob premissas, descontados IR e IOF estimados. Não equivale ao saldo do extrato nem garante disponibilidade para resgate.
_Evitar_: Saldo real, rendimento garantido

**Resgate registrado**:
Encerramento do acompanhamento de uma aplicação, com a data e o valor líquido efetivamente recebido informados pelo usuário.
_Evitar_: Ordem de resgate, receita automática

**Premissa de CDI**:
Taxa anual hipotética e constante escolhida para simular o rendimento de CDBs atrelados ao CDI.
_Evitar_: CDI atual, rentabilidade histórica
