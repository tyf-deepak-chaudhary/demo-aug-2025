package com.bankapp.backend.controller;

import com.bankapp.backend.dto.LoginRequest;
import com.bankapp.backend.model.User;
import com.bankapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                return ResponseEntity.ok(Map.of("message", "Login successful!", "userId", user.getId()));
            }
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
    }
}