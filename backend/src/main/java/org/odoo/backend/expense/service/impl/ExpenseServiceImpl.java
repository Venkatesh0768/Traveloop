package org.odoo.backend.expense.service.impl;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.expense.dto.request.CreateExpenseRequest;
import org.odoo.backend.expense.dto.response.BudgetSummaryResponse;
import org.odoo.backend.expense.dto.response.ExpenseResponse;
import org.odoo.backend.expense.model.Expense;
import org.odoo.backend.expense.repository.ExpenseRepository;
import org.odoo.backend.expense.service.ExpenseService;
import org.odoo.backend.trip.model.Trip;
import org.odoo.backend.trip.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;

    @Override
    public ExpenseResponse createExpense(
            UUID tripId,
            CreateExpenseRequest request
    ) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        Expense expense = Expense.builder()
                .category(request.getCategory())
                .description(request.getDescription())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate())
                .paymentMethod(request.getPaymentMethod())
                .receiptUrl(request.getReceiptUrl())
                .trip(trip)
                .build();

        Expense savedExpense = expenseRepository.save(expense);

        updateTripEstimatedCost(trip);

        return mapToResponse(savedExpense);
    }

    @Override
    public List<ExpenseResponse> getTripExpenses(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        List<Expense> expenses =
                expenseRepository.findByTrip(trip);

        return expenses.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public BudgetSummaryResponse getBudgetSummary(UUID tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        List<Expense> expenses =
                expenseRepository.findByTrip(trip);

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalBudget = trip.getTotalBudget() != null
                ? trip.getTotalBudget()
                : BigDecimal.ZERO;

        BigDecimal remainingBudget =
                totalBudget.subtract(totalExpenses);

        return BudgetSummaryResponse.builder()
                .totalBudget(totalBudget)
                .totalExpenses(totalExpenses)
                .remainingBudget(remainingBudget)
                .totalExpensesCount(expenses.size())
                .build();
    }

    @Override
    public void deleteExpense(UUID expenseId) {

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        Trip trip = expense.getTrip();

        expenseRepository.delete(expense);

        updateTripEstimatedCost(trip);
    }

    private void updateTripEstimatedCost(Trip trip) {

        List<Expense> expenses =
                expenseRepository.findByTrip(trip);

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        trip.setEstimatedCost(totalExpenses);

        tripRepository.save(trip);
    }

    private ExpenseResponse mapToResponse(Expense expense) {

        return ExpenseResponse.builder()
                .id(expense.getId())
                .category(expense.getCategory())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .paymentMethod(expense.getPaymentMethod())
                .receiptUrl(expense.getReceiptUrl())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}