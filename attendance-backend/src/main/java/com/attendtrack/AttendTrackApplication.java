package com.attendtrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ==========================================================
 * 🎓 Spring Boot Learning Note: @SpringBootApplication
 * ==========================================================
 * This single annotation is a combination of 3 key annotations:
 * 
 * 1. @Configuration:
 *    Tags the class as a source of bean definitions for the application context.
 * 
 * 2. @EnableAutoConfiguration:
 *    Tells Spring Boot to start adding beans based on classpath settings,
 *    other beans, and various property settings (e.g. auto-configures DataSource,
 *    Hibernate, Embedded Tomcat server, Jackson JSON parser, etc.).
 * 
 * 3. @ComponentScan:
 *    Tells Spring to look for other components, configurations, and services
 *    in the 'com.attendtrack' package and its sub-packages (controller, service,
 *    repository, entity, etc.).
 * ==========================================================
 */
@SpringBootApplication
public class AttendTrackApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendTrackApplication.class, args);
        System.out.println("\n" +
            "===============================================================\n" +
            "  🎓 AttendTrack Spring Boot Backend Started Successfully!     \n" +
            "  REST API Base URL: http://localhost:8080/api                 \n" +
            "===============================================================\n"
        );
    }
}
