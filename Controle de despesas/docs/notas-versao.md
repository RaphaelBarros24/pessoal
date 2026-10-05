# Saldo Familiar 0.6.1

- Cartão de crédito disponível na conversão de previsão, com seleção do cartão e data da compra.
- A compra realiza a previsão e entra na fatura com vencimento calculado automaticamente. O pagamento é registrado pela fatura, sem duplicar o gasto no orçamento.
- Formulário alterna entre pagamento à vista e compra no cartão. Mantido o schema 7.

Instalador: `Saldo-Familiar-0.6.1-Windows-x64.exe`.

# Saldo Familiar 0.6.0

- Realização de previsão em despesa paga pelo próprio orçamento, com vínculo automático e valor efetivamente pago.
- Previsões mensais recorrentes até um mês final, por até 120 meses, e remoção da previsão de um mês sem excluir os lançamentos.
- Visão do previsto, realizado, reservado e comprometido no painel, orçamento e PDF. Percentual consumido por grupo e saldo considerando reservas.
- Schema 7 com backup integral anterior automático. A conversão libera somente a reserva do mês escolhido e impede criar outro lançamento para previsão já vinculada.

Instalador: `Saldo-Familiar-0.6.0-Windows-x64.exe`. Guia: [Previsões recorrentes](previsoes-recorrentes.md).

# Saldo Familiar 0.5.0

- Nova tela **Investimentos**, com carteira de CDBs prefixados ou atrelados ao CDI, objetivos, liquidez e vencimento.
- Projeções brutas/líquidas, gráfico e tabela mensal, cenários de CDI, distribuição por emissor e radar de vencimentos.
- Simulador de valor inicial e aportes mensais, com juros compostos e IR/IOF calculados por aplicação.
- Cadastro, edição, exclusão e registro/reabertura de resgate total pelo valor líquido recebido.
- CDI manual: 10% a.a. é somente um exemplo inicial editável. Os saldos são estimados, sem cotação online nem série histórica.
- Schema 6 com backup integral antes da migração e preservação do orçamento existente.

Instalador: `Saldo-Familiar-0.5.0-Windows-x64.exe`. Guia e premissas: [Investimentos em CDB](investimentos-cdb.md).

# Saldo Familiar 0.4.3

- Corrigida a abertura do banco após excluir uma despesa planejada que possuía previsões mensais.
- As chaves estrangeiras do SQLite permanecem ativas também depois de persistências e backups, evitando previsões órfãs.
- O banco local afetado foi reparado após backup integral verificado; somente cinco previsões ligadas a despesas já excluídas foram removidas.
- Teste regressivo cobre a exclusão após reabrir o aplicativo e confirma que o banco continua válido.

Feche o aplicativo e execute `Saldo-Familiar-0.4.3-Windows-x64.exe` na mesma conta do Windows. Não há migração de schema.

# Saldo Familiar 0.4.2

- Adicionada recuperação administrativa local para usuários sem senha e sem código de recuperação.
- O administrador seleciona o acesso, confirma exatamente o nome de usuário e define uma nova senha.
- Antes da redefinição, o aplicativo cria um backup integral; senha e código anteriores são invalidados e um novo código é emitido.
- A recuperação depende do controle da conta do Windows e do banco local, que continua sem criptografia.

Instale `Saldo-Familiar-0.4.2-Windows-x64.exe` no computador que contém o banco a recuperar. Na tela de login, escolha **Recuperação administrativa local**.

# Saldo Familiar 0.4.1

- Corrigido o modelo do orçamento para três níveis: grupo, despesa planejada e classificação.
- Um grupo pode conter várias despesas, inclusive várias com a mesma classificação, cada uma com previsão própria.
- Os lançamentos agora podem indicar a despesa planejada; o realizado é atribuído ao item correto do grupo.
- A migração para o schema 5 converte previsões e associações criadas na versão 0.4.0 sem apagar grupos ou lançamentos.

Feche o aplicativo e execute `Saldo-Familiar-0.4.1-Windows-x64.exe` na mesma conta do Windows. O banco existente será preservado e migrado automaticamente.

# Saldo Familiar 0.4.0

- O orçamento agora permite criar grupos de despesas, como Necessidades, Lazer e Educação.
- Cada grupo e cada despesa podem ter previsões mensais independentes.
- A tela compara previsão, realizado e saldo nos dois níveis e mantém categorias ainda não organizadas em “Sem grupo”.
- Excluir um grupo preserva categorias, lançamentos e previsões das despesas; somente a previsão do grupo é removida.
- A migração para o schema 4 cria uma cópia integral do banco antes da atualização.

Feche o aplicativo e execute `Saldo-Familiar-0.4.0-Windows-x64.exe` na mesma conta do Windows. O banco existente será preservado e migrado automaticamente.

