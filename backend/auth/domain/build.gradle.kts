plugins {
    kotlin("multiplatform")
    id("org.jlleitschuh.gradle.ktlint")
    id("org.jetbrains.kotlinx.kover")
}

kotlin {
    jvm()

    sourceSets {
        commonMain {
            dependencies {
                val arrowVersion: String by project
                implementation("io.arrow-kt:arrow-core:$arrowVersion")
            }
        }
        commonTest {
            dependencies {
                val kotestVersion: String by project
                val mockkVersion: String by project

                implementation(kotlin("test"))
                implementation("io.kotest:kotest-runner-junit5:$kotestVersion")
                implementation("io.kotest:kotest-assertions-core:$kotestVersion")
                implementation("io.kotest:kotest-property:$kotestVersion")
                implementation("io.mockk:mockk:$mockkVersion")
            }
        }
    }
}
