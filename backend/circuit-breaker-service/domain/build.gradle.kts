plugins {
    kotlin("multiplatform")
    id("org.jlleitschuh.gradle.ktlint")
    id("org.jetbrains.kotlinx.kover")
}

kotlin {
    jvm()

    sourceSets {
        commonMain {
            dependencies {}
        }
        commonTest {
            dependencies {
                implementation(kotlin("test"))
                implementation("io.kotest:kotest-runner-junit5:${project.properties["kotestVersion"]}")
                implementation("io.kotest:kotest-assertions-core:${project.properties["kotestVersion"]}")
            }
        }
    }
}
