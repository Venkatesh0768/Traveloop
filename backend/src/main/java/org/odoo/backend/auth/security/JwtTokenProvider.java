package org.odoo.backend.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.odoo.backend.auth.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.List;

/**
 * Encapsulates all JWT token operations: generation, parsing, and validation.
 *
 * <h3>Key derivation (production-grade)</h3>
 * <p>The secret is expected to be a <b>Base64-encoded</b> byte array of at
 * least 256 bits (32 bytes).  {@code getBytes()} on a short UTF-8 string would
 * produce a weak key and is therefore rejected at startup by
 * .</p>
 *
 * <pre>
 * # Generate a suitable secret:
 * openssl rand -base64 64
 * </pre>
 *
 * <h3>Claims embedded in the token</h3>
 * <ul>
 *   <li>{@code sub} — user's email address</li>
 *   <li>{@code roles} — list of role strings (e.g. {@code ["ROLE_USER"]})</li>
 *   <li>{@code iat} / {@code exp} — standard issued-at / expiry</li>
 * </ul>
 *
 * <p>Roles are embedded so that the {@link JwtAuthenticationFilter} can
 * reconstruct the Spring Security {@code Authentication} object without an
 * extra database round-trip per request.</p>
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private static final int MINIMUM_KEY_BYTES = 32; // 256 bits

    private static final int GENERATED_KEY_BYTES = 64;

    private final Environment environment;

    public JwtTokenProvider(Environment environment) {
        this.environment = environment;
    }

    @Value("${jwt.secret:}")
    private String jwtSecretBase64;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    private SecretKey signingKey;

    /**
     * Initialize the signing key at startup using one of two strategies:
     *
     * <ol>
     *   <li><b>Base64 path (preferred)</b> — if {@code jwt.secret} is a valid
     *       Base64 string, decode it and use the resulting bytes.  This is the
     *       correct production approach; generate with {@code openssl rand -base64 64}.</li>
     *   <li><b>UTF-8 fallback</b> — if the value is <em>not</em> valid Base64
     *       (e.g. a legacy plain-text secret), treat the raw bytes of the string
     *       as the key.  A warning is logged so operators know to migrate.</li>
     * </ol>
     *
     * <p>In both cases the derived key must be at least 256 bits (32 bytes) — the
     * minimum for HMAC-SHA-256 as mandated by the JWT specification.  The
     * application fails fast with a descriptive error if this is not met.</p>
     */
    @PostConstruct
    void initSigningKey() {
        if (!StringUtils.hasText(jwtSecretBase64)) {
            initializeMissingSecretFallback();
            return;
        }

        byte[] keyBytes;

        try {
            keyBytes = Base64.getDecoder().decode(jwtSecretBase64);
            log.info("JWT signing key loaded from Base64 ({} bytes)", keyBytes.length);
        } catch (IllegalArgumentException e) {
            // Not valid Base64 — treat as a raw UTF-8 secret (legacy / dev mode)
            keyBytes = jwtSecretBase64.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            log.warn("jwt.secret is not Base64 — falling back to raw UTF-8 bytes ({} bytes). " +
                     "For production, generate a proper key with: openssl rand -base64 64", keyBytes.length);
        }

        if (keyBytes.length < MINIMUM_KEY_BYTES) {
            throw new IllegalStateException(String.format(
                    "JWT secret is too short (%d bytes). Minimum is %d bytes (256 bits). " +
                    "Generate a secure key with: openssl rand -base64 64",
                    keyBytes.length, MINIMUM_KEY_BYTES));
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private void initializeMissingSecretFallback() {
        if (isProdProfileActive()) {
            throw new IllegalStateException(
                    "Missing JWT signing secret: configure 'jwt.secret' (or env JWT_SECRET) in production.");
        }

        byte[] generatedKey = new byte[GENERATED_KEY_BYTES];
        new SecureRandom().nextBytes(generatedKey);
        this.signingKey = Keys.hmacShaKeyFor(generatedKey);
        log.warn("jwt.secret is not configured; generated an ephemeral signing key for non-production profile. " +
                 "Tokens will be invalidated on every restart.");
    }

    private boolean isProdProfileActive() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile));
    }

    // ─── Token generation ────────────────────────────────────────────────────

    /**
     * Generate a JWT from a Spring Security {@link Authentication} (email+password login).
     */
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        return buildToken(userDetails.getUsername(), roles);
    }

    /**
     * Generate a JWT from a raw email string + role list (used during token refresh).
     */
    public String generateTokenFromUsername(String email, List<String> roles) {
        return buildToken(email, roles);
    }

    /**
     * Generate a JWT from a {@link User} entity (used by OAuth2 success handler).
     */
    public String generateTokenForUser(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();
        return buildToken(user.getEmail(), roles);
    }

    // ─── Token parsing ───────────────────────────────────────────────────────

    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Object roles = getClaims(token).get("roles");
        if (roles instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (SignatureException e) {
            log.warn("JWT signature invalid — possible tampering");
        } catch (MalformedJwtException e) {
            log.warn("JWT malformed: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT validation error: {}", e.getMessage());
        }
        return false;
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    private String buildToken(String subject, List<String> roles) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(subject)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
