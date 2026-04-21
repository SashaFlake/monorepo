plugins {
    kotlin("jvm")
    id("io.ktor.plugin") version "3.1.2"
    id("org.jlleitschuh.gradle.ktlint")
    id("org.jetbrains.kotlinx.kover")
}

application {
    mainClass.set("com.sashaflake.ApplicationKt")
}

dependencies {
    val ktorVersion: String by project
    val koinVersion: String by project
    val coroutinesVersion: String by project

    implementation(project(":domain"))

    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging:$ktorVersion")
    implementation("io.ktor:ktor-server-metrics-micrometer:$ktorVersion")
    implementation("io.micrometer:micrometer-registry-prometheus:${project.properties["prometheusVersion"]}")
    implementation("ch.qos.logback:logback-classic:${project.properties["logbackVersion"]}")
    implementation("io.insert-koin:koin-ktor:$koinVersion")
    implementation("io.insert-koin:koin-logger-slf4j:$koinVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion")

    testImplementation("io.ktor:ktor-server-test-host-jvm:$ktorVersion")
    testImplementation("io.ktor:ktor-client-content-negotiation-jvm:$ktorVersion")
    testImplementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    testImplementation(kotlin("test"))
    testImplementation("io.kotest:kotest-runner-junit5:${project.properties["kotestVersion"]}")
    testImplementation("io.kotest:kotest-assertions-core:${project.properties["kotestVersion"]}")
    testImplementation("io.mockk:mockk:${project.properties["mockkVersion"]}")
}
