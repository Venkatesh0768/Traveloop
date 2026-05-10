package org.odoo.backend.expense.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetSummaryResponse {

    private BigDecimal totalBudget;

    private BigDecimal totalExpenses;

    private BigDecimal remainingBudget;

    private Integer totalExpensesCount;
}