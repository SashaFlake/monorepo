rootProject.name = "circuit-breaker-service"

pluginManagement {
    val kotlinVersion: String by settings
    plugins {
        kotlin("jvm") version kotlinVersion apply false
        kotlin("multiplatform") version kotlinVersion apply false
        id("org.jlleitschuh.gradle.ktlint") version "12.1.2" apply false
        id("org.jetbrains.kotlinx.kover") version "0.9.1" apply false
    }
    repositories {
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}

include(":domain")
include(":server")
