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

    @Value("${admin.city:Surat}")
    private String adminCity;

    @Value("${admin.country:India}")
    private String adminCountry;

    @Value("${admin.phone:9876543210}")
    private String adminPhone;

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
                .city(adminCity)
                .country(adminCountry)
                .phoneNumber(adminPhone)
                .emailVerified(true)
                .enabled(true)
                .provider("local")
                .roles(Set.of(adminRole, userRole))
                .build();

        userRepository.save(admin);
        log.info("Default admin created: {}", admin.getEmail());
    }
}