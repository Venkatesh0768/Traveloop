package org.odoo.backend.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.odoo.backend.auth.dto.*;
import org.odoo.backend.auth.exception.AccountLockedException;
import org.odoo.backend.auth.exception.EmailAlreadyExistsException;
import org.odoo.backend.auth.exception.EmailNotVerifiedException;
import org.odoo.backend.auth.exception.UserNotFoundException;
import org.odoo.backend.auth.model.RefreshToken;
import org.odoo.backend.auth.model.Role;
import org.odoo.backend.auth.model.RoleType;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.RoleRepository;
import org.odoo.backend.auth.repository.UserRepository;
import org.odoo.backend.auth.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Core authentication service.
 *
 * <h3>Responsibilities</h3>
 * <ul>
 *   <li>Signup with OTP email verification</li>
 *   <li>Login with brute-force lockout</li>
 *   <li>Password reset / change</li>
 *   <li>Profile management</li>
 * </ul>
 *
 * <h3>What this service does NOT do</h3>
 * <ul>
 *   <li><b>Refresh token CRUD</b> → delegated to {@link RefreshTokenService}</li>
 *   <li><b>OTP generation/validation</b> → delegated to {@link OTPService}</li>
 *   <li><b>Cookie building</b> → delegated to
 *       {@code org.blog.backend.auth.security.CookieService} (called from controller)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final OTPService otpService;
    private final RefreshTokenService refreshTokenService;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    // ─── Signup ──────────────────────────────────────────────────────────────

    /**
     * Register a new local user, send OTP for email verification.
     *
     * @param request validated signup payload
     * @return success envelope (no tokens — user must verify email first)
     */
    @Transactional
    public ApiResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already registered");
        }

        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default role ROLE_USER not found — did DataInitializer run?"));

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .emailVerified(false)
                .enabled(false)
                .provider("local")
                .build();

        user.getRoles().add(userRole);
        userRepository.save(user);

        otpService.generateAndSendOTP(user.getEmail());

        log.info("New user registered: {}", user.getEmail());
        return new ApiResponse(true,
                "Registration successful. Please check your email for the verification OTP.", null);
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * Authenticate with email/password; returns tokens on success.
     *
     * <p>The returned {@link AuthResponse} contains the access token and user
     * data.  The <b>refresh token</b> is returned separately so the controller
     * can place it in an HttpOnly cookie — it is deliberately absent from the
     * response body ({@link AuthResponse#getRefreshToken()} is not serialized).</p>
     *
     * @param request    validated login payload
     * @param deviceInfo truncated User-Agent from the request
     * @return access token + user info + raw refresh token for cookie
     */
    @Transactional
    public LoginResult login(LoginRequest request, String deviceInfo) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Invalid email or password"));

        // Brute-force check BEFORE attempting Spring Security authentication
        if (user.isAccountLocked()) {
            long minutesLeft = java.time.Duration.between(
                    LocalDateTime.now(), user.getAccountLockedUntil()).toMinutes() + 1;
            throw new AccountLockedException(
                    "Account temporarily locked due to too many failed attempts. " +
                            "Try again in " + minutesLeft + " minute(s).");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            // Reset counter on successful auth
            user.setFailedLoginAttempts(0);
            user.setAccountLockedUntil(null);
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            // Email must be verified for local accounts
            if (!user.isEmailVerified()) {
                throw new EmailNotVerifiedException("Please verify your email before logging in");
            }

            String accessToken = tokenProvider.generateToken(authentication);
            RefreshToken refresh = refreshTokenService.createRefreshToken(user, deviceInfo);

            log.info("User logged in: {} from device='{}'", user.getEmail(), deviceInfo);

            AuthResponse authResponse = AuthResponse.builder()
                    .accessToken(accessToken)
                    .expiresIn(jwtExpirationMs / 1000)
                    .user(convertToUserDTO(user))
                    .build();

            return new LoginResult(authResponse, refresh.getToken());

        } catch (BadCredentialsException | DisabledException ex) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                userRepository.save(user);
                log.warn("Account locked for user={} after {} failed attempts", user.getEmail(), attempts);
                throw new AccountLockedException(
                        "Account locked for " + LOCK_DURATION_MINUTES +
                                " minutes due to too many failed login attempts.");
            }

            userRepository.save(user);
            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            throw new BadCredentialsException(
                    "Invalid email or password. " + remaining + " attempt(s) remaining before lockout.");
        }
    }

    @Transactional
    public ApiResponse verifyOTP(OTPVerificationRequest request) {
        otpService.validateOTPOrThrow(request.getEmail(), request.getOtp());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);

        log.info("Email verified for user={}", user.getEmail());
        return new ApiResponse(true, "Email verified successfully. You can now log in.", null);
    }

    // ─── OTP Verification ────────────────────────────────────────────────────

    @Transactional
    public ApiResponse resendOTP(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        otpService.assertEmailNotYetVerified(user);
        otpService.generateAndSendOTP(email);

        return new ApiResponse(true, "OTP sent to " + email, null);
    }

    /**
     * Exchange a valid refresh token for a new access token.
     *
     * <p>Implements <b>refresh token rotation</b> — the old token is deleted
     * and a brand-new one is issued. This limits the blast radius if a token
     * is ever stolen: it becomes invalid after one use.</p>
     *
     * @param rawToken   the token value from the cookie
     * @param deviceInfo truncated User-Agent
     * @return new access token + new raw refresh token (for cookie rotation)
     */
    @Transactional
    public LoginResult refreshAccessToken(String rawToken, String deviceInfo) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(rawToken);
        User user = refreshToken.getUser();

        // Rotate the refresh token (old invalidated, new issued)
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken, deviceInfo);

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();
        String newAccessToken = tokenProvider.generateTokenFromUsername(user.getEmail(), roles);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(newAccessToken)
                .expiresIn(jwtExpirationMs / 1000)
                .user(convertToUserDTO(user))
                .build();

        return new LoginResult(authResponse, newRefreshToken.getToken());
    }

    // ─── Token Refresh ────────────────────────────────────────────────────────

    /**
     * Revoke a single session (single-device logout).
     *
     * @param rawToken the refresh token value from the cookie
     */
    @Transactional
    public ApiResponse logout(String rawToken) {
        refreshTokenService.deleteByTokenValue(rawToken);
        return new ApiResponse(true, "Logged out successfully", null);
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    /**
     * Revoke all sessions for a user (logout from all devices).
     *
     * @param email the authenticated user's email
     */
    @Transactional
    public ApiResponse logoutAll(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        refreshTokenService.deleteAllByUser(user);
        log.info("All sessions revoked for user={}", email);
        return new ApiResponse(true, "All sessions revoked successfully", null);
    }

    /**
     * Initiate password reset — always returns success to prevent user enumeration.
     */
    @Transactional
    public void requestPasswordReset(String email) {
        // Find user silently — do not reveal whether the email exists
        userRepository.findByEmail(email)
                .ifPresent(user -> otpService.generateAndSendPasswordResetOTP(email));
    }

    // ─── Password Reset ───────────────────────────────────────────────────────

    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {
        otpService.validateOTPOrThrow(request.getEmail(), request.getOtp());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Unlock account on password reset — good UX after lockout
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userRepository.save(user);

        // Invalidate all existing sessions — credentials changed
        refreshTokenService.deleteAllByUser(user);
        log.info("Password reset for user={} — all sessions revoked", user.getEmail());

        return new ApiResponse(true, "Password reset successful. Please log in with your new password.", null);
    }

    @Transactional
    public ApiResponse changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Security best practice: revoke all other sessions on password change
        refreshTokenService.deleteAllByUser(user);
        log.info("Password changed for user={} — all sessions revoked", user.getEmail());

        return new ApiResponse(true, "Password changed successfully. Please log in again.", null);
    }

    // ─── Change Password ─────────────────────────────────────────────────────

    @Transactional
    public ApiResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }
        userRepository.save(user);

        return new ApiResponse(true, "Profile updated successfully", convertToUserDTO(user));
    }

    // ─── Profile ─────────────────────────────────────────────────────────────

    /**
     * Fetch a user and return it as a {@link UserDTO}.
     * Used by controllers that need the current user's profile.
     */
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return convertToUserDTO(user);
    }

    public UserDTO convertToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .emailVerified(user.isEmailVerified())
                .enabled(user.isEnabled())
                .provider(user.getProvider())
                .profileImageUrl(user.getProfileImageUrl())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .build();
    }

    // ─── Shared mapper ───────────────────────────────────────────────────────

    /**
     * Immutable carrier for a login result: the serializable response body and
     * the raw refresh token that the controller places in an HttpOnly cookie.
     */
    public record LoginResult(AuthResponse authResponse, String rawRefreshToken) {
    }
}