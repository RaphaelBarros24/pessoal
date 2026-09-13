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
