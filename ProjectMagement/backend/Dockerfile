# Multi-stage: Maven (JDK 17) builds the fat JAR; final image only needs the JRE.
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY .mvn/wrapper .mvn/wrapper
COPY mvnw pom.xml ./
COPY src ./src

RUN chmod +x mvnw && ./mvnw -B -DskipTests clean package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Fat JAR name from pom.xml (artifactId + version)
COPY --from=build /app/target/cbmp-backend-1.0.0-SNAPSHOT.jar app.jar

# Render sets PORT; your app should use server.port=${PORT:...}
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]