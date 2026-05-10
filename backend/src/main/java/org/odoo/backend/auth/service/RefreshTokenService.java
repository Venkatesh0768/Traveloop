package org.odoo.backend.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.odoo.backend.auth.exception.InvalidTokenException;
import org.odoo.backend.auth.model.RefreshToken;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpirationMs;

    // ─── Create ──────────────────────────────────────────────────────────────

    /**
     * Create a new refresh token for {@code user}, tagging it with optional
     * {@code deviceInfo} (truncated User-Agent string).
     *
     * <p>Each call produces a <em>new</em> row — old tokens for this user are
     * <em>not</em> rotated here; that responsibility lies with the caller
     * (e.g. {@code AuthService.login}) who may want to keep other sessions alive.</p>
     *
     * @param user       the authenticated user
     * @param deviceInfo truncated User-Agent; may be null/blank
     * @return the persisted {@link RefreshToken}
     */
    @Transactional
    public RefreshToken createRefreshToken(User user, String deviceInfo) {
        LocalDateTime expiryDate = LocalDateTime.now()
                .plusSeconds(refreshTokenExpirationMs / 1000);

        String truncatedDeviceInfo = StringUtils.hasText(deviceInfo)
                ? deviceInfo.substring(0, Math.min(deviceInfo.length(), 255))
                : "unknown";

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(expiryDate)
                .deviceInfo(truncatedDeviceInfo)
                .build();

        RefreshToken saved = refreshTokenRepository.save(token);
        log.debug("Created refresh token for user={} device='{}'", user.getEmail(), truncatedDeviceInfo);
        return saved;
    }

    // ─── Verify ──────────────────────────────────────────────────────────────

    /**
     * Look up a token by its string value and assert it is not expired.
     *
     * <p>If the token has expired it is deleted from the DB and
     * {@link InvalidTokenException} is thrown — the caller should clear the
     * cookie and return 401.</p>
     *
     * @param tokenValue the raw token string from the cookie
     * @return the valid, non-expired {@link RefreshToken} entity
     * @throws InvalidTokenException if token is unknown or expired
     */
    @Transactional
    public RefreshToken verifyRefreshToken(String tokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found or already revoked"));

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            log.warn("Expired refresh token deleted for user={}", refreshToken.getUser().getEmail());
            throw new InvalidTokenException("Refresh token has expired. Please log in again.");
        }

        return refreshToken;
    }

    // ─── Rotate ──────────────────────────────────────────────────────────────

    /**
     * Implement <b>refresh token rotation</b>: invalidate the old token and
     * issue a brand-new one for the same user/device.
     *
     * <p>Rotation ensures that a stolen refresh token becomes useless after
     * its first use — detecting token reuse would indicate a breach.</p>
     *
     * @param oldToken   the token being exchanged
     * @param deviceInfo device info to carry forward
     * @return the newly created {@link RefreshToken}
     */
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken, String deviceInfo) {
        String userEmail = oldToken.getUser().getEmail();
        User user = oldToken.getUser();

        // Invalidate old token first
        refreshTokenRepository.delete(oldToken);
        log.debug("Rotated refresh token for user={}", userEmail);

        // Issue a fresh token
        return createRefreshToken(user, deviceInfo);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    /**
     * Revoke a single token (single-device logout).
     *
     * @param tokenValue the raw token string from the cookie
     */
    @Transactional
    public void deleteByTokenValue(String tokenValue) {
        refreshTokenRepository.deleteByToken(tokenValue);
        log.debug("Refresh token revoked");
    }

    /**
     * Revoke <em>all</em> tokens for a user (logout from all devices).
     *
     * @param user the user whose sessions should be terminated
     */
    @Transactional
    public void deleteAllByUser(User user) {
        refreshTokenRepository.deleteAllByUser(user);
        log.info("All refresh tokens revoked for user={}", user.getEmail());
    }
}
