package org.odoo.backend.expense.dto.response;

import lombok.*;
import org.odoo.backend.expense.enums.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseResponse {

    private UUID id;

    private ExpenseCategory category;

    private String description;

    private BigDecimal amount;

    private LocalDate expenseDate;

    private String paymentMethod;

    private String receiptUrl;

    private LocalDateTime createdAt;
}