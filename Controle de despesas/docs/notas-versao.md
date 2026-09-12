# Saldo Familiar 0.1.0

Primeira versão do aplicativo de controle financeiro familiar offline para Windows 10 e 11 de 64 bits.

## Incluído

- Login individual por familiar e orçamento compartilhado.
- Recuperação de senha por código individual de uso único.
- Receitas, despesas, categorias, edição e exclusão.
- Dashboard mensal, histórico de seis meses e análise por categoria.
- Limites mensais e sugestões por regras locais.
- Exportação CSV e PDF.
- Backup automático diário, backup manual e restauração validada.
- Instalador completo, com SQLite e runtime incluídos.

## Instalação

Baixe e execute `Saldo-Familiar-0.1.0-Windows-x64.exe`. Não exige um ambiente de desenvolvimento nem conexão para usar o aplicativo.

O instalador não possui assinatura digital comercial. O banco é local por conta do Windows e não é criptografado. Não há sincronização entre máquinas.

Os logins familiares compartilham o mesmo banco dentro da mesma conta do Windows. Cartões, parcelamento automático, recorrências e importação ficam fora desta versão.

## Verificação

Testes das operações públicas e da interface passaram. Instalador validado nesta máquina Windows 11 com instalação, execução dos fluxos do aplicativo instalado e desinstalação. Dashboard e PDF conferidos visualmente. Windows 10 ainda não foi testado diretamente.

O anexo `SHA256SUMS.txt` contém o hash SHA-256 do instalador.