# Saldo Familiar 0.3.2

- O saldo previsto agora considera receitas previstas menos despesas previstas menos despesas a pagar.
- A descrição da métrica e o relatório PDF exibem a mesma regra usada pelo backend.
- Teste regressivo, suíte completa e teste da interface validam a nova fórmula.

Feche o aplicativo e execute `Saldo-Familiar-0.3.2-Windows-x64.exe` na mesma conta do Windows. O banco permanece no mesmo caminho e não exige migração.

# Saldo Familiar 0.3.1

- Reimportação de faturas atualizadas preserva lançamentos existentes e inclui somente compras novas, mesmo quando o Itaú altera descrições ou o identificador mascarado entre exportações.
- Créditos e estornos deixam de bloquear o arquivo inteiro: são ignorados com quantidade e total informados na prévia e no resultado.
- O botão e as mensagens agora deixam explícito que a operação atualiza a fatura e mantém classificações, observações e pagamentos existentes.
- Doze testes automatizados e o teste completo da interface passaram.

Feche o aplicativo e execute `Saldo-Familiar-0.3.1-Windows-x64.exe` na mesma conta do Windows. O banco permanece no mesmo caminho; a atualização não exige migração de schema. Nesta máquina, a política de Controle de Aplicativo bloqueou o instalador 0.3.1 antes da execução; a versão instalada permaneceu 0.3.0 e a instalação deve ser repetida em ambiente que permita o executável, sem desativar proteções.

# Saldo Familiar 0.3.0

- Importação local de fatura Itaú Excel (.xlsx), com seleção de cartão e conferência do total e vencimento.
- Lançamentos individuais por linha, sem gerar parcelas futuras ou contar pagamentos como despesas.
- Prevenção de duplicados em reimportações e comparação com compras cadastradas manualmente.
- Classificação por histórico e regras conservadoras; tela de pendências de todos os meses.
- Pendências incluídas no orçamento como “A classificar”.
- Migração aditiva para schema 3, com cópia integral anterior e preservação de dados.
- Onze testes automatizados passaram, além do fluxo de importação/classificação nas telas com dados fictícios.

Instruções e limitações: [Importação Itaú](importacao-itau.md). Feche o aplicativo e execute `Saldo-Familiar-0.3.0-Windows-x64.exe` na mesma conta do Windows para atualizar. O binário empacotado 0.3.0 passou no teste completo das telas com banco fictício nesta máquina. A instalação por cima da versão existente e a validação em Windows 10 permanecem pendentes; o EXE não possui assinatura comercial ou da Microsoft Store.

# Saldo Familiar 0.2.0

Atualização do aplicativo familiar offline para Windows 10 e 11 de 64 bits.

## Novidades

- Parcelas mensais automáticas a partir do valor total, com divisão exata em centavos.
- Meios de pagamento e acumulados: Pix, dinheiro, débito, crédito, transferência, boleto e outros.
- Cartões com fechamento e vencimento. Compras no dia do fechamento entram no ciclo seguinte.
- Faturas acumuladas, detalhamento, registro de pagamento e previsão do mês seguinte.
- Cada parcela consome seu orçamento mensal; a fatura não duplica a despesa.
- Edição/exclusão individual de parcelas e exclusão da série.
- CSV e PDF distinguem orçamento e faturas previstas.

## Atualizar

Feche o aplicativo e execute `Saldo-Familiar-0.2.0-Windows-x64.exe` na mesma conta do Windows. Não é necessário desinstalar ou instalar dependências.

O banco permanece em `%APPDATA%\Saldo Familiar\family.sqlite`. Antes da migração aditiva, é salva uma cópia integral em `backups/antes-atualizacao-v1-*.sqlite`. Usuários, senhas, lançamentos, pagamentos, notas, categorias e limites são preservados. Backups antigos continuam aceitos. Meios de pagamento antigos ficam como “Não informado”.

## Verificação

Sete testes das operações públicas passaram, incluindo migração preservando dados e login, parcelas em meses curtos, centavos, fechamento, faturas sem duplicação e rejeição de banco futuro sem alteração.

Testes das telas passaram pelo runtime de desenvolvimento com dados fictícios, incluindo banco no formato 0.1.0. Dashboard, formulário e PDF conferidos visualmente. O instalador foi gerado, mas a política de Controle de Aplicativo desta máquina bloqueou o novo binário empacotado. Sua execução e a instalação 0.2.0 permanecem pendentes de validação em outro Windows. Windows 10 ainda não foi testado diretamente.

O instalador não possui assinatura digital comercial. Banco e backups são locais por conta do Windows e não criptografados. O anexo `SHA256SUMS.txt` permite verificar a integridade do instalador.
