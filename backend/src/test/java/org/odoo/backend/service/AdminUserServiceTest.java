package org.odoo.backend.service;

import org.odoo.backend.auth.dto.ApiResponse;
import org.odoo.backend.auth.dto.AssignRolesRequest;
import org.odoo.backend.auth.dto.UserDTO;
import org.odoo.backend.auth.exception.UserNotFoundException;
import org.odoo.backend.auth.model.Role;
import org.odoo.backend.auth.model.RoleType;
import org.odoo.backend.auth.model.User;
import org.odoo.backend.auth.repository.RoleRepository;
import org.odoo.backend.auth.repository.UserRepository;
import org.odoo.backend.auth.service.AdminUserService;
import org.odoo.backend.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserService")
class AdminUserServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    RoleRepository roleRepository;
    @Mock
    AuthService authService;

    @InjectMocks
    AdminUserService adminUserService;

    private UUID userId;
    private User adminUser;
    private Role adminRole;
    private Role userRole;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        adminRole = new Role();
        adminRole.setName(RoleType.ROLE_ADMIN);

        userRole = new Role();
        userRole.setName(RoleType.ROLE_USER);

        adminUser = User.builder()
                .id(userId)
                .email("admin@example.com")
                .roles(new HashSet<>(Set.of(adminRole)))
                .enabled(true)
                .build();
    }

    // ─── getAllUsers ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getAllUsers()")
    class GetAllUsers {

        @Test
        @DisplayName("returns paginated DTOs mapped via AuthService")
        void happyPath() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(adminUser));
            UserDTO dto = new UserDTO();

            when(userRepository.findAll(pageable)).thenReturn(userPage);
            when(authService.convertToUserDTO(adminUser)).thenReturn(dto);

            Page<UserDTO> result = adminUserService.getAllUsers(pageable);

            assertThat(result).hasSize(1);
            assertThat(result.getContent().get(0)).isEqualTo(dto);
        }

        @Test
        @DisplayName("returns empty page when no users exist")
        void emptyPage() {
            Pageable pageable = PageRequest.of(0, 10);
            when(userRepository.findAll(pageable)).thenReturn(Page.empty());

            Page<UserDTO> result = adminUserService.getAllUsers(pageable);

            assertThat(result).isEmpty();
        }
    }

    // ─── getUserById ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getUserById()")
    class GetUserById {

        @Test
        @DisplayName("returns DTO when user is found")
        void happyPath() {
            UserDTO dto = new UserDTO();
            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
            when(authService.convertToUserDTO(adminUser)).thenReturn(dto);

            assertThat(adminUserService.getUserById(userId)).isEqualTo(dto);
        }

        @Test
        @DisplayName("throws UserNotFoundException when user does not exist")
        void userNotFound() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.getUserById(userId))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining(userId.toString());
        }
    }

    // ─── assignRoles ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("assignRoles()")
    class AssignRoles {

        @Test
        @DisplayName("replaces roles successfully for a non-last admin")
        void happyPath() {
            AssignRolesRequest request = new AssignRolesRequest();
            request.setRoles(Set.of("ROLE_USER"));

            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
            when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
            when(userRepository.countByRoleName(RoleType.ROLE_ADMIN)).thenReturn(2L); // 2 admins → safe
            when(userRepository.save(adminUser)).thenReturn(adminUser);
            when(authService.convertToUserDTO(adminUser)).thenReturn(new UserDTO());

            ApiResponse response = adminUserService.assignRoles(userId, request);

            assertThat(response.isSuccess()).isTrue();
            assertThat(adminUser.getRoles()).containsExactly(userRole);
        }

        @Test
        @DisplayName("throws IllegalStateException when removing the last admin")
        void preventRemovingLastAdmin() {
            AssignRolesRequest request = new AssignRolesRequest();
            request.setRoles(Set.of("ROLE_USER"));

            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
            when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
            when(userRepository.countByRoleName(RoleType.ROLE_ADMIN)).thenReturn(1L); // last admin

            assertThatThrownBy(() -> adminUserService.assignRoles(userId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("last ADMIN");
        }

        @Test
        @DisplayName("throws UserNotFoundException when user does not exist")
        void userNotFound() {
            AssignRolesRequest request = new AssignRolesRequest();
            request.setRoles(Set.of("ROLE_USER"));

            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.assignRoles(userId, request))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("throws IllegalArgumentException for unknown role name")
        void unknownRole() {
            AssignRolesRequest request = new AssignRolesRequest();
            request.setRoles(Set.of("ROLE_HACKER"));

            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));

            assertThatThrownBy(() -> adminUserService.assignRoles(userId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid role");
        }

        @Test
        @DisplayName("skips admin-count check when user was not previously admin")
        void nonAdminGetsNewRole() {
            User regularUser = User.builder()
                    .id(userId)
                    .email("user@example.com")
                    .roles(new HashSet<>(Set.of(userRole)))
                    .enabled(true)
                    .build();

            AssignRolesRequest request = new AssignRolesRequest();
            request.setRoles(Set.of("ROLE_USER"));

            when(userRepository.findById(userId)).thenReturn(Optional.of(regularUser));
            when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
            when(userRepository.save(regularUser)).thenReturn(regularUser);
            when(authService.convertToUserDTO(regularUser)).thenReturn(new UserDTO());

            ApiResponse response = adminUserService.assignRoles(userId, request);

            assertThat(response.isSuccess()).isTrue();
            // Admin count never queried since user wasn't admin
            verify(userRepository, never()).countByRoleName(RoleType.ROLE_ADMIN);
        }
    }

    // ─── setUserStatus ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("setUserStatus()")
    class SetUserStatus {

        @Test
        @DisplayName("enables a disabled user and returns success response")
        void enableUser() {
            adminUser.setEnabled(false);
            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
            when(userRepository.save(adminUser)).thenReturn(adminUser);
            when(authService.convertToUserDTO(adminUser)).thenReturn(new UserDTO());

            ApiResponse response = adminUserService.setUserStatus(userId, true);

            assertThat(adminUser.isEnabled()).isTrue();
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("enabled");
        }

        @Test
        @DisplayName("disables an enabled user and returns success response")
        void disableUser() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
            when(userRepository.save(adminUser)).thenReturn(adminUser);
            when(authService.convertToUserDTO(adminUser)).thenReturn(new UserDTO());

            ApiResponse response = adminUserService.setUserStatus(userId, false);

            assertThat(adminUser.isEnabled()).isFalse();
            assertThat(response.getMessage()).contains("disabled");
        }

        @Test
        @DisplayName("throws UserNotFoundException when user does not exist")
        void userNotFound() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.setUserStatus(userId, false))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // ─── deleteUser ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteUser()")
    class DeleteUser {

        @Test
        @DisplayName("soft deletes a regular user (sets enabled=false)")
        void softDeleteRegularUser() {
            User regularUser = User.builder()
                    .id(userId)
                    .email("user@example.com")
                    .roles(new HashSet<>(Set.of(userRole)))
                    .enabled(true)
                    .build();

            when(userRepository.findById(userId)).thenReturn(Optional.of(regularUser));
            when(userRepository.save(regularUser)).thenReturn(regularUser);

            ApiResponse response = adminUserService.deleteUser(userId);

            assertThat(regularUser.isEnabled()).isFalse();
            assertThat(response.isSuccess()).isTrue();
        }

        @Test
        @DisplayName("prevents soft-deleting the last admin")
        void preventDeletingLastAdmin() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
            when(userRepository.countByRoleName(RoleType.ROLE_ADMIN)).thenReturn(1L);

            assertThatThrownBy(() -> adminUserService.deleteUser(userId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("last ADMIN");
        }

        @Test
        @DisplayName("allows soft-deleting an admin when others remain")
        void deleteAdminWhenOthersExist() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
            when(userRepository.countByRoleName(RoleType.ROLE_ADMIN)).thenReturn(2L);
            when(userRepository.save(adminUser)).thenReturn(adminUser);

            ApiResponse response = adminUserService.deleteUser(userId);

            assertThat(adminUser.isEnabled()).isFalse();
            assertThat(response.isSuccess()).isTrue();
        }

        @Test
        @DisplayName("throws UserNotFoundException when user does not exist")
        void userNotFound() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.deleteUser(userId))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // ─── getDashboardStats ────────────────────────────────────────────────────

    @Nested
    @DisplayName("getDashboardStats()")
    class GetDashboardStats {

        @Test
        @DisplayName("returns map with totalUsers, enabledUsers, and adminCount")
        void happyPath() {
            when(userRepository.count()).thenReturn(50L);
            when(userRepository.countByEnabledTrue()).thenReturn(45L);
            when(userRepository.countByRoleName(RoleType.ROLE_ADMIN)).thenReturn(3L);

            Map<String, Object> stats = adminUserService.getDashboardStats();

            assertThat(stats)
                    .containsEntry("totalUsers", 50L)
                    .containsEntry("enabledUsers", 45L)
                    .containsEntry("adminCount", 3L);
        }

        @Test
        @DisplayName("returns zeros when no users exist")
        void emptyDatabase() {
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByEnabledTrue()).thenReturn(0L);
            when(userRepository.countByRoleName(RoleType.ROLE_ADMIN)).thenReturn(0L);

            Map<String, Object> stats = adminUserService.getDashboardStats();

            assertThat(stats).containsEntry("totalUsers", 0L);
        }
    }
}