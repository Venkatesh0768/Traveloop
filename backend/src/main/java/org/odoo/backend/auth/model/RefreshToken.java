package org.odoo.backend.auth.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Persisted refresh token supporting <b>multi-device sessions</b>.
 *
 * <p>Each login event (any device / browser) generates an independent row,
 * identified by a cryptographically-random UUID token string.  The previous
 * single-session {@code @OneToOne} constraint has been replaced with
 * {@code @ManyToOne} so a user can hold N concurrent sessions.</p>
 *
 * <p>The {@code deviceInfo} column stores the truncated User-Agent string for
 * audit / session-management UIs ("Revoke this session").</p>
 */
@Entity
@Table(
        name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_token_token",   columnList = "token"),
                @Index(name = "idx_refresh_token_user_id", columnList = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owning user — many tokens per user (one per active session/device). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Opaque, cryptographically-random UUID — stored as-is (not hashed here; see RefreshTokenService). */
    @Column(nullable = false, unique = true, length = 512)
    private String token;

    /** Absolute expiry point. Checked on every refresh request. */
    @Column(nullable = false)
    private LocalDateTime expiryDate;

    /**
     * Truncated {@code User-Agent} header (max 255 chars).
     * Nullable — pre-existing tokens and programmatic calls may not have agent info.
     */
    @Column(length = 255, nullable = true)
    private String deviceInfo;

    /**
     * Immutable creation timestamp — set by Hibernate on INSERT, never updated.
     *
     * <p><b>columnDefinition</b> provides {@code DEFAULT CURRENT_TIMESTAMP(6)} so that
     * when Hibernate runs {@code ALTER TABLE refresh_tokens ADD COLUMN created_at ...}
     * on an existing table, MySQL can backfill the new column with the current time
     * for existing rows — avoiding the strict-mode
     * {@code Incorrect datetime value: '0000-00-00 00:00:00'} error.</p>
     */
    @CreationTimestamp
    @Column(
            nullable = false,
            updatable = false,
            columnDefinition = "datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)"
    )
    private LocalDateTime createdAt;


}