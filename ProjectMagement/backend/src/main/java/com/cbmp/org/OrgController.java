package com.cbmp.org;

import com.cbmp.auth.JwtAuthFilter;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class OrgController {

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "admin", "project_manager", "engineer", "contractor", "accountant", "vendor"
    );

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public OrgController(
            UserRepository userRepository,
            CompanyRepository companyRepository,
            SubscriptionRepository subscriptionRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users(@RequestParam(required = false) String companyId) {
        List<UserEntity> list = companyId != null && !companyId.isBlank()
                ? userRepository.findByCompanyId(companyId)
                : userRepository.findAll();
        return list.stream().map(this::userToJson).collect(Collectors.toList());
    }

    @GetMapping("/users/{id}")
    public Map<String, Object> getUser(
            @PathVariable String id,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser currentUser
    ) {
        requireAdmin(currentUser);
        UserEntity u = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return userToJson(u);
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser currentUser
    ) {
        requireAdmin(currentUser);
        String name = requiredString(body, "name").trim();
        String email = requiredString(body, "email").trim().toLowerCase();
        String role = requiredString(body, "role");
        if (!ALLOWED_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        String pwd = requiredString(body, "password");
        if (pwd.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password too short");
        }
        String companyId = body.get("companyId") != null && !body.get("companyId").toString().isBlank()
                ? body.get("companyId").toString().trim()
                : currentUser.companyId();
        UserEntity u = new UserEntity();
        u.setId(UUID.randomUUID().toString());
        u.setName(name);
        u.setEmail(email);
        u.setRole(role);
        u.setCompanyId(companyId);
        u.setPasswordHash(passwordEncoder.encode(pwd));
        return userToJson(userRepository.save(u));
    }

    @PutMapping("/users/{id}")
    public Map<String, Object> updateUser(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser currentUser
    ) {
        requireAdmin(currentUser);
        UserEntity u = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.get("name") != null) {
            String n = body.get("name").toString().trim();
            if (!n.isEmpty()) {
                u.setName(n);
            }
        }
        if (body.get("email") != null) {
            String email = body.get("email").toString().trim().toLowerCase();
            if (!email.equalsIgnoreCase(u.getEmail()) && userRepository.existsByEmailIgnoreCase(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }
            u.setEmail(email);
        }
        if (body.get("role") != null) {
            String role = body.get("role").toString();
            if (!ALLOWED_ROLES.contains(role)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
            }
            u.setRole(role);
        }
        if (body.get("password") != null) {
            String p = body.get("password").toString();
            if (!p.isBlank()) {
                if (p.length() < 4) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password too short");
                }
                u.setPasswordHash(passwordEncoder.encode(p));
            }
        }
        if (body.get("companyId") != null && !body.get("companyId").toString().isBlank()) {
            u.setCompanyId(body.get("companyId").toString().trim());
        }
        return userToJson(userRepository.save(u));
    }

    @GetMapping("/companies/{id}")
    public Map<String, Object> company(@PathVariable String id) {
        return companyToJson(companyRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)));
    }

    @PutMapping("/companies/{id}")
    public Map<String, Object> updateCompany(@PathVariable String id, @RequestBody Map<String, Object> body) {
        CompanyEntity c = companyRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Object name = body.get("name");
        if (name != null) {
            String n = name.toString().trim();
            if (!n.isEmpty()) {
                c.setName(n);
                companyRepository.save(c);
            }
        }
        return companyToJson(c);
    }

    /** Static RBAC reference for the admin UI (same contract as frontend types). */
    @GetMapping("/roles/catalog")
    public List<Map<String, Object>> roleCatalog() {
        return List.of(
                Map.of("role", "admin", "access", "Full access", "description", "All permissions"),
                Map.of("role", "project_manager", "access", "Manage projects", "description", "Create, edit, assign projects and tasks"),
                Map.of("role", "engineer", "access", "Edit workflows", "description", "Modify workflow steps and designs"),
                Map.of("role", "contractor", "access", "Field updates", "description", "Update task status, upload media"),
                Map.of("role", "accountant", "access", "Finance", "description", "Invoices, payments, reports"),
                Map.of("role", "vendor", "access", "View + log", "description", "View assigned projects, log proof of work")
        );
    }

    @GetMapping("/companies/{companyId}/subscription")
    public Map<String, Object> subscription(@PathVariable String companyId) {
        return subscriptionRepository.findByCompanyId(companyId).map(this::subToJson).orElse(null);
    }

    private void requireAdmin(JwtAuthFilter.AuthUser currentUser) {
        if (currentUser == null || !"admin".equals(currentUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private String requiredString(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null || v.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing " + key);
        }
        return v.toString();
    }

    private Map<String, Object> companyToJson(CompanyEntity c) {
        return Map.of("id", c.getId(), "name", c.getName(), "subscriptionId", c.getSubscriptionId() != null ? c.getSubscriptionId() : "");
    }

    private Map<String, Object> userToJson(UserEntity u) {
        return Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "email", u.getEmail(),
                "role", u.getRole(),
                "companyId", u.getCompanyId()
        );
    }

    private Map<String, Object> subToJson(SubscriptionEntity s) {
        return Map.of(
                "id", s.getId(),
                "companyId", s.getCompanyId(),
                "plan", s.getPlan() != null ? s.getPlan() : "standard",
                "maxUsers", s.getMaxUsers() != null ? s.getMaxUsers() : 0,
                "maxProjects", s.getMaxProjects() != null ? s.getMaxProjects() : -1,
                "storageGB", s.getStorageGB() != null ? s.getStorageGB() : 0,
                "expiresAt", s.getExpiresAt() != null ? s.getExpiresAt() : "",
                "status", s.getStatus() != null ? s.getStatus() : "active"
        );
    }
}
