package org.odoo.backend.auth.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Strongly-typed binding for {@code app.cookie.*} properties.
 *
 * <p>Injected into {@link CookieService} to produce environment-specific cookies
 * without hard-coding values in Java code.</p>
 *
 * <pre>
 * # application-dev.yml
 * app.cookie:
 *   secure: false
 *   same-site: Lax
 *   domain: localhost
 *   max-age-seconds: 604800
 *   path: /
 *
 * # application-prod.yml
 * app.cookie:
 *   secure: true
 *   same-site: Strict
 *   domain: ${COOKIE_DOMAIN}
 *   max-age-seconds: 604800
 *   path: /
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "app.cookie")
@Getter
@Setter
public class CookieProperties {

    /**
     * Whether the {@code Secure} flag is set on cookies.
     * Must be {@code true} in production (HTTPS-only).
     */
    private boolean secure = true;

    /**
     * Value for the {@code SameSite} attribute.
     * Use {@code Strict} in production; {@code Lax} in development
     * (Strict blocks OAuth2 redirect cookies).
     */
    private String sameSite = "Strict";

    /**
     * Cookie domain. Leave blank to use the request's domain automatically.
     */
    private String domain = "";

    /**
     * Cookie lifetime in <em>seconds</em> (not milliseconds).
     * Default: 7 days (604800 s).
     */
    private long maxAgeSeconds = 604_800L;

    /**
     * Cookie path. Restricts which requests send the cookie.
     * Default {@code /} sends it on every request to the origin.
     */
    private String path = "/";
}
