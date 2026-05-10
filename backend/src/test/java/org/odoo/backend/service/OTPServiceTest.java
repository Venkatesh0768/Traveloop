package org.odoo.backend.service;

import org.odoo.backend.auth.exception.EmailAlreadyVerifiedException;
import org.odoo.backend.auth.exception.InvalidOTPException;
import org.odoo.backend.auth.model.OTP;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.OTPRepository;
import org.odoo.backend.auth.service.EmailService;
import org.odoo.backend.auth.service.OTPService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OTPService")
class OTPServiceTest {

    @Mock OTPRepository otpRepository;
    @Mock
    EmailService emailService;

    @InjectMocks
    OTPService otpService;

    @BeforeEach
    void injectProperties() {
        ReflectionTestUtils.setField(otpService, "otpExpirationMs", 300_000L); // 5 min
        ReflectionTestUtils.setField(otpService, "otpLength", 6);
    }

    // ─── generateAndSendOTP ──────────────────────────────────────────────────

    @Nested
    @DisplayName("generateAndSendOTP()")
    class GenerateAndSendOTP {

        @Test
        @DisplayName("deletes old OTP, saves new one, and sends verification email")
        void happyPath() {
            String email = "user@example.com";
            ArgumentCaptor<OTP> savedOtp = ArgumentCaptor.forClass(OTP.class);

            otpService.generateAndSendOTP(email);

            verify(otpRepository).deleteByEmail(email);
            verify(otpRepository).save(savedOtp.capture());
            verify(emailService).sendOTPEmail(eq(email), eq(savedOtp.getValue().getOtpCode()));

            OTP otp = savedOtp.getValue();
            assertThat(otp.getEmail()).isEqualTo(email);
            assertThat(otp.getOtpCode()).hasSize(6).matches("\\d{6}");
            assertThat(otp.getExpiryTime()).isAfter(LocalDateTime.now());
        }

        @Test
        @DisplayName("generated OTP contains only digits")
        void otpCodeDigitsOnly() {
            otpService.generateAndSendOTP("user@example.com");

            ArgumentCaptor<OTP> cap = ArgumentCaptor.forClass(OTP.class);
            verify(otpRepository).save(cap.capture());
            assertThat(cap.getValue().getOtpCode()).matches("[0-9]+");
        }

        @Test
        @DisplayName("expiry time is approximately 5 minutes from now")
        void expiryIsCorrect() {
            LocalDateTime before = LocalDateTime.now();
            otpService.generateAndSendOTP("user@example.com");
            LocalDateTime after = LocalDateTime.now();

            ArgumentCaptor<OTP> cap = ArgumentCaptor.forClass(OTP.class);
            verify(otpRepository).save(cap.capture());

            LocalDateTime expiry = cap.getValue().getExpiryTime();
            assertThat(expiry).isAfter(before.plusSeconds(295));
            assertThat(expiry).isBefore(after.plusSeconds(305));
        }

        @Test
        @DisplayName("propagates exception when email send fails")
        void emailSendFailurePropagates() {
            doThrow(new RuntimeException("SMTP down"))
                    .when(emailService).sendOTPEmail(anyString(), anyString());

            assertThatThrownBy(() -> otpService.generateAndSendOTP("user@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("SMTP down");
        }
    }

    // ─── generateAndSendPasswordResetOTP ─────────────────────────────────────

    @Nested
    @DisplayName("generateAndSendPasswordResetOTP()")
    class GenerateAndSendPasswordResetOTP {

        @Test
        @DisplayName("deletes old OTP, saves new one, and sends password-reset email")
        void happyPath() {
            String email = "user@example.com";
            ArgumentCaptor<OTP> savedOtp = ArgumentCaptor.forClass(OTP.class);

            otpService.generateAndSendPasswordResetOTP(email);

            verify(otpRepository).deleteByEmail(email);
            verify(otpRepository).save(savedOtp.capture());
            verify(emailService).sendPasswordResetOTPEmail(eq(email), eq(savedOtp.getValue().getOtpCode()));
            verifyNoMoreInteractions(emailService);
        }
    }

    // ─── validateOTP ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("validateOTP()")
    class ValidateOTP {

        @Test
        @DisplayName("returns true and marks OTP verified when code is valid and not expired")
        void validCode() {
            OTP otp = validOtp("user@example.com", "123456");
            when(otpRepository.findByEmailAndOtpCodeAndVerifiedFalse("user@example.com", "123456"))
                    .thenReturn(Optional.of(otp));

            boolean result = otpService.validateOTP("user@example.com", "123456");

            assertThat(result).isTrue();
            assertThat(otp.isVerified()).isTrue();
            verify(otpRepository).save(otp);
        }

        @Test
        @DisplayName("returns false when OTP is not found")
        void otpNotFound() {
            when(otpRepository.findByEmailAndOtpCodeAndVerifiedFalse(anyString(), anyString()))
                    .thenReturn(Optional.empty());

            assertThat(otpService.validateOTP("user@example.com", "000000")).isFalse();
            verify(otpRepository, never()).save(any());
        }

        @Test
        @DisplayName("returns false and does not mark verified when OTP is expired")
        void expiredOtp() {
            OTP expiredOtp = OTP.builder()
                    .email("user@example.com")
                    .otpCode("123456")
                    .expiryTime(LocalDateTime.now().minusMinutes(1))
                    .verified(false)
                    .build();
            when(otpRepository.findByEmailAndOtpCodeAndVerifiedFalse("user@example.com", "123456"))
                    .thenReturn(Optional.of(expiredOtp));

            assertThat(otpService.validateOTP("user@example.com", "123456")).isFalse();
            verify(otpRepository, never()).save(any());
        }
    }

    // ─── validateOTPOrThrow ──────────────────────────────────────────────────

    @Nested
    @DisplayName("validateOTPOrThrow()")
    class ValidateOTPOrThrow {

        @Test
        @DisplayName("does not throw when OTP is valid")
        void validDoesNotThrow() {
            OTP otp = validOtp("user@example.com", "123456");
            when(otpRepository.findByEmailAndOtpCodeAndVerifiedFalse("user@example.com", "123456"))
                    .thenReturn(Optional.of(otp));

            assertThatNoException().isThrownBy(
                    () -> otpService.validateOTPOrThrow("user@example.com", "123456"));
        }

        @Test
        @DisplayName("throws InvalidOTPException when OTP not found")
        void invalidOtpThrows() {
            when(otpRepository.findByEmailAndOtpCodeAndVerifiedFalse(anyString(), anyString()))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> otpService.validateOTPOrThrow("user@example.com", "bad"))
                    .isInstanceOf(InvalidOTPException.class)
                    .hasMessageContaining("Invalid or expired OTP");
        }

        @Test
        @DisplayName("throws InvalidOTPException when OTP is expired")
        void expiredOtpThrows() {
            OTP expired = OTP.builder()
                    .email("user@example.com")
                    .otpCode("123456")
                    .expiryTime(LocalDateTime.now().minusSeconds(1))
                    .verified(false)
                    .build();
            when(otpRepository.findByEmailAndOtpCodeAndVerifiedFalse("user@example.com", "123456"))
                    .thenReturn(Optional.of(expired));

            assertThatThrownBy(() -> otpService.validateOTPOrThrow("user@example.com", "123456"))
                    .isInstanceOf(InvalidOTPException.class);
        }
    }

    // ─── assertEmailNotYetVerified ────────────────────────────────────────────

    @Nested
    @DisplayName("assertEmailNotYetVerified()")
    class AssertEmailNotYetVerified {

        @Test
        @DisplayName("does nothing when email is not yet verified")
        void notVerifiedIsOk() {
            User user = User.builder().emailVerified(false).build();
            assertThatNoException().isThrownBy(() -> otpService.assertEmailNotYetVerified(user));
        }

        @Test
        @DisplayName("throws EmailAlreadyVerifiedException when email is already verified")
        void alreadyVerifiedThrows() {
            User user = User.builder().emailVerified(true).build();
            assertThatThrownBy(() -> otpService.assertEmailNotYetVerified(user))
                    .isInstanceOf(EmailAlreadyVerifiedException.class)
                    .hasMessageContaining("already verified");
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private OTP validOtp(String email, String code) {
        return OTP.builder()
                .email(email)
                .otpCode(code)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .build();
    }
}