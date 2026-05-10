package org.odoo.backend.expense.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.expense.dto.request.CreateExpenseRequest;
import org.odoo.backend.expense.dto.response.BudgetSummaryResponse;
import org.odoo.backend.expense.dto.response.ExpenseResponse;
import org.odoo.backend.expense.service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/{tripId}/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse createExpense(
            @PathVariable UUID tripId,
            @Valid @RequestBody CreateExpenseRequest request
    ) {

        return expenseService.createExpense(tripId, request);
    }

    @GetMapping("/{tripId}/expenses")
    public List<ExpenseResponse> getTripExpenses(
            @PathVariable UUID tripId
    ) {

        return expenseService.getTripExpenses(tripId);
    }

    @GetMapping("/{tripId}/budget-summary")
    public BudgetSummaryResponse getBudgetSummary(
            @PathVariable UUID tripId
    ) {

        return expenseService.getBudgetSummary(tripId);
    }

    @DeleteMapping("/expenses/{expenseId}")
    public String deleteExpense(
            @PathVariable UUID expenseId
    ) {

        expenseService.deleteExpense(expenseId);

        return "Expense deleted successfully";
    }
}