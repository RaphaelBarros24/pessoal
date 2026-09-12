# Saldo Familiar

Controle financeiro familiar offline para Windows 10 e 11 de 64 bits, com SQLite e runtime incluídos. Cada familiar tem seu login e todos podem editar o orçamento.

## Instalar ou atualizar

Baixe `Saldo-Familiar-0.2.0-Windows-x64.exe` na [página da versão](https://github.com/RaphaelBarros24/pessoal/releases/tag/v0.2.0). Não exige Node.js, Python ou servidor externo.

Para atualizar, feche o aplicativo e execute o instalador na mesma conta do Windows. Não é necessário desinstalar. A identificação e o caminho do banco permanecem iguais. Antes da migração aditiva, o aplicativo cria uma cópia integral em `backups/antes-atualizacao-v1-*.sqlite`. Usuários, senhas, lançamentos, pagamentos, notas, categorias e limites são preservados. Backups 0.1.0 continuam aceitos.

Na primeira instalação, crie um usuário e guarde o código de recuperação exibido uma única vez. Em **Família e backup**, cadastre os demais familiares. Cadastre receitas/despesas e limites mensais por categoria.

## Recursos

- Login offline com hash scrypt e recuperação individual de uso único.
- Receitas, despesas, edição, exclusão, categorias, vencimento, pagamento e observações.
- Parcelas automáticas e meios de pagamento com acumulados mensais.
- Cartões com fechamento/vencimento, faturas e registro de pagamento.
- Dashboard, histórico de seis meses, filtros, limites e sugestões por regras locais.
- Relatórios CSV/PDF, backup manual, restauração validada e backup diário atualizado a cada alteração, com retenção de 30 cópias diárias.

## Parcelas e cartões

Informe o **valor total** e o número de parcelas (até 120). A divisão é em centavos, com diferenças nas primeiras parcelas. Dias inexistentes são ajustados ao último dia do mês, mantendo o dia original nos seguintes.

Escolha Pix, dinheiro, débito, crédito, transferência, boleto ou outro. Lançamentos antigos ficam como **Não informado** até serem editados. Lançamentos comuns entram no orçamento pelo vencimento, independentemente do mês de pagamento.

Cadastre o cartão por nome, fechamento e vencimento. Compras **no dia do fechamento** entram no ciclo seguinte. Fechamento 25 e vencimento 5: compra em 24/09 vence em 05/10; compra em 25/09 vence em 05/11.

Uma compra de R$ 300 em três parcelas em 24/09 consome R$ 100 dos orçamentos de setembro, outubro e novembro. Nesse exemplo, as faturas vencem em outubro, novembro e dezembro. A fatura aparece como pagamento previsto, sem duplicar a despesa do orçamento. O saldo previsto representa receitas menos despesas cadastradas, não o saldo bancário.

Consulte as compras da fatura e marque-a como paga. Editar/excluir uma parcela altera somente ela; excluir a série remove todas as parcelas ainda cadastradas daquela compra. Para mudar a quantidade, exclua a série e cadastre novamente. Alterações de fechamento/vencimento do cartão afetam novas compras; vencimentos existentes são preservados.

No CSV, some **Despesa contabilizada (R$)** para evitar duplicação de faturas. **Fatura prevista (R$)** separa pagamentos do cartão. Recorrências, importação de extratos e comprovantes ainda não estão incluídos.

## Dados e backup

O banco fica em `%APPDATA%\Saldo Familiar\family.sqlite`, e as cópias em `backups`. Familiares compartilham dados dentro da mesma conta do Windows; contas distintas do Windows têm bancos separados. Não há sincronização entre máquinas.

Banco e backups não são criptografados; o login protege o acesso pelo aplicativo. Copie periodicamente um backup para outro dispositivo. Restaurar substitui dados e contas pelo backup, preserva uma cópia anterior e exige novo login. A desinstalação preserva o banco. O instalador não possui assinatura digital comercial. Dados reais e usuários de demonstração não acompanham a distribuição.

## Desenvolvimento e verificação

Requer Node.js 24 e npm no desenvolvimento:

```powershell
npm ci
node node_modules/electron/install.js
npm start
npm test
npm run test:ui
npm run dist
```

O comando de instalação do Electron garante o runtime quando scripts automáticos das dependências estão bloqueados. Instalador em `release/`; testes fictícios em `.local-data/`, fora do Git.

Teste de atualização pelas telas:

```powershell
node tests/prepare-upgrade.cjs
node desktop/launch.cjs --smoke-test --upgrade-test
```

Na 0.2.0, sete testes das operações públicas passaram, incluindo migração, parcelas, centavos, fechamento e faturas sem duplicação. Testes das telas passaram pelo runtime de desenvolvimento, incluindo banco antigo fictício. Dashboard, formulário e PDF conferidos visualmente. A política de Controle de Aplicativo desta máquina bloqueou o novo binário empacotado; sua execução e a instalação 0.2.0 permanecem pendentes de validação em outro Windows. Windows 10 ainda não foi testado diretamente. Na 0.1.0, instalação, uso e desinstalação foram validados no Windows 11.

O `SHA256SUMS.txt` anexado permite verificar o instalador.

## Estrutura

- `desktop/store.cjs`: acesso, SQLite, lançamentos, cartões, orçamento e backups.
- `desktop/main.cjs`: janela, mensagens, diálogos e exportação.
- `desktop/reports.cjs`: CSV e HTML para PDF.
- `desktop/preload.cjs`: interface limitada entre telas e operações.
- `ui/`: telas, estilos e gráficos.
- `tests/`: operações públicas e banco fictício antigo.
- `docs/requisitos.md`: decisões confirmadas.
- `docs/agents/`: configuração das skills de Matt Pocock.

Referências de produto: [Expensify](https://www.expensify.com/) e [Brex](https://www.brex.com/product/expense-management), adaptadas ao uso familiar offline.
