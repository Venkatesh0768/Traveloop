package org.odoo.backend.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.auth.dto.*;
import org.odoo.backend.auth.exception.InvalidTokenException;
import org.odoo.backend.auth.security.CookieService;
import org.odoo.backend.auth.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Authentication", description = "User registration, login, OTP, and token management")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieService cookieService;


    @Operation(summary = "Register a new user account")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    @Operation(summary = "Verify email address using OTP sent during signup")
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOTP(@Valid @RequestBody OTPVerificationRequest request) {
        return ResponseEntity.ok(authService.verifyOTP(request));
    }

    @Operation(summary = "Resend verification OTP to email")
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOTP(@RequestParam String email) {
        return ResponseEntity.ok(authService.resendOTP(email));
    }

    @Operation(summary = "Login with email and password — sets HttpOnly refresh token cookie")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = resolveDeviceInfo(httpRequest);
        AuthService.LoginResult result = authService.login(request, deviceInfo);

        ResponseCookie cookie = cookieService.createRefreshTokenCookie(result.rawRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.authResponse());
    }

    @Operation(summary = "Rotate refresh token cookie and issue new access token")
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String rawToken = cookieService.extractRefreshTokenFromCookie(httpRequest);
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidTokenException("Refresh token cookie is missing. Please log in again.");
        }

        String deviceInfo = resolveDeviceInfo(httpRequest);
        AuthService.LoginResult result = authService.refreshAccessToken(rawToken, deviceInfo);

        ResponseCookie newCookie = cookieService.createRefreshTokenCookie(result.rawRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newCookie.toString())
                .body(result.authResponse());
    }


    @Operation(summary = "Logout — revokes the refresh token and clears the cookie")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(HttpServletRequest httpRequest) {
        String rawToken = cookieService.extractRefreshTokenFromCookie(httpRequest);

        if (rawToken != null && !rawToken.isBlank()) {
            authService.logout(rawToken);
        }

        ResponseCookie clearCookie = cookieService.clearRefreshTokenCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(new ApiResponse(true, "Logged out successfully", null));
    }

    @Operation(summary = "Request a password reset OTP")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(value = "email", required = false) String emailParam) {

        String email = (body != null) ? body.get("email") : null;
        if (email == null || email.isBlank()) email = emailParam;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Email is required", null));
        }

        // Always return 200 — do not reveal whether the account exists
        authService.requestPasswordReset(email.trim());
        return ResponseEntity.ok(new ApiResponse(true,
                "If an account with that email exists, a reset OTP has been sent.", null));
    }

    @Operation(summary = "Reset password using OTP received by email")
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletResponse httpResponse) {

        ApiResponse result = authService.resetPassword(request);

        // Clear refresh token cookie — all sessions were revoked on password reset
        ResponseCookie clearCookie = cookieService.clearRefreshTokenCookie();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        return ResponseEntity.ok(result);
    }


    private String resolveDeviceInfo(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        if (ua == null) return "unknown";
        return ua.length() > 255 ? ua.substring(0, 255) : ua;
    }
}
