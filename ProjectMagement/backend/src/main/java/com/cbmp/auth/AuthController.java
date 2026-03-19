package com.cbmp.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    private static final Map<String, UserData> USERS = Map.of(
            "admin@cbmp.com", new UserData("1", "Admin User", "admin", "1"),
            "pm@cbmp.com", new UserData("2", "Project Manager", "project_manager", "1")
    );

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        var user = USERS.get(request.email());
        if (user == null || !"password".equals(request.password())) {
            return ResponseEntity.status(401).build();
        }
        String token = jwtUtil.generateToken(user.id(), user.name(), request.email(), user.role(), user.companyId());
        return ResponseEntity.ok(new LoginResponse(token, new UserDto(user.id(), user.name(), request.email(), user.role(), user.companyId())));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal JwtAuthFilter.AuthUser user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(new UserDto(user.id(), user.name(), user.email(), user.role(), user.companyId()));
    }

    record LoginRequest(String email, String password) {}
    record LoginResponse(String token, UserDto user) {}
    record UserDto(String id, String name, String email, String role, String companyId) {}
    record UserData(String id, String name, String role, String companyId) {}
}
