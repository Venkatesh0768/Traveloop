package org.odoo.backend.expense.model;


import jakarta.persistence.*;
import lombok.*;
import org.odoo.backend.expense.enums.ExpenseCategory;
import org.odoo.backend.trip.model.Trip;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private ExpenseCategory category;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private LocalDate expenseDate;

    private String paymentMethod;

    private String receiptUrl;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.expenseDate == null) {
            this.expenseDate = LocalDate.now();
        }
    }
}