# Saldo Familiar

Aplicativo de controle financeiro familiar para **Windows 10 e 11 de 64 bits**, com banco SQLite próprio e funcionamento offline. Cada familiar possui seu login no aplicativo e todos podem editar o mesmo orçamento.

## Instalar e começar

1. Baixe `Saldo-Familiar-0.1.0-Windows-x64.exe` na [página de versões](https://github.com/RaphaelBarros24/pessoal/releases).
2. Execute o instalador e escolha a pasta de instalação. Não é necessário instalar Node.js, Python ou um servidor de banco de dados.
3. Abra **Saldo Familiar**, crie o primeiro usuário e guarde o código de recuperação exibido uma única vez.
4. Em **Família e backup**, cadastre os outros familiares. Cada novo usuário também recebe um código individual de recuperação.
5. Cadastre receitas e despesas, defina limites de orçamento e acompanhe o dashboard.

O instalador desta versão não possui assinatura digital comercial. O Windows pode pedir confirmação do editor ao executá-lo.

## Recursos da primeira versão

- Login offline, senhas armazenadas com hash scrypt e recuperação por código individual de uso único.
- Receitas e despesas com cadastro, edição, exclusão, categoria, vencimento, pagamento e observações.
- Orçamento compartilhado com limites mensais por categoria e sugestões baseadas em regras locais.
- Dashboard com receitas, despesas, saldo previsto, despesas pendentes, histórico de seis meses e distribuição por categoria.
- Pesquisa e filtros de lançamentos; criação de categorias de receitas e despesas.
- Relatórios mensais em CSV, compatível com planilhas, e PDF para impressão.
- Backup manual, restauração com validação do arquivo e backup automático local por dia, atualizado a cada alteração, com retenção de 30 cópias diárias.

Os valores estão em reais. O mês de contabilização é o **mês do vencimento**, mesmo quando o pagamento ocorre em outro mês. O saldo previsto representa receitas menos despesas cadastradas, não o saldo de uma conta bancária.

Cartões, geração automática de parcelas, recorrências, importação de extratos e comprovantes ficam fora desta primeira versão. É possível lançar cada parcela manualmente no seu vencimento.

## Dados, acesso e backup

O banco fica em `%APPDATA%\Saldo Familiar\family.sqlite`. As cópias automáticas ficam na subpasta `backups`. A instalação é por usuário do Windows: os logins familiares compartilham o banco dentro dessa mesma conta do Windows. Contas diferentes do Windows possuem bancos separados.

O aplicativo funciona sem internet e não sincroniza entre máquinas. Banco e backups **não são criptografados**; o login protege o acesso pelo aplicativo. Guarde os códigos de recuperação e os backups em local seguro. Copie periodicamente um backup para outro dispositivo.

Ao restaurar, o orçamento e as contas de acesso atuais são substituídos pelos dados do backup. Uma cópia adicional do banco anterior é preservada antes da restauração. Faça login novamente com uma conta existente no backup.

A desinstalação preserva o banco. O instalador e o código-fonte não incluem dados reais nem usuários de demonstração.

## Desenvolvimento

Requer Node.js 24 e npm na máquina de desenvolvimento.

```powershell
npm ci
node node_modules/electron/install.js
npm start
```

O segundo comando garante a instalação do runtime Electron quando o ambiente bloqueia scripts automáticos das dependências.

```powershell
npm test
npm run test:ui
npm run dist
```

O instalador completo é gerado em `release/`. O teste da interface usa exclusivamente dados fictícios em `.local-data/`, exercita cadastro e lançamentos pelas telas, navegação, exportação CSV/PDF e backup. Esses arquivos ficam fora do Git.

### Verificação da versão 0.1.0

Testes das operações e da interface passaram. A versão empacotada e o instalador foram executados nesta máquina Windows 11, incluindo instalação, uso do aplicativo instalado, exportação de relatórios e desinstalação. O dashboard e o PDF exportado foram conferidos visualmente. Windows 10 é a compatibilidade prevista e ainda não foi testado diretamente.

O arquivo `SHA256SUMS.txt` anexado à versão permite verificar a integridade do instalador baixado.

## Estrutura

- `desktop/store.cjs`: operações de acesso, SQLite, lançamentos, orçamento e backups.
- `desktop/main.cjs`: janela do aplicativo, validação de mensagens, diálogos e exportação de relatórios.
- `desktop/preload.cjs`: interface limitada entre as telas e as operações do aplicativo.
- `ui/`: interface local, estilos e gráficos.
- `tests/`: testes das operações públicas.
- `docs/requisitos.md`: decisões confirmadas com o usuário.
- `docs/agents/`: configuração das skills de Matt Pocock.

Referências de produto: [Expensify](https://www.expensify.com/) e [Brex](https://www.brex.com/product/expense-management), adaptadas ao controle familiar offline.
