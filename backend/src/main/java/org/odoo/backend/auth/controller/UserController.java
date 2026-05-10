package org.odoo.backend.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.odoo.backend.auth.dto.ApiResponse;
import org.odoo.backend.auth.dto.ChangePasswordRequest;
import org.odoo.backend.auth.dto.UpdateProfileRequest;
import org.odoo.backend.auth.dto.UserDTO;
import org.odoo.backend.auth.security.CookieService;
import org.odoo.backend.auth.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "Authenticated user self-service operations")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final AuthService authService;
    private final CookieService cookieService;

    @Operation(summary = "Get current user's full profile")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getMe(Authentication authentication) {
        UserDTO dto = authService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(new ApiResponse(true, "Profile retrieved", dto));
    }

    @Operation(summary = "Update current user's profile (name, avatar)")
    @PatchMapping("/me")
    public ResponseEntity<ApiResponse> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(authentication.getName(), request));
    }

    @Operation(summary = "Change password — revokes all other active sessions")
    @PostMapping("/me/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletResponse httpResponse) {

        ApiResponse result = authService.changePassword(authentication.getName(), request);

        // Password changed → all sessions revoked; clear the refresh token cookie
        ResponseCookie clearCookie = cookieService.clearRefreshTokenCookie();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Logout from all devices — revokes all refresh tokens")
    @DeleteMapping("/me/sessions")
    public ResponseEntity<ApiResponse> logoutAll(
            Authentication authentication,
            HttpServletResponse httpResponse) {

        ApiResponse result = authService.logoutAll(authentication.getName());

        // Clear cookie for current browser session too
        ResponseCookie clearCookie = cookieService.clearRefreshTokenCookie();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        return ResponseEntity.ok(result);
    }
}