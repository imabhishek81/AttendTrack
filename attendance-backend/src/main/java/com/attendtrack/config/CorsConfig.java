package com.attendtrack.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: CORS Configuration
 * ==========================================================
 * When your React app runs on port 5173 and requests the Spring Boot
 * backend on port 8080, browsers enforce the Same-Origin Policy (SOP).
 * 
 * Using allowedOriginPatterns("*") with allowCredentials(true) allows
 * any local development origin (Vite, React, Postman) to connect securely.
 * ==========================================================
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
