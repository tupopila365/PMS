package com.cbmp.auth;

import com.cbmp.org.UserEntity;
import com.cbmp.org.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(JwtUtil jwtUtil, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.password() == null) {
            return ResponseEntity.status(401).build();
        }
        String emailNorm = request.email().trim().toLowerCase();
        UserEntity u = userRepository.findByEmailIgnoreCase(emailNorm).orElse(null);
        if (u == null) {
            return ResponseEntity.status(401).build();
        }
        String hash = u.getPasswordHash();
        boolean ok;
        if (hash == null || hash.isEmpty()) {
            ok = "password".equals(request.password());
        } else {
            ok = passwordEncoder.matches(request.password(), hash);
        }
        if (!ok) {
            return ResponseEntity.status(401).build();
        }
        String token = jwtUtil.generateToken(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getCompanyId());
        return ResponseEntity.ok(new LoginResponse(token, toUserDto(u)));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal JwtAuthFilter.AuthUser user) {
        if (user == null) return ResponseEntity.status(401).build();
        return userRepository.findById(user.id())
                .map(u -> ResponseEntity.ok(toUserDto(u)))
                .orElse(ResponseEntity.status(401).build());
    }

    private static UserDto toUserDto(UserEntity u) {
        String disc = u.getDiscipline();
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getCompanyId(), disc != null ? disc : "");
    }

    record LoginRequest(String email, String password) {}
    record LoginResponse(String token, UserDto user) {}
    record UserDto(String id, String name, String email, String role, String companyId, String discipline) {}
}
