package org.odoo.backend.auth.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Factory for {@link ResponseCookie} objects that carry the refresh token.
 *
 * <h3>Security attributes applied</h3>
 * <ul>
 *   <li><b>HttpOnly</b> — JavaScript cannot read the cookie (XSS mitigation).</li>
 *   <li><b>Secure</b> — Cookie is only sent over HTTPS (configurable per env).</li>
 *   <li><b>SameSite</b> — Controls cross-site sending; {@code Strict} in prod.</li>
 *   <li><b>Path</b> — Cookie is scoped to a specific path, reducing exposure.</li>
 * </ul>
 *
 * <p>All values are driven by {@link CookieProperties} — no hard-coding.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CookieService {

    /** Name used for the refresh-token cookie. Defined once here — nowhere else. */
    public static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

    private final CookieProperties cookieProperties;

    /**
     * Build an HttpOnly, Secure {@link ResponseCookie} carrying the given
     * {@code refreshToken} value.
     *
     * @param token the opaque refresh-token string
     * @return a fully-configured {@link ResponseCookie} ready to be added to the response
     */
    public ResponseCookie createRefreshTokenCookie(String token) {
        log.debug("Creating refresh token cookie (secure={}, sameSite={})",
                cookieProperties.isSecure(), cookieProperties.getSameSite());

        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                .from(REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .path(cookieProperties.getPath())
                .maxAge(cookieProperties.getMaxAgeSeconds());

        if (StringUtils.hasText(cookieProperties.getDomain())) {
            builder.domain(cookieProperties.getDomain());
        }

        return builder.build();
    }

    /**
     * Build a <em>clearing</em> cookie with {@code Max-Age=0}.
     *
     * <p>When added to a response, the browser will immediately expire and
     * delete the refresh-token cookie on the client side.</p>
     *
     * @return a zero-lifetime {@link ResponseCookie}
     */
    public ResponseCookie clearRefreshTokenCookie() {
        log.debug("Clearing refresh token cookie");

        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                .from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .path(cookieProperties.getPath())
                .maxAge(0L); // instructs browser to delete immediately

        if (StringUtils.hasText(cookieProperties.getDomain())) {
            builder.domain(cookieProperties.getDomain());
        }

        return builder.build();
    }

    /**
     * Extract the refresh-token value from an incoming request's cookies.
     *
     * @param request the current HTTP request
     * @return the raw token string, or {@code null} if the cookie is absent
     */
    public String extractRefreshTokenFromCookie(jakarta.servlet.http.HttpServletRequest request) {
        if (request.getCookies() == null) return null;

        for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
            if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
