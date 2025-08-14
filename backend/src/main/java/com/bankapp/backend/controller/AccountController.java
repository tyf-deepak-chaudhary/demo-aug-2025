package com.bankapp.backend.controller;

import com.bankapp.backend.dto.AccountResponse;
import com.bankapp.backend.dto.CreateAccountRequest;
import com.bankapp.backend.dto.PinRequest;
import com.bankapp.backend.model.Account;
import com.bankapp.backend.model.User;
import com.bankapp.backend.repository.AccountRepository;
import com.bankapp.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder; // Import PasswordEncoder
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

    // --- Inject the PasswordEncoder for hashing ---
    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserAccounts(@PathVariable Integer userId) {
        try {
            List<Account> accounts = accountRepository.findByUserId(userId);
            List<AccountResponse> accountResponses = accounts.stream()
                    .map(this::convertToListResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(accountResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error fetching accounts: " + e.getMessage()));
        }
    }

    // --- MODIFIED: Handles the new account-specific PIN ---
    @PostMapping("/create/{userId}")
    public ResponseEntity<?> createAccount(@PathVariable Integer userId, @RequestBody CreateAccountRequest request) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
            }

            // --- Validate the new PIN field from the request ---
            if (request.getPin() == null || !request.getPin().matches("\\d{4}")) {
                return ResponseEntity.badRequest().body(Map.of("message", "A valid 4-digit PIN is required"));
            }

            Account account = new Account();
            account.setAccountName(request.getAccountName().trim());
            account.setAccountType(request.getAccountType().trim().toUpperCase());
            account.setBalance(request.getInitialBalance());
            account.setUser(userOptional.get());
            account.setAccountNumber(generateAccountNumber());

            // --- Hash and set the PIN on the new account object ---
            account.setPin(passwordEncoder.encode(request.getPin()));

            Account savedAccount = accountRepository.save(account);

            return ResponseEntity.ok(Map.of(
                    "message", "Account created successfully!",
                    "account", convertToResponseWithBalance(savedAccount)
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error creating account: " + e.getMessage()));
        }
    }

    // --- MODIFIED: Verifies PIN against the specific account ---
    @PostMapping("/{accountId}/balance")
    public ResponseEntity<?> getAccountBalance(@PathVariable Long accountId, @RequestBody PinRequest pinRequest) {
        try {
            Optional<Account> accountOptional = accountRepository.findById(accountId);
            if (!accountOptional.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Account not found"));
            }

            Account account = accountOptional.get();

            // --- Check PIN against the account's stored hash, not the user's ---
            if (account.getPin() == null || !passwordEncoder.matches(pinRequest.getPin(), account.getPin())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid PIN for this account"));
            }

            return ResponseEntity.ok(Map.of("balance", account.getBalance()));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error fetching balance: " + e.getMessage()));
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

    private AccountResponse convertToListResponse(Account account) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountName(account.getAccountName());
        response.setAccountType(account.getAccountType());
        response.setAccountNumber(account.getAccountNumber());
        response.setCreatedAt(account.getCreatedAt());
        return response;
    }

    private AccountResponse convertToResponseWithBalance(Account account) {
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