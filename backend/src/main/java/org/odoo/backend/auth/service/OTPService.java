package org.odoo.backend.auth.service;

import lombok.RequiredArgsConstructor;
import org.odoo.backend.auth.exception.EmailAlreadyVerifiedException;
import org.odoo.backend.auth.exception.InvalidOTPException;
import org.odoo.backend.auth.model.OTP;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.OTPRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Owns the full lifecycle of {@link OTP} entities.
 *
 * <p><b>Single Responsibility</b>: this service handles <em>only</em> OTPs —
 * refresh-token management has been moved to {@link RefreshTokenService}.</p>
 *
 * <p>A {@link SecureRandom} instance is used for all OTP generation to ensure
 * cryptographic quality randomness.</p>
 */
@Service
@RequiredArgsConstructor
public class OTPService {

    private final OTPRepository otpRepository;
    private final EmailService emailService;

    /** OTP lifetime in <em>milliseconds</em> (e.g. 300000 = 5 minutes). */
    @Value("${otp.expiration}")
    private long otpExpirationMs;

    /** Number of digits in the generated OTP (e.g. 6). */
    @Value("${otp.length}")
    private int otpLength;

    // ─── Generate & Send ─────────────────────────────────────────────────────

    /**
     * Delete any existing OTP for {@code email}, generate a fresh one, persist
     * it, and send the email-verification message.
     *
     * @param email recipient address
     */
    @Transactional
    public void generateAndSendOTP(String email) {
        otpRepository.deleteByEmail(email);

        OTP otp = buildOTP(email);
        otpRepository.save(otp);

        emailService.sendOTPEmail(email, otp.getOtpCode());
    }

    /**
     * Delete any existing OTP for {@code email}, generate a fresh one, persist
     * it, and send the password-reset message.
     *
     * @param email recipient address
     */
    @Transactional
    public void generateAndSendPasswordResetOTP(String email) {
        otpRepository.deleteByEmail(email);

        OTP otp = buildOTP(email);
        otpRepository.save(otp);

        emailService.sendPasswordResetOTPEmail(email, otp.getOtpCode());
    }

    // ─── Validate ────────────────────────────────────────────────────────────

    /**
     * Validate that {@code otpCode} matches an unverified, non-expired OTP for
     * {@code email}.  On success the OTP is marked verified (prevent re-use).
     *
     * @param email   the user's email address
     * @param otpCode the code submitted by the user
     * @return {@code true} if valid, {@code false} otherwise
     */
    public boolean validateOTP(String email, String otpCode) {
        Optional<OTP> otpOptional = otpRepository
                .findByEmailAndOtpCodeAndVerifiedFalse(email, otpCode);

        if (otpOptional.isEmpty()) {
            return false;
        }

        OTP otp = otpOptional.get();

        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            return false;
        }

        otp.setVerified(true);
        otpRepository.save(otp);
        return true;
    }

    /**
     * Convenience wrapper that throws instead of returning {@code false}.
     *
     * @throws InvalidOTPException if the OTP is invalid or expired
     */
    public void validateOTPOrThrow(String email, String otpCode) {
        if (!validateOTP(email, otpCode)) {
            throw new InvalidOTPException("Invalid or expired OTP");
        }
    }

    // ─── Resend Guard ────────────────────────────────────────────────────────

    /**
     * Guard used before resending an OTP — throws if the email is already
     * verified.
     *
     * @param user the user requesting a resend
     * @throws EmailAlreadyVerifiedException if already verified
     */
    public void assertEmailNotYetVerified(User user) {
        if (user.isEmailVerified()) {
            throw new EmailAlreadyVerifiedException("Email is already verified");
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private OTP buildOTP(String email) {
        String code = generateOTPCode();
        LocalDateTime expiryTime = LocalDateTime.now()
                .plusSeconds(otpExpirationMs / 1000);

        return OTP.builder()
                .email(email)
                .otpCode(code)
                .expiryTime(expiryTime)
                .build();
    }

    private String generateOTPCode() {
        SecureRandom secureRandom = new SecureRandom();
        StringBuilder otp = new StringBuilder(otpLength);
        for (int i = 0; i < otpLength; i++) {
            otp.append(secureRandom.nextInt(10));
        }
        return otp.toString();
    }
}