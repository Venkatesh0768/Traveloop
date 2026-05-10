package org.odoo.backend.auth.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.odoo.backend.auth.repository.RefreshTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled job that purges expired refresh tokens from the database.
 *
 * <h3>Why this matters</h3>
 * <p>Without a cleanup job the {@code refresh_tokens} table grows unboundedly.
 * Expired tokens are worthless (they fail verification) but continue to consume
 * storage and slow down index scans.  This job deletes them in bulk during
 * low-traffic hours.</p>
 *
 * <h3>Schedule</h3>
 * <p>Runs nightly at <b>03:00 UTC</b> by default.  The cron expression can be
 * overridden with the {@code app.scheduler.token-cleanup-cron} property.</p>
 *
 * <pre>
 * app:
 *   scheduler:
 *     token-cleanup-cron: "0 0 3 * * *"   # Every day at 03:00 UTC
 * </pre>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TokenCleanupScheduler {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Delete all {@link org.blog.backend.auth.model.RefreshToken} rows whose
     * {@code expiryDate} is in the past.
     *
     * <p>The operation is wrapped in a transaction so that the DELETE is atomic
     * and rolled back on failure.  Uses a single JPQL bulk-delete statement —
     * no N+1 here.</p>
     */
    @Scheduled(cron = "${app.scheduler.token-cleanup-cron:0 0 3 * * *}")
    @Transactional
    public void purgeExpiredRefreshTokens() {
        LocalDateTime now = LocalDateTime.now();
        int deleted = refreshTokenRepository.deleteAllExpiredBefore(now);
        if (deleted > 0) {
            log.info("Token cleanup: deleted {} expired refresh token(s) at {}", deleted, now);
        } else {
            log.debug("Token cleanup: no expired tokens found at {}", now);
        }
    }
}
