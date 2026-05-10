package org.odoo.backend.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.odoo.backend.auth.exception.EmailSendingException;
import org.odoo.backend.auth.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService")
class EmailServiceTest {

    @Mock
    JavaMailSender mailSender;

    @InjectMocks
    EmailService emailService;

    private MimeMessage mimeMessage;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "no-reply@example.com");
        mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    // ─── sendOTPEmail ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("sendOTPEmail()")
    class SendOTPEmail {

        @Test
        @DisplayName("creates MimeMessage and calls send once")
        void happyPath() {
            emailService.sendOTPEmail("user@example.com", "123456");

            verify(mailSender, times(1)).createMimeMessage();
            verify(mailSender, times(1)).send(mimeMessage);
        }

        @Test
        @DisplayName("message subject contains the OTP code")
        void subjectContainsOtp() throws Exception {
            emailService.sendOTPEmail("user@example.com", "654321");

            String[] subjects = mimeMessage.getHeader("Subject");
            assertThat(subjects).isNotEmpty();
            // Subject is encoded; verify raw header contains the code
            assertThat(subjects[0]).contains("654321");
        }

        @Test
        @DisplayName("throws EmailSendingException when SMTP fails")
        void smtpFailureWrapped() {
            doThrow(new MailSendException("connection refused"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendOTPEmail("user@example.com", "123456"))
                    .isInstanceOf(EmailSendingException.class)
                    .hasMessageContaining("OTP");
        }
    }

    // ─── sendPasswordResetOTPEmail ────────────────────────────────────────────

    @Nested
    @DisplayName("sendPasswordResetOTPEmail()")
    class SendPasswordResetOTPEmail {

        @Test
        @DisplayName("creates MimeMessage and calls send once")
        void happyPath() {
            emailService.sendPasswordResetOTPEmail("user@example.com", "999888");

            verify(mailSender, times(1)).send(mimeMessage);
        }

        @Test
        @DisplayName("subject contains the OTP code")
        void subjectContainsOtp() throws Exception {
            emailService.sendPasswordResetOTPEmail("user@example.com", "112233");

            String[] subjects = mimeMessage.getHeader("Subject");
            assertThat(subjects).isNotEmpty();
            assertThat(subjects[0]).contains("112233");
        }

        @Test
        @DisplayName("throws EmailSendingException when SMTP fails")
        void smtpFailureWrapped() {
            doThrow(new MailSendException("timeout"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendPasswordResetOTPEmail("user@example.com", "000000"))
                    .isInstanceOf(EmailSendingException.class)
                    .hasMessageContaining("password reset OTP");
        }
    }

    // ─── Shared sender behaviour ──────────────────────────────────────────────

    @Nested
    @DisplayName("Shared sender behaviour")
    class SharedSenderBehaviour {

        @Test
        @DisplayName("both send methods use the same fromEmail address")
        void fromAddressIsSet() throws Exception {
            emailService.sendOTPEmail("user@example.com", "123456");

            String[] from = mimeMessage.getHeader("From");
            assertThat(from).isNotEmpty();
            assertThat(from[0]).contains("no-reply@example.com");
        }

        @Test
        @DisplayName("does not call send when createMimeMessage throws")
        void messagingExceptionFromFactory() {
            when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("factory error"));

            assertThatThrownBy(() -> emailService.sendOTPEmail("x@x.com", "000000"))
                    .isInstanceOf(RuntimeException.class);
            verify(mailSender, never()).send(any(MimeMessage.class));
        }
    }
}