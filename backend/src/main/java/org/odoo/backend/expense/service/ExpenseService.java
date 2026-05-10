package org.odoo.backend.expense.service;



import org.odoo.backend.expense.dto.request.CreateExpenseRequest;
import org.odoo.backend.expense.dto.response.BudgetSummaryResponse;
import org.odoo.backend.expense.dto.response.ExpenseResponse;

import java.util.List;
import java.util.UUID;

public interface ExpenseService {

    ExpenseResponse createExpense(
            UUID tripId,
            CreateExpenseRequest request
    );

    List<ExpenseResponse> getTripExpenses(UUID tripId);

    BudgetSummaryResponse getBudgetSummary(UUID tripId);

    void deleteExpense(UUID expenseId);

}