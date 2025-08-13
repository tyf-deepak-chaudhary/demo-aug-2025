package com.bankapp.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class AccountResponse {
    private Long id;
    private String accountName;
    private String accountType;
    private BigDecimal balance;
    private String accountNumber;
    private LocalDateTime createdAt;
}
