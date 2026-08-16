package com.attendtrack.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

/**
 * ==========================================================
 * Universal Cloud Database Configuration
 * ==========================================================
 * Automatically adapts to:
 * 1. Render / Heroku native PostgreSQL URL (postgresql://user:pass@host:port/db)
 * 2. Railway / Cloud MySQL URL (mysql://user:pass@host:port/db or jdbc:mysql://...)
 * 3. Local MySQL (jdbc:mysql://localhost:3306/attendance_db)
 * 4. Embedded H2 in-memory database fallback
 * ==========================================================
 */
@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        // 1. Check environment variable DATABASE_URL or SPRING_DATASOURCE_URL
        String envDbUrl = System.getenv("DATABASE_URL");
        if (envDbUrl == null || envDbUrl.isBlank()) {
            envDbUrl = System.getenv("SPRING_DATASOURCE_URL");
        }
        if (envDbUrl == null || envDbUrl.isBlank()) {
            envDbUrl = rawUrl;
        }

        System.out.println("🔍 Resolving database connection from: " + (envDbUrl != null && envDbUrl.contains("@") ? envDbUrl.substring(0, envDbUrl.indexOf("@")) + "@..." : envDbUrl));

        if (envDbUrl != null && !envDbUrl.isBlank()) {
            try {
                // Case A: Render / Heroku PostgreSQL URL (postgres:// or postgresql://)
                if (envDbUrl.startsWith("postgres://") || envDbUrl.startsWith("postgresql://")) {
                    URI uri = new URI(envDbUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                    String path = uri.getPath(); // /dbname
                    String userInfo = uri.getUserInfo();

                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                    config.setJdbcUrl(jdbcUrl);
                    config.setDriverClassName("org.postgresql.Driver");

                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        config.setUsername(parts[0]);
                        config.setPassword(parts[1]);
                    } else if (userInfo != null) {
                        config.setUsername(userInfo);
                    }

                    System.out.println("✅ Configured PostgreSQL DataSource: " + jdbcUrl);
                    return new HikariDataSource(config);
                }

                // Case B: MySQL URL with mysql:// protocol
                if (envDbUrl.startsWith("mysql://")) {
                    URI uri = new URI(envDbUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() == -1 ? 3306 : uri.getPort();
                    String path = uri.getPath();
                    String userInfo = uri.getUserInfo();

                    String jdbcUrl = "jdbc:mysql://" + host + ":" + port + path + "?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true";
                    config.setJdbcUrl(jdbcUrl);
                    config.setDriverClassName("com.mysql.cj.jdbc.Driver");

                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        config.setUsername(parts[0]);
                        config.setPassword(parts[1]);
                    }

                    System.out.println("✅ Configured MySQL DataSource: " + jdbcUrl);
                    return new HikariDataSource(config);
                }

                // Case C: Standard JDBC URL (starts with jdbc:)
                if (envDbUrl.startsWith("jdbc:")) {
                    config.setJdbcUrl(envDbUrl);
                    if (envDbUrl.startsWith("jdbc:postgresql:")) {
                        config.setDriverClassName("org.postgresql.Driver");
                    } else if (envDbUrl.startsWith("jdbc:mysql:")) {
                        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
                    } else if (envDbUrl.startsWith("jdbc:h2:")) {
                        config.setDriverClassName("org.h2.Driver");
                    }
                    config.setUsername(defaultUsername.isBlank() ? "root" : defaultUsername);
                    config.setPassword(defaultPassword.isBlank() ? "root" : defaultPassword);

                    System.out.println("✅ Configured JDBC DataSource: " + envDbUrl);
                    return new HikariDataSource(config);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Could not parse cloud DB URL, falling back to H2 in-memory: " + e.getMessage());
            }
        }

        // Fallback: In-memory H2 database
        System.out.println("ℹ️ Using embedded in-memory H2 database.");
        config.setJdbcUrl("jdbc:h2:mem:attendance_db;DB_CLOSE_DELAY=-1;MODE=MySQL");
        config.setDriverClassName("org.h2.Driver");
        config.setUsername("sa");
        config.setPassword("");
        return new HikariDataSource(config);
    }
}
