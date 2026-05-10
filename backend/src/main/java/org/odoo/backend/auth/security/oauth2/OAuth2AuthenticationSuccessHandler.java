package org.odoo.backend.auth.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.odoo.backend.auth.model.RefreshToken;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.security.CookieService;
import org.odoo.backend.auth.security.JwtTokenProvider;
import org.odoo.backend.auth.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Called by Spring Security after a successful OAuth2 authentication.
 *
 * <h3>Token strategy</h3>
 * <ul>
 *   <li>Access token → query parameter in the redirect URL
 *       (short-lived, needed by the SPA to bootstrap)</li>
 *   <li>Refresh token → {@code Set-Cookie: refreshToken=...; HttpOnly; Secure}
 *       (long-lived, browser stores and sends automatically)</li>
 * </ul>
 *
 * <p>The refresh token is never exposed in the URL or the JSON body,
 * preventing leakage via Referrer headers or browser history.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider    tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final CookieService       cookieService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest  request,
            HttpServletResponse response,
            Authentication      authentication) throws IOException {

        OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();

        // Short-lived access token (embedded in redirect URL, decoded by SPA)
        String accessToken = tokenProvider.generateTokenForUser(user);

        // Long-lived refresh token → HttpOnly cookie
        String deviceInfo = truncateUserAgent(request.getHeader("User-Agent"));
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(refreshToken.getToken());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("token", accessToken)
                .build()
                .toUriString();

        log.info("OAuth2 login success for user={} provider={}", user.getEmail(), user.getProvider());
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String truncateUserAgent(String userAgent) {
        if (userAgent == null) return "unknown";
        return userAgent.length() > 255 ? userAgent.substring(0, 255) : userAgent;
    }
}
