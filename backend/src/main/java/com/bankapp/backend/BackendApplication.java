// In BackendApplication.java

package com.bankapp.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication(scanBasePackages = "com.bankapp.backend")
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    // Add this temporary bean to generate a password hash
    @Bean
    CommandLineRunner commandLineRunner(PasswordEncoder encoder) {
        return args -> {
            System.out.println("************************************************************");
            System.out.println("BCrypt hash for 'password123': " + encoder.encode("password123"));
            System.out.println("************************************************************");
        };
    }
}