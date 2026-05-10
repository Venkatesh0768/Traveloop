package org.odoo.backend.expense.repository;

import org.odoo.backend.expense.model.Expense;
import org.odoo.backend.trip.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByTrip(Trip trip);
    @Query("""
       SELECT COALESCE(SUM(e.amount), 0)
       FROM Expense e
       """)
    BigDecimal getTotalExpensesAmount();
}