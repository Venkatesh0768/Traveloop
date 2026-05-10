package org.odoo.backend.service;

import org.odoo.backend.auth.exception.InvalidTokenException;
import org.odoo.backend.auth.model.RefreshToken;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.RefreshTokenRepository;
import org.odoo.backend.auth.service.RefreshTokenService;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefreshTokenService")
class RefreshTokenServiceTest {

    @Mock RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    RefreshTokenService refreshTokenService;

    private User user;

    @BeforeEach
    void setUp() {
        // 7 days in ms
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenExpirationMs", 604_800_000L);

        user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .build();
    }

    // ─── createRefreshToken ───────────────────────────────────────────────────

    @Nested
    @DisplayName("createRefreshToken()")
    class CreateRefreshToken {

        @Test
        @DisplayName("persists a token with non-null UUID value and correct expiry")
        void happyPath() {
            ArgumentCaptor<RefreshToken> cap = ArgumentCaptor.forClass(RefreshToken.class);
            when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            refreshTokenService.createRefreshToken(user, "Mozilla/5.0");

            verify(refreshTokenRepository).save(cap.capture());
            RefreshToken saved = cap.getValue();

            assertThat(saved.getUser()).isEqualTo(user);
            assertThat(saved.getToken()).isNotBlank();
            // UUID format
            UUID parsed = UUID.fromString(saved.getToken());
            assertThat(parsed).isNotNull();
            assertThat(saved.getExpiryDate()).isAfter(LocalDateTime.now().plusDays(6));
            assertThat(saved.getDeviceInfo()).isEqualTo("Mozilla/5.0");
        }

        @Test
        @DisplayName("truncates deviceInfo longer than 255 characters")
        void deviceInfoTruncated() {
            String longAgent = "A".repeat(300);
            when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            refreshTokenService.createRefreshToken(user, longAgent);

            ArgumentCaptor<RefreshToken> cap = ArgumentCaptor.forClass(RefreshToken.class);
            verify(refreshTokenRepository).save(cap.capture());
            assertThat(cap.getValue().getDeviceInfo()).hasSize(255);
        }

        @Test
        @DisplayName("stores 'unknown' when deviceInfo is null")
        void nullDeviceInfo() {
            when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            refreshTokenService.createRefreshToken(user, null);

            ArgumentCaptor<RefreshToken> cap = ArgumentCaptor.forClass(RefreshToken.class);
            verify(refreshTokenRepository).save(cap.capture());
            assertThat(cap.getValue().getDeviceInfo()).isEqualTo("unknown");
        }

        @Test
        @DisplayName("stores 'unknown' when deviceInfo is blank")
        void blankDeviceInfo() {
            when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            refreshTokenService.createRefreshToken(user, "   ");

            ArgumentCaptor<RefreshToken> cap = ArgumentCaptor.forClass(RefreshToken.class);
            verify(refreshTokenRepository).save(cap.capture());
            assertThat(cap.getValue().getDeviceInfo()).isEqualTo("unknown");
        }

        @Test
        @DisplayName("each call generates a unique token value")
        void tokensAreUnique() {
            when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            RefreshToken first  = refreshTokenService.createRefreshToken(user, "device1");
            RefreshToken second = refreshTokenService.createRefreshToken(user, "device2");

            assertThat(first.getToken()).isNotEqualTo(second.getToken());
        }
    }

    // ─── verifyRefreshToken ───────────────────────────────────────────────────

    @Nested
    @DisplayName("verifyRefreshToken()")
    class VerifyRefreshToken {

        @Test
        @DisplayName("returns token when found and not expired")
        void returnsValidToken() {
            RefreshToken token = validToken();
            when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

            RefreshToken result = refreshTokenService.verifyRefreshToken("valid-token");

            assertThat(result).isEqualTo(token);
            verify(refreshTokenRepository, never()).delete(any());
        }

        @Test
        @DisplayName("throws InvalidTokenException when token not found")
        void tokenNotFound() {
            when(refreshTokenRepository.findByToken("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> refreshTokenService.verifyRefreshToken("ghost"))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("deletes and throws when token is expired")
        void expiredToken() {
            RefreshToken expired = RefreshToken.builder()
                    .user(user)
                    .token("expired-token")
                    .expiryDate(LocalDateTime.now().minusHours(1))
                    .build();
            when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expired));

            assertThatThrownBy(() -> refreshTokenService.verifyRefreshToken("expired-token"))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("expired");

            verify(refreshTokenRepository).delete(expired);
        }
    }

    // ─── rotateRefreshToken ───────────────────────────────────────────────────

    @Nested
    @DisplayName("rotateRefreshToken()")
    class RotateRefreshToken {

        @Test
        @DisplayName("deletes old token and creates a new one for the same user")
        void happyPath() {
            RefreshToken oldToken = validToken();
            when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            RefreshToken newToken = refreshTokenService.rotateRefreshToken(oldToken, "deviceX");

            verify(refreshTokenRepository).delete(oldToken);
            verify(refreshTokenRepository).save(any(RefreshToken.class));
            assertThat(newToken.getUser()).isEqualTo(user);
            assertThat(newToken.getToken()).isNotEqualTo(oldToken.getToken());
        }
    }

    // ─── deleteByTokenValue ───────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteByTokenValue()")
    class DeleteByTokenValue {

        @Test
        @DisplayName("delegates to repository deleteByToken")
        void happyPath() {
            refreshTokenService.deleteByTokenValue("some-token");
            verify(refreshTokenRepository).deleteByToken("some-token");
        }
    }

    // ─── deleteAllByUser ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteAllByUser()")
    class DeleteAllByUser {

        @Test
        @DisplayName("delegates to repository deleteAllByUser")
        void happyPath() {
            refreshTokenService.deleteAllByUser(user);
            verify(refreshTokenRepository).deleteAllByUser(user);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private RefreshToken validToken() {
        return RefreshToken.builder()
                .user(user)
                .token("valid-token")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .deviceInfo("Chrome")
                .build();
    }
}