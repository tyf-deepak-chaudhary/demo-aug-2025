package com.bankapp.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class CreateAccountRequest {
    private String accountName;
    private String accountType;
    private BigDecimal initialBalance;
}
