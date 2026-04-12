plugins {
    kotlin("jvm")
    id("io.ktor.plugin") version "3.1.2"
    id("org.jlleitschuh.gradle.ktlint")
    id("org.jetbrains.kotlinx.kover")
}

application {
    // Замени __SERVICE__ на имя сервиса
    mainClass.set("com.sashaflake.ApplicationKt")
}

dependencies {
    val ktorVersion: String by project
    val koinVersion: String by project
    val graphqlKotlinVersion: String by project
    val lettuceVersion: String by project

    implementation(project(":domain"))

    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-auth:$ktorVersion")
    implementation("io.ktor:ktor-server-auth-jwt:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging:$ktorVersion")
    implementation("io.ktor:ktor-server-metrics-micrometer:$ktorVersion")
    implementation("io.micrometer:micrometer-registry-prometheus:${project.properties["prometheusVersion"]}")
    implementation("ch.qos.logback:logback-classic:${project.properties["logbackVersion"]}")
    implementation("io.insert-koin:koin-ktor:$koinVersion")
    implementation("io.insert-koin:koin-logger-slf4j:$koinVersion")
    implementation("com.expediagroup:graphql-kotlin-ktor-server:$graphqlKotlinVersion")
    implementation("io.lettuce:lettuce-core:$lettuceVersion")
    implementation("com.auth0:java-jwt:4.4.0")

    testImplementation("io.ktor:ktor-server-test-host-jvm:$ktorVersion")
    testImplementation("io.ktor:ktor-client-content-negotiation-jvm:$ktorVersion")
    testImplementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    testImplementation(kotlin("test"))
    testImplementation("io.kotest:kotest-runner-junit5:${project.properties["kotestVersion"]}")
    testImplementation("io.kotest:kotest-assertions-core:${project.properties["kotestVersion"]}")
    testImplementation("io.mockk:mockk:${project.properties["mockkVersion"]}")
}
