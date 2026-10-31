import java.util.Base64

plugins {
    id("com.android.application")
}

/**
 * Copia o jogo web (../../index.html) para os assets do app:
 * - remove o bloco PWA (service worker e manifest não se aplicam no app);
 * - troca o link do Google Fonts pelas fontes embutidas (funciona offline).
 */
abstract class PrepareWebAssets : DefaultTask() {
    @get:InputFile
    abstract val html: RegularFileProperty

    @get:InputFile
    abstract val fontsCss: RegularFileProperty

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @TaskAction
    fun run() {
        val out = outputDir.get().asFile
        out.deleteRecursively()
        out.mkdirs()
        var page = html.get().asFile.readText()
        page = page.replace(Regex("<!--PWA-->[\\s\\S]*?<!--/PWA-->\\n?"), "")
        page = page.replace(Regex("<link rel=\"preconnect\"[^>]*>\\n?"), "")
        val fontLink = Regex("<link rel=\"stylesheet\" href=\"https://fonts\\.googleapis\\.com[^\"]*\">")
        check(fontLink.containsMatchIn(page)) { "Link do Google Fonts não encontrado em index.html" }
        page = page.replace(fontLink, "<style>\n" + fontsCss.get().asFile.readText() + "</style>")
        check(!page.contains("serviceWorker")) { "Bloco PWA não foi removido" }
        out.resolve("index.html").writeText(page)
    }
}

val prepareWebAssets = tasks.register<PrepareWebAssets>("prepareWebAssets") {
    html.set(layout.projectDirectory.file("../../index.html"))
    fontsCss.set(layout.projectDirectory.file("web-fonts/fonts.css"))
    outputDir.set(layout.buildDirectory.dir("generated/web-assets"))
}

// Número da versão: vem do GitHub Actions (cada build é maior que o anterior).
val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

// Assinatura: chave fornecida pelos segredos do repositório (nunca versionada).
val keystoreB64: String? = System.getenv("ANDROID_KEYSTORE_BASE64")?.takeIf { it.isNotBlank() }
val keystoreFile = layout.buildDirectory.file("signing/release.jks").get().asFile
if (keystoreB64 != null) {
    keystoreFile.parentFile.mkdirs()
    keystoreFile.writeBytes(Base64.getMimeDecoder().decode(keystoreB64))
}

android {
    namespace = "io.github.raphaelbarros24.correnteza"
    compileSdk = 34

    defaultConfig {
        applicationId = "io.github.raphaelbarros24.correnteza"
        minSdk = 24
        targetSdk = 34
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    signingConfigs {
        if (keystoreB64 != null) {
            create("release") {
                storeFile = keystoreFile
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Sem segredos configurados, assina com a chave de depuração do servidor
            // (instala normalmente, mas atualizações futuras exigem reinstalar).
            signingConfig = if (keystoreB64 != null) signingConfigs.getByName("release")
                            else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(prepareWebAssets, PrepareWebAssets::outputDir)
    }
}
