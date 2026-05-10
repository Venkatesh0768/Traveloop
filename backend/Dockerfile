# Stage 1: Build
FROM eclipse-temurin:25-jdk AS builder

WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src ./src

RUN ./mvnw clean package -DskipTests -B


# Stage 2: Runtime (Distroless)
FROM gcr.io/distroless/java25-debian13

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 5000

CMD ["app.jar"]