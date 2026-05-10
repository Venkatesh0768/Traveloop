package org.odoo.backend.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.odoo.backend.auth.model.Role;
import org.odoo.backend.auth.model.RoleType;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.RoleRepository;
import org.odoo.backend.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Runs once at startup to seed required reference data.
 *
 * <h3>What it seeds</h3>
 * <ol>
 *   <li><b>Roles</b> — ensures ROLE_USER, ROLE_ADMIN, ROLE_VENDOR exist in the DB.</li>
 *   <li><b>Default Admin</b> — if no admin user exists, creates one from the
 *       {@code ADMIN_EMAIL} / {@code ADMIN_PASSWORD} environment variables.
 *       Safe to run on every startup — skipped if an admin already exists.</li>
 * </ol>
 *
 * <h3>Environment variables</h3>
 * <pre>
 * ADMIN_EMAIL=admin@yourdomain.com
 * ADMIN_PASSWORD=StrongPass@1234
 * ADMIN_FIRST_NAME=Super          # optional, default: "Super"
 * ADMIN_LAST_NAME=Admin           # optional, default: "Admin"
 * </pre>
 *
 * <p>If {@code ADMIN_EMAIL} is not set the admin seeding step is skipped
 * silently — useful for environments where you manage admins via SQL or API.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository    roleRepository;
    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Value("${admin.first-name:Super}")
    private String adminFirstName;

    @Value("${admin.last-name:Admin}")
    private String adminLastName;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedDefaultAdmin();
    }

    // ─── Step 1: Roles ───────────────────────────────────────────────────────

    private void seedRoles() {
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                Role role = new Role();
                role.setName(roleType);
                roleRepository.save(role);
                log.info("Seeded role: {}", roleType);
            }
        }
    }

    // ─── Step 2: Default Admin ───────────────────────────────────────────────

    private void seedDefaultAdmin() {
        if (adminEmail == null || adminEmail.isBlank()) {
            log.debug("ADMIN_EMAIL not set — skipping default admin seed");
            return;
        }

        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("ADMIN_EMAIL is set but ADMIN_PASSWORD is blank — skipping admin seed");
            return;
        }

        // Idempotent: skip if ANY admin already exists
        if (userRepository.countByRoleName(RoleType.ROLE_ADMIN) > 0) {
            log.debug("Admin user already exists — skipping default admin seed");
            return;
        }

        Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found — did seedRoles() run?"));
        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseThrow(() -> new IllegalStateException("ROLE_USER not found — did seedRoles() run?"));

        User admin = User.builder()
                .email(adminEmail.trim().toLowerCase())
                .password(passwordEncoder.encode(adminPassword))
                .firstName(adminFirstName)
                .lastName(adminLastName)
                .emailVerified(true)   // Admin is pre-verified
                .enabled(true)
                .provider("local")
                .roles(Set.of(adminRole, userRole))
                .build();

        userRepository.save(admin);
        log.info("Default admin created: {}", admin.getEmail());
    }
}