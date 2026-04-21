plugins {
    kotlin("jvm") version extra["kotlinVersion"].toString() apply false
    id("org.jlleitschuh.gradle.ktlint") version "12.1.2" apply false
    id("org.jetbrains.kotlinx.kover") version "0.9.1" apply false
}
