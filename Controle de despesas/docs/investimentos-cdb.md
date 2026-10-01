# Investimentos em CDB — versão 0.5.0

## Uso

Abra **Investimentos → Novo CDB**. Informe nome, banco emissor, valor aplicado, modalidade (percentual do CDI ou prefixado), taxa, aplicação, vencimento e liquidez. Objetivo e observações são opcionais. Cada cadastro representa uma aplicação: aportes em datas diferentes devem ser registrados separadamente.

**Premissas** ajusta o CDI hipotético anual usado pela carteira. O valor inicial de 10% é um exemplo, não uma cotação. A taxa é constante inclusive no período passado; os resultados não reproduzem o extrato ou a série histórica do CDI. Prefixados usam a taxa anual cadastrada.

O painel mostra capital aplicado, saldo líquido e ganho líquido estimados, projeção por horizonte, gráfico e tabela mensal, vencimentos próximos e distribuição por emissor. Os cenários com CDI dois pontos percentuais abaixo/acima da premissa recalculam todo o período desde a aplicação. São sensibilidades, não previsões do mercado.

Em **Detalhes**, edite o cadastro ou registre o resgate total com data e valor líquido efetivamente recebido. O investimento resgatado sai das projeções e fica no histórico; é possível desfazer o registro. Isso não solicita uma operação ao banco. Resgates parciais não são suportados nesta versão.

**Explorar um novo plano** abre uma simulação independente da carteira. Defina valor inicial, aporte mensal, prazo de 1 a 120 meses e taxa. Aportes ocorrem ao fim de cada mês, inclusive no último; cada lote tem sua própria idade tributária. A simulação não salva aplicações e supõe que todos os lotes serão liquidados no fim do prazo sob as taxas informadas.

## Modelo financeiro

Escopo: estimativa de CDB para pessoa física residente no Brasil, sem cupons, taxas, carência intermediária, reinvestimento ou marcação a mercado. Valores são nominais, sem desconto de inflação. Liquidez diária significa ausência de carência cadastrada; confira as condições efetivas no contrato. Não há cálculo de cobertura do FGC ou recomendação de investimento.

Datas são tratadas sem horário e o prazo tributário usa dias corridos. O rendimento termina no vencimento; daí em diante o valor líquido permanece constante, como resultado estimado da liquidação naquele dia. Vencimentos passados continuam na carteira até o usuário registrar o crédito efetivo.

Com principal `P` em centavos, prazo corrido `d`, CDI anual `c` em fração e percentual contratado `p` em fração:

```text
d = max(0, min(data de referência, vencimento) - data da aplicação)
du aproximado = d × 252 / 365
taxa diária CDI = ((1 + c)^(1/252) - 1) × p
taxa diária prefixada = (1 + taxa anual)^(1/252) - 1
bruto = arredondar(P × (1 + taxa diária)^du)
rendimento = max(0, bruto - P)
IOF = arredondar(rendimento × percentual IOF)
IR = arredondar((rendimento - IOF) × alíquota IR)
líquido = bruto - IOF - IR
```

A aproximação `d × 252/365` não conta dias úteis reais ou feriados; resultados podem diferir do extrato. CDI variável, calendário e regras de arredondamento do emissor não são reproduzidos. Alíquotas futuras são supostas constantes na simulação.

| Dias corridos | IR sobre rendimento após IOF |
| --- | --- |
| Até 180 | 22,5% |
| 181–360 | 20% |
| 361–720 | 17,5% |
| Acima de 720 | 15% |

IOF dos dias 1 a 30 (% do rendimento): `96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0`. No dia da aplicação o rendimento estimado é zero. No simulador, tributos são calculados por aporte antes da soma.

## Fontes verificadas em 01/10/2026

- [Receita Federal — tabela de tributação de 2026, aplicações de renda fixa](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026).
- [IN RFB 1.585/2015 — art. 46 e base de cálculo após IOF](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta/normas.fazenda.gov.br/sijut2consulta/link.action?idAto=67494&visao=original).
- [Decreto 6.306/2007 — art. 32](https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6306.htm) e [tabela oficial de IOF na Câmara dos Deputados](https://www2.camara.leg.br/legin/fed/decret/2007/decreto-6306-14-dezembro-2007-566561-anexo-pe.pdf).
- [B3 — Manual do Produto CDB, taxa diária e base 252](https://www.b3.com.br/data/files/E9/24/20/40/0D331610D1820216790D8AA8/Manual-do-Produto-Certificado-de-Deposito-Bancario-CDB.pdf).

## Persistência e limites técnicos

Schema 6 adiciona `investments` e `investment_settings` em migração aditiva, com cópia integral anterior obrigatória. Backup/restauração incluem carteira e premissas; backups anteriores são migrados com carteira vazia. Credenciais e tabelas do orçamento são preservadas.

Serviço e cálculo ficam em `desktop/investments.cjs`; acesso autenticado pelo mesmo IPC do aplicativo. Valores monetários persistidos em centavos; entradas validadas no processo principal. Taxas limitadas a 300% do CDI ou 50% a.a., CDI até 50%, vencimento até 20 anos. Operações não criam lançamentos no orçamento; relatórios CSV/PDF existentes continuam sendo de orçamento.

Testes cobrem referências numéricas, juros diários, limites IR/IOF, aportes independentes, maturidade, autorização, validação, edição, resgate/reabertura, exclusão, backup/restauração e migração v5→v6. O smoke test percorre os formulários e verifica o layout em 1000 e 1360 pixels, somente em banco fictício.
