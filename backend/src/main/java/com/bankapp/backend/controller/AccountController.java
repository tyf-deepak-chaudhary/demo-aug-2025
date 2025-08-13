package com.bankapp.backend.controller;

import com.bankapp.backend.dto.AccountResponse;
import com.bankapp.backend.dto.CreateAccountRequest;
import com.bankapp.backend.model.Account;
import com.bankapp.backend.model.User;
import com.bankapp.backend.repository.AccountRepository;
import com.bankapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserAccounts(@PathVariable Integer userId) {
        try {
            List<Account> accounts = accountRepository.findByUserId(userId);
            List<AccountResponse> accountResponses = accounts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(accountResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error fetching accounts: " + e.getMessage()));
        }
    }

    @PostMapping("/create/{userId}")
    public ResponseEntity<?> createAccount(@PathVariable Integer userId, @RequestBody CreateAccountRequest request) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
            }

            User user = userOptional.get();
            
            // Validate input
            if (request.getAccountName() == null || request.getAccountName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Account name is required"));
            }
            
            if (request.getAccountType() == null || request.getAccountType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Account type is required"));
            }

            if (request.getInitialBalance() == null || request.getInitialBalance().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Initial balance must be non-negative"));
            }

            // Create new account
            Account account = new Account();
            account.setAccountName(request.getAccountName().trim());
            account.setAccountType(request.getAccountType().trim().toUpperCase());
            account.setBalance(request.getInitialBalance());
            account.setUser(user);
            account.setAccountNumber(generateAccountNumber());

            // Save account
            Account savedAccount = accountRepository.save(account);
            
            return ResponseEntity.ok(Map.of(
                "message", "Account created successfully!",
                "account", convertToResponse(savedAccount)
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error creating account: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{accountId}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long accountId) {
        try {
            Optional<Account> accountOptional = accountRepository.findById(accountId);
            if (!accountOptional.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Account not found"));
            }

            accountRepository.deleteById(accountId);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully!"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error deleting account: " + e.getMessage()));
        }
    }

    private AccountResponse convertToResponse(Account account) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountName(account.getAccountName());
        response.setAccountType(account.getAccountType());
        response.setBalance(account.getBalance());
        response.setAccountNumber(account.getAccountNumber());
        response.setCreatedAt(account.getCreatedAt());
        return response;
    }

    private String generateAccountNumber() {
        String accountNumber;
        do {
            accountNumber = String.format("%010d", new Random().nextInt(1000000000));
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }
}
