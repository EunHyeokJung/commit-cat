plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "2.0.21"
    id("org.jetbrains.intellij.platform") version "2.11.0"
}

group = "com.commitcat"
version = "0.1.0"

kotlin {
    jvmToolchain(17)
}

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        intellijIdeaCommunity("2024.1")
        pluginVerifier()
        zipSigner()
        instrumentationTools()
    }
}

intellijPlatform {
    pluginConfiguration {
        id = "com.commitcat.plugin"
        name = "CommitCat"
        version = project.version.toString()
        description = "Connect your JetBrains IDE to the CommitCat desktop pet. " +
            "Tracks coding time, file changes, saves, and builds."
        vendor {
            name = "CommitCat"
            url = "https://github.com/eunseo9311/commit-cat"
        }
        ideaVersion {
            sinceBuild = "241"
            untilBuild = "263.*"
        }
    }
}

tasks {
    wrapper {
        gradleVersion = "8.13"
    }
}
