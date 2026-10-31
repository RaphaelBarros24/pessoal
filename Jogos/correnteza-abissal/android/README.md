# Correnteza Abissal — app Android

Casca nativa mínima (uma `WebView` em tela cheia) que empacota o jogo de `../index.html` dentro do APK.

| Item | Valor |
|---|---|
| Pacote | `io.github.raphaelbarros24.correnteza` |
| Android | 7.0+ (minSdk 24), alvo Android 14 (targetSdk 34) |
| Permissões | Nenhuma (nem internet) |
| Dados | Só progresso local do jogo, guardado no aparelho |
| Tamanho | ~650 KB |

## Como o APK é gerado
O workflow `.github/workflows/correnteza-apk.yml` roda a cada push que altera `Jogos/correnteza-abissal/**` (ou manualmente em *Actions → APK Correnteza Abissal → Run workflow*):

1. A tarefa `prepareWebAssets` copia `index.html` para os assets, **remove o bloco PWA** e **embute as fontes** (`app/web-fonts/fonts.css`), para o app funcionar 100% offline.
2. `./gradlew assembleRelease` compila e assina.
3. `apksigner verify` confere a assinatura; o APK sai como **artefato** e num **Release** (`correnteza-v1.0.N`).

O número da versão (`versionCode`) é o número da execução do workflow, então cada build novo é uma atualização válida.

## Assinatura (importante)
A chave **não fica no repositório** (ele é público). Cadastre em *Settings → Secrets and variables → Actions*:

| Segredo | Conteúdo |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Arquivo `.jks` em base64 (`base64 -w0 correnteza-release.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Senha do keystore |
| `ANDROID_KEY_ALIAS` | `correnteza` |
| `ANDROID_KEY_PASSWORD` | Senha da chave |

Sem esses segredos, o build usa a chave de depuração temporária do servidor: o APK instala, mas cada build terá uma assinatura diferente e **atualizar exigirá desinstalar** (perdendo o progresso). Com os segredos, todas as versões instalam por cima.

Guarde o `.jks` e as senhas num cofre de senhas. Perder a chave = não conseguir mais atualizar o app instalado.

## Compilar localmente (opcional)
Requer Android SDK (Android Studio ou `cmdline-tools`) e JDK 17:
```bash
cd Jogos/correnteza-abissal/android
./gradlew assembleRelease     # sem segredos: assinatura de depuração
# APK: app/build/outputs/apk/release/app-release.apk
```

## Instalar no celular
1. Abra o Release mais recente no GitHub pelo celular e baixe o `.apk`.
2. Toque no arquivo baixado. Na primeira vez, o Android pede para **permitir instalar apps desta fonte** (navegador ou Arquivos).
3. Toque em **Instalar**. Se o Play Protect avisar "app desconhecido", toque em **Mais detalhes → Instalar assim mesmo** (é esperado para apps fora da Play Store).

## Comportamento no app
- Tela cheia (barras do sistema escondidas; deslize da borda para mostrá-las).
- Tela não apaga durante o jogo.
- **Voltar**: pausa a partida / retoma / volta ao menu; no menu, fecha o app.
- Ao sair do app (botão Home, ligação), a partida pausa sozinha.

## Licenças de terceiros
Fontes Figtree e Unbounded — SIL Open Font License 1.1 (embutidas em `app/web-fonts/fonts.css`).
