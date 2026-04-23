// domain-модуль: чистая бизнес-логика, нет зависимостей на фреймворки
plugins {
    kotlin("multiplatform")
    id("org.jlleitschuh.gradle.ktlint")
    id("org.jetbrains.kotlinx.kover")
}

kotlin {
    jvm()
    sourceSets {
        val commonMain by getting {
            dependencies {
                val arrowVersion: String by project
                implementation("io.arrow-kt:arrow-core:$arrowVersion")
            }
        }
        val commonTest by getting {
            dependencies {
                val kotestVersion: String by project
                val mockkVersion: String by project
                implementation("io.kotest:kotest-runner-junit5:$kotestVersion")
                implementation("io.kotest:kotest-assertions-core:$kotestVersion")
                implementation("io.mockk:mockk:$mockkVersion")
            }
        }
    }
}
