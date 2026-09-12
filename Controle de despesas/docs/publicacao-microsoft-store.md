# Publicação do Saldo Familiar na Microsoft Store

## Decisão

O titular escolheu distribuição pela Microsoft Store, com pacote MSIX e assinatura da loja, em lugar da compra de certificado. A assinatura da Store vale para o pacote distribuído por ela; não assina automaticamente o instalador EXE do GitHub.

## Cadastro pelo titular

1. Acesse https://storedeveloper.microsoft.com e entre com sua conta Microsoft.
2. Escolha o cadastro de desenvolvedor individual gratuito e conclua a validação solicitada pela Microsoft.
3. No Partner Center, crie um aplicativo e reserve “Saldo Familiar”, se disponível. Use a opção de pacote MSIX/AppX, não a submissão do instalador EXE.
4. Em identidade do produto, copie os valores exatos de `Package/Identity/Name`, `Package/Identity/Publisher` e `Package/Properties/PublisherDisplayName` para configurar o pacote. Esses identificadores não são senhas. Não envie credenciais ou documentos de identidade pelo projeto.
5. Defina o contato público de suporte e a disponibilidade/preço do aplicativo antes de finalizar a página da loja.

## Trabalho técnico pendente

- Associar os identificadores oficiais ao pacote. O electron-builder instalado (26.15.3) possui alvo AppX, mas não MSIX nativo; escolher e validar a ferramenta MSIX sem alterar às cegas as dependências da versão publicada.
- Gerar ícones e imagens da loja a partir da identidade visual do aplicativo.
- Conferir a localização do banco e o redirecionamento de arquivos no ambiente empacotado. Não presumir que o pacote Store abre automaticamente o banco da instalação NSIS.
- Testar migração por backup/exportação e restauração com dados fictícios, preservando a instalação e o banco originais. Orientar usuários a exportar backup antes de mudar para a Store.
- Testar instalação, login, parcelas, cartões, faturas, CSV/PDF, backup, restauração e atualização do pacote. Avaliar o comportamento na desinstalação separadamente do NSIS.
- Preparar política de privacidade com URL pública, contato de suporte, classificação etária e notas para certificação. Revisar esses textos com o titular antes de publicar.
- Submeter o pacote e aguardar certificação. Não apresentar a aplicação como aprovada antes da confirmação da Microsoft.

## Rascunho da página da loja

Nome pretendido: Saldo Familiar.

Descrição curta: Organize receitas, despesas, parcelas e cartões no orçamento da sua família, com uso offline.

Descrição: Acompanhe o orçamento familiar por mês, cadastre receitas e despesas, distribua compras em parcelas e consulte faturas de cartão calculadas por fechamento e vencimento. Cada familiar tem seu login e pode editar o orçamento compartilhado na mesma conta do Windows. Veja limites por categoria, histórico e sugestões locais. Exporte relatórios CSV/PDF e mantenha backups do banco local. Não exige servidor ou assinatura de serviço para funcionar. Não sincroniza entre máquinas.

Privacidade a declarar: dados financeiros e contas de acesso ficam localmente; o aplicativo não envia esses dados a serviços de IA ou servidores próprios. Banco e backups não são criptografados. O texto final deve distinguir eventuais dados coletados pela Microsoft Store dos dados tratados pelo aplicativo.

## Referências verificadas

- Cadastro individual gratuito: https://learn.microsoft.com/pt-br/windows/apps/publish/whats-new-individual-developer
- Requisitos do pacote e identidade: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements
- Upload de pacotes: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/upload-app-packages
- Electron/MSIX: https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/electron-packaging
- SmartScreen e assinatura da Store: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation

Estado: roteiro e descrição preparados; nenhuma conta criada, nenhum pacote Store gerado e nenhuma submissão realizada nesta sessão.
