# ==========================================
# Multi-Stage Dockerfile for Spring Boot 3
# ==========================================

# Stage 1: Build the JAR with Maven
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built JAR from Stage 1
COPY --from=builder /app/target/*.jar app.jar

# Expose default port
EXPOSE 8080

# Run Spring Boot application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
