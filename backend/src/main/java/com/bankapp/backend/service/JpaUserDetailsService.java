package com.bankapp.backend.service;

import com.bankapp.backend.model.User; // Make sure this import points to your User entity
import com.bankapp.backend.repository.UserRepository; // Make sure this import points to your UserRepository
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service // <-- This annotation is CRITICAL. It makes this class a Spring bean.
public class JpaUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Spring will automatically inject your UserRepository bean here
    public JpaUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Fetch your custom User entity from the database
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // 2. Convert your User entity into a Spring Security UserDetails object
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                new ArrayList<>() // Use an empty list for authorities for now
        );
    }
}