package org.odoo.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.odoo.backend.auth.dto.*;
import org.odoo.backend.auth.exception.*;
import org.odoo.backend.auth.model.RefreshToken;
import org.odoo.backend.auth.model.Role;
import org.odoo.backend.auth.model.RoleType;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.RoleRepository;
import org.odoo.backend.auth.repository.UserRepository;
import org.odoo.backend.auth.security.JwtTokenProvider;
import org.odoo.backend.auth.service.AuthService;
import org.odoo.backend.auth.service.OTPService;
import org.odoo.backend.auth.service.RefreshTokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService - Comprehensive Test Suite")
public class AuthServiceTest {

    @Mock
    private OTPService otpService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private Role userRole;
    private User testUser;
    private SignupRequest validSignupRequest;
    private LoginRequest validLoginRequest;

    @BeforeEach
    void setUp() {
        userRole = new Role();
        userRole.setName(RoleType.ROLE_USER);

        validSignupRequest = new SignupRequest("test@gmail.com", "SecurePass123!", "John", "Doe");
        validLoginRequest = new LoginRequest("test@gmail.com", "SecurePass123!");

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@gmail.com")
                .password("encoded_password")
                .firstName("John")
                .lastName("Doe")
                .emailVerified(true)
                .enabled(true)
                .provider("local")
                .roles(Set.of(userRole))
                .failedLoginAttempts(0)
                .createdAt(LocalDateTime.now())
                .build();
    }


    @Nested
    @DisplayName("Signup Tests")
    class SignupTests {

        @Test
        @DisplayName("✓ Should signup successfully and send OTP verification email")
        void shouldSignupSuccessfully() {
            // Arrange
            when(userRepository.existsByEmail(validSignupRequest.getEmail())).thenReturn(false);
            when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
            when(passwordEncoder.encode(validSignupRequest.getPassword())).thenReturn("encoded_password");

            // Act
            ApiResponse response = authService.signup(validSignupRequest);

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("Registration successful");
            verify(userRepository).save(any(User.class));
            verify(otpService).generateAndSendOTP(validSignupRequest.getEmail());
        }

        @Test
        @DisplayName("✗ Should throw exception when email already exists")
        void shouldThrowEmailAlreadyExistsException() {
            // Arrange
            when(userRepository.existsByEmail(validSignupRequest.getEmail())).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.signup(validSignupRequest))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessageContaining("Email already registered");

            verify(userRepository, never()).save(any(User.class));
            verify(otpService, never()).generateAndSendOTP(anyString());
        }

        @Test
        @DisplayName("✗ Should throw exception when default role not found")
        void shouldThrowExceptionWhenRoleNotFound() {
            // Arrange
            when(userRepository.existsByEmail(validSignupRequest.getEmail())).thenReturn(false);
            when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.signup(validSignupRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("ROLE_USER not found");
        }

        @Test
        @DisplayName("✓ Should create user with disabled status until email verification")
        void shouldCreateUserAsDisabledInitially() {
            // Arrange
            when(userRepository.existsByEmail(validSignupRequest.getEmail())).thenReturn(false);
            when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
            when(passwordEncoder.encode(validSignupRequest.getPassword())).thenReturn("encoded_password");

            // Act
            authService.signup(validSignupRequest);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.isEnabled()).isFalse();
            assertThat(savedUser.isEmailVerified()).isFalse();
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ OTP VERIFICATION TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("OTP Verification Tests")
    class OTPVerificationTests {

        @Test
        @DisplayName("✓ Should verify OTP and enable user account")
        void shouldVerifyOTPSuccessfully() {
            // Arrange
            OTPVerificationRequest otpRequest = new OTPVerificationRequest("test@gmail.com", "123456");
            doNothing().when(otpService).validateOTPOrThrow("test@gmail.com", "123456");
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));

            // Act
            ApiResponse response = authService.verifyOTP(otpRequest);

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("Email verified successfully");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.isEmailVerified()).isTrue();
            assertThat(savedUser.isEnabled()).isTrue();
        }

        @Test
        @DisplayName("✗ Should throw exception when OTP is invalid")
        void shouldThrowExceptionWhenOTPInvalid() {
            // Arrange
            OTPVerificationRequest otpRequest = new OTPVerificationRequest("test@gmail.com", "invalid");
            doThrow(new InvalidTokenException("Invalid OTP"))
                    .when(otpService).validateOTPOrThrow("test@gmail.com", "invalid");

            // Act & Assert
            assertThatThrownBy(() -> authService.verifyOTP(otpRequest))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("Invalid OTP");
        }

        @Test
        @DisplayName("✓ Should resend OTP to unverified email")
        void shouldResendOTPSuccessfully() {
            // Arrange
            User unverifiedUser = User.builder()
                    .email("test@gmail.com")
                    .firstName("John")
                    .lastName("Doe")
                    .emailVerified(false)
                    .enabled(true)
                    .provider("local")
                    .build();
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(unverifiedUser));

            // Act
            ApiResponse response = authService.resendOTP("test@gmail.com");

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("OTP sent");
            verify(otpService).generateAndSendOTP("test@gmail.com");
        }

        @Test
        @DisplayName("✗ Should throw exception when resending OTP for already verified email")
        void shouldThrowExceptionWhenEmailAlreadyVerified() {
            // Arrange
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
            doThrow(new EmailAlreadyVerifiedException("Email already verified"))
                    .when(otpService).assertEmailNotYetVerified(testUser);

            // Act & Assert
            assertThatThrownBy(() -> authService.resendOTP("test@gmail.com"))
                    .isInstanceOf(EmailAlreadyVerifiedException.class);
        }

        @Test
        @DisplayName("✗ Should throw exception when user not found during OTP verification")
        void shouldThrowExceptionWhenUserNotFoundDuringOTPVerification() {
            // Arrange
            OTPVerificationRequest otpRequest = new OTPVerificationRequest("unknown@gmail.com", "123456");
            doNothing().when(otpService).validateOTPOrThrow("unknown@gmail.com", "123456");
            when(userRepository.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.verifyOTP(otpRequest))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ LOGIN TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("✓ Should login successfully with verified email")
        void shouldLoginSuccessfully() {
            // Arrange
            String deviceInfo = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
            RefreshToken mockRefreshToken = RefreshToken.builder()
                    .id(1L)
                    .token("refresh-token-uuid-123")
                    .user(testUser)
                    .expiryDate(LocalDateTime.now().plusDays(7))
                    .deviceInfo(deviceInfo)
                    .build();

            Authentication mockAuth = mock(Authentication.class);

            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
            when(authenticationManager.authenticate(any())).thenReturn(mockAuth);
            when(tokenProvider.generateToken(mockAuth)).thenReturn("access-token");
            when(refreshTokenService.createRefreshToken(testUser, deviceInfo))
                    .thenReturn(mockRefreshToken);

            // Act
            AuthService.LoginResult result = authService.login(validLoginRequest, deviceInfo);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.authResponse().getAccessToken()).isEqualTo("access-token");
            assertThat(result.rawRefreshToken()).isEqualTo("refresh-token-uuid-123");
            assertThat(result.authResponse().getUser().getEmail()).isEqualTo("test@gmail.com");
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("✗ Should fail login with unverified email")
        void shouldFailLoginWithUnverifiedEmail() {
            // Arrange
            User unverifiedUser = User.builder()
                    .email("test@gmail.com")
                    .firstName("John")
                    .lastName("Doe")
                    .emailVerified(false)
                    .enabled(false)
                    .provider("local")
                    .build();
            Authentication mockAuth = mock(Authentication.class);

            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(unverifiedUser));
            when(authenticationManager.authenticate(any())).thenReturn(mockAuth);

            // Act & Assert
            assertThatThrownBy(() -> authService.login(validLoginRequest, "device-info"))
                    .isInstanceOf(EmailNotVerifiedException.class)
                    .hasMessageContaining("verify your email");
        }

        @Test
        @DisplayName("✗ Should fail login with wrong password")
        void shouldFailLoginWithWrongPassword() {
            // Arrange
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Invalid credentials"));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(validLoginRequest, "device"))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("✗ Should lock account after 5 failed login attempts")
        void shouldLockAccountAfterMaxFailedAttempts() {
            // Arrange
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Invalid credentials"));

            // Act & Assert - First 4 attempts
            for (int i = 0; i < 4; i++) {
                assertThatThrownBy(() -> authService.login(validLoginRequest, "device"))
                        .isInstanceOf(BadCredentialsException.class);
            }

            // 5th attempt should lock
            assertThatThrownBy(() -> authService.login(validLoginRequest, "device"))
                    .isInstanceOf(AccountLockedException.class)
                    .hasMessageContaining("Account locked");
        }

        @Test
        @DisplayName("✗ Should fail login when account is locked")
        void shouldFailLoginWhenAccountLocked() {
            // Arrange
            User lockedUser = User.builder()
                    .email("test@gmail.com")
                    .firstName("John")
                    .lastName("Doe")
                    .emailVerified(true)
                    .enabled(true)
                    .provider("local")
                    .accountLockedUntil(LocalDateTime.now().plusMinutes(15))
                    .build();

            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(lockedUser));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(validLoginRequest, "device"))
                    .isInstanceOf(AccountLockedException.class)
                    .hasMessageContaining("Account temporarily locked");
        }

        @Test
        @DisplayName("✗ Should fail login when user not found")
        void shouldFailLoginWhenUserNotFound() {
            // Arrange
            when(userRepository.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());

            // Act & Assert
            LoginRequest unknownRequest = new LoginRequest("unknown@gmail.com", "password");
            assertThatThrownBy(() -> authService.login(unknownRequest, "device"))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("✓ Should reset failed attempts on successful login")
        void shouldResetFailedAttemptsOnSuccess() {
            // Arrange
            User userWithFailedAttempts = User.builder()
                    .email("test@gmail.com")
                    .firstName("John")
                    .lastName("Doe")
                    .emailVerified(true)
                    .enabled(true)
                    .provider("local")
                    .roles(Set.of(userRole))
                    .failedLoginAttempts(3)
                    .build();

            String deviceInfo = "Mozilla/5.0";
            RefreshToken mockRefreshToken = RefreshToken.builder()
                    .token("refresh-token")
                    .user(userWithFailedAttempts)
                    .expiryDate(LocalDateTime.now().plusDays(7))
                    .build();

            Authentication mockAuth = mock(Authentication.class);

            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(userWithFailedAttempts));
            when(authenticationManager.authenticate(any())).thenReturn(mockAuth);
            when(tokenProvider.generateToken(mockAuth)).thenReturn("access-token");
            when(refreshTokenService.createRefreshToken(userWithFailedAttempts, deviceInfo))
                    .thenReturn(mockRefreshToken);

            // Act
            authService.login(validLoginRequest, deviceInfo);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFailedLoginAttempts()).isZero();
            assertThat(savedUser.getAccountLockedUntil()).isNull();
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ REFRESH TOKEN TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Refresh Token Tests")
    class RefreshTokenTests {

        @Test
        @DisplayName("✓ Should refresh access token successfully with token rotation")
        void shouldRefreshAccessTokenSuccessfully() {
            // Arrange
            String oldRefreshToken = "old-refresh-token";
            String newRefreshToken = "new-refresh-token";
            String deviceInfo = "Mozilla/5.0";

            RefreshToken oldToken = RefreshToken.builder()
                    .token(oldRefreshToken)
                    .user(testUser)
                    .expiryDate(LocalDateTime.now().plusDays(7))
                    .build();

            RefreshToken newToken = RefreshToken.builder()
                    .token(newRefreshToken)
                    .user(testUser)
                    .expiryDate(LocalDateTime.now().plusDays(7))
                    .build();

            when(refreshTokenService.verifyRefreshToken(oldRefreshToken)).thenReturn(oldToken);
            when(refreshTokenService.rotateRefreshToken(oldToken, deviceInfo)).thenReturn(newToken);
            when(tokenProvider.generateTokenFromUsername("test@gmail.com", List.of("ROLE_USER")))
                    .thenReturn("new-access-token");

            // Act
            AuthService.LoginResult result = authService.refreshAccessToken(oldRefreshToken, deviceInfo);

            // Assert
            assertThat(result.authResponse().getAccessToken()).isEqualTo("new-access-token");
            assertThat(result.rawRefreshToken()).isEqualTo(newRefreshToken);
            verify(refreshTokenService).rotateRefreshToken(oldToken, deviceInfo);
        }

        @Test
        @DisplayName("✗ Should throw exception when refresh token is expired")
        void shouldThrowExceptionWhenRefreshTokenExpired() {
            // Arrange
            String expiredToken = "expired-token";
            when(refreshTokenService.verifyRefreshToken(expiredToken))
                    .thenThrow(new InvalidTokenException("Refresh token expired"));

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshAccessToken(expiredToken, "device"))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("✗ Should throw exception when refresh token is invalid")
        void shouldThrowExceptionWhenRefreshTokenInvalid() {
            // Arrange
            String invalidToken = "invalid-token";
            when(refreshTokenService.verifyRefreshToken(invalidToken))
                    .thenThrow(new InvalidTokenException("Invalid refresh token"));

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshAccessToken(invalidToken, "device"))
                    .isInstanceOf(InvalidTokenException.class);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ LOGOUT TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("✓ Should logout successfully (single device)")
        void shouldLogoutSuccessfully() {
            // Arrange
            String refreshToken = "refresh-token";

            // Act
            ApiResponse response = authService.logout(refreshToken);

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("Logged out successfully");
            verify(refreshTokenService).deleteByTokenValue(refreshToken);
        }

        @Test
        @DisplayName("✓ Should logout from all devices")
        void shouldLogoutFromAllDevices() {
            // Arrange
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));

            // Act
            ApiResponse response = authService.logoutAll("test@gmail.com");

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("All sessions revoked");
            verify(refreshTokenService).deleteAllByUser(testUser);
        }

        @Test
        @DisplayName("✗ Should throw exception when user not found during logoutAll")
        void shouldThrowExceptionWhenUserNotFoundForLogoutAll() {
            // Arrange
            when(userRepository.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.logoutAll("unknown@gmail.com"))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ PASSWORD RESET TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Password Reset Tests")
    class PasswordResetTests {

        @Test
        @DisplayName("✓ Should request password reset successfully")
        void shouldRequestPasswordResetSuccessfully() {
            // Arrange
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));

            // Act
            authService.requestPasswordReset("test@gmail.com");

            // Assert
            verify(otpService).generateAndSendPasswordResetOTP("test@gmail.com");
        }

        @Test
        @DisplayName("✓ Should silently succeed for non-existent email (security)")
        void shouldSilentlySucceedForNonExistentEmail() {
            // Arrange - prevents user enumeration
            when(userRepository.findByEmail("nonexistent@gmail.com")).thenReturn(Optional.empty());

            // Act
            authService.requestPasswordReset("nonexistent@gmail.com");

            // Assert
            verify(otpService, never()).generateAndSendPasswordResetOTP(anyString());
        }

        @Test
        @DisplayName("✓ Should reset password successfully and revoke all sessions")
        void shouldResetPasswordSuccessfully() {
            // Arrange
            ResetPasswordRequest resetRequest = new ResetPasswordRequest(
                    "test@gmail.com", "123456", "NewSecurePass123!"
            );

            doNothing().when(otpService).validateOTPOrThrow("test@gmail.com", "123456");
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.encode("NewSecurePass123!")).thenReturn("encoded_new_password");

            // Act
            ApiResponse response = authService.resetPassword(resetRequest);

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("Password reset successful");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFailedLoginAttempts()).isZero();
            assertThat(savedUser.getAccountLockedUntil()).isNull();

            verify(refreshTokenService).deleteAllByUser(testUser);
        }

        @Test
        @DisplayName("✗ Should throw exception when OTP invalid during password reset")
        void shouldThrowExceptionWhenOTPInvalidForReset() {
            // Arrange
            ResetPasswordRequest resetRequest = new ResetPasswordRequest(
                    "test@gmail.com", "invalid-otp", "NewPass123!"
            );

            doThrow(new InvalidTokenException("Invalid OTP"))
                    .when(otpService).validateOTPOrThrow("test@gmail.com", "invalid-otp");

            // Act & Assert
            assertThatThrownBy(() -> authService.resetPassword(resetRequest))
                    .isInstanceOf(InvalidTokenException.class);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ CHANGE PASSWORD TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Change Password Tests")
    class ChangePasswordTests {

        @Test
        @DisplayName("✓ Should change password successfully and revoke all sessions")
        void shouldChangePasswordSuccessfully() {
            // Arrange
            ChangePasswordRequest changeRequest = new ChangePasswordRequest(
                    "SecurePass123!", "NewSecurePass123!"
            );

            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("SecurePass123!", "encoded_password")).thenReturn(true);
            when(passwordEncoder.encode("NewSecurePass123!")).thenReturn("encoded_new_password");

            // Act
            ApiResponse response = authService.changePassword("test@gmail.com", changeRequest);

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("Password changed successfully");
            verify(userRepository).save(any(User.class));
            verify(refreshTokenService).deleteAllByUser(testUser);
        }

        @Test
        @DisplayName("✗ Should throw exception when current password is incorrect")
        void shouldThrowExceptionWhenCurrentPasswordIncorrect() {
            // Arrange
            ChangePasswordRequest changeRequest = new ChangePasswordRequest(
                    "WrongPassword", "NewSecurePass123!"
            );

            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("WrongPassword", "encoded_password")).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.changePassword("test@gmail.com", changeRequest))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Current password is incorrect");
        }

        @Test
        @DisplayName("✗ Should throw exception when user not found for password change")
        void shouldThrowExceptionWhenUserNotFoundForPasswordChange() {
            // Arrange
            ChangePasswordRequest changeRequest = new ChangePasswordRequest(
                    "OldPass", "NewPass"
            );
            when(userRepository.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.changePassword("unknown@gmail.com", changeRequest))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ PROFILE TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Profile Tests")
    class ProfileTests {

        @Test
        @DisplayName("✓ Should update user profile successfully")
        void shouldUpdateProfileSuccessfully() {
            // Arrange
            UpdateProfileRequest updateRequest = new UpdateProfileRequest(
                    "Jane", "Smith", "https://example.com/profile.jpg"
            );

            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));

            // Act
            ApiResponse response = authService.updateProfile("test@gmail.com", updateRequest);

            // Assert
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("Profile updated successfully");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFirstName()).isEqualTo("Jane");
            assertThat(savedUser.getLastName()).isEqualTo("Smith");
            assertThat(savedUser.getProfileImageUrl()).isEqualTo("https://example.com/profile.jpg");
        }

        @Test
        @DisplayName("✓ Should update only provided profile fields and skip null values")
        void shouldUpdateOnlyProvidedFields() {
            // Arrange
            UpdateProfileRequest updateRequest = new UpdateProfileRequest("Jane", null, null);
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));

            // Act
            authService.updateProfile("test@gmail.com", updateRequest);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFirstName()).isEqualTo("Jane");
            assertThat(savedUser.getLastName()).isEqualTo("Doe"); // Unchanged
        }

        @Test
        @DisplayName("✓ Should get user by email successfully")
        void shouldGetUserByEmailSuccessfully() {
            // Arrange
            when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(testUser));

            // Act
            UserDTO userDTO = authService.getUserByEmail("test@gmail.com");

            // Assert
            assertThat(userDTO).isNotNull();
            assertThat(userDTO.getEmail()).isEqualTo("test@gmail.com");
            assertThat(userDTO.getFirstName()).isEqualTo("John");
            assertThat(userDTO.getLastName()).isEqualTo("Doe");
            assertThat(userDTO.isEmailVerified()).isTrue();
        }

        @Test
        @DisplayName("✗ Should throw exception when user not found by email")
        void shouldThrowExceptionWhenUserNotFoundByEmail() {
            // Arrange
            when(userRepository.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.getUserByEmail("unknown@gmail.com"))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    // ▓▓▓▓▓ DTO CONVERSION TESTS ▓▓▓▓▓
    // ════════════════════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("DTO Conversion Tests")
    class DTOConversionTests {

        @Test
        @DisplayName("✓ Should convert User to UserDTO correctly")
        void shouldConvertUserToDTOSuccessfully() {
            // Act
            UserDTO userDTO = authService.convertToUserDTO(testUser);

            // Assert
            assertThat(userDTO.getId()).isEqualTo(testUser.getId());
            assertThat(userDTO.getEmail()).isEqualTo("test@gmail.com");
            assertThat(userDTO.getFirstName()).isEqualTo("John");
            assertThat(userDTO.getLastName()).isEqualTo("Doe");
            assertThat(userDTO.isEmailVerified()).isTrue();
            assertThat(userDTO.isEnabled()).isTrue();
            assertThat(userDTO.getProvider()).isEqualTo("local");
            assertThat(userDTO.getRoles()).contains("ROLE_USER");
            assertThat(userDTO.getCreatedAt()).isNotNull();
        }

        @Test
        @DisplayName("✓ Should convert User with multiple roles to UserDTO")
        void shouldConvertUserWithMultipleRolesToDTO() {
            // Arrange
            Role adminRole = new Role();
            adminRole.setName(RoleType.ROLE_ADMIN);

            User multiRoleUser = User.builder()
                    .id(testUser.getId())
                    .email(testUser.getEmail())
                    .firstName(testUser.getFirstName())
                    .lastName(testUser.getLastName())
                    .emailVerified(testUser.isEmailVerified())
                    .enabled(testUser.isEnabled())
                    .provider(testUser.getProvider())
                    .roles(Set.of(userRole, adminRole))
                    .createdAt(testUser.getCreatedAt())
                    .build();

            // Act
            UserDTO userDTO = authService.convertToUserDTO(multiRoleUser);

            // Assert
            assertThat(userDTO.getRoles())
                    .contains("ROLE_USER", "ROLE_ADMIN")
                    .hasSize(2);
        }
    }

}














