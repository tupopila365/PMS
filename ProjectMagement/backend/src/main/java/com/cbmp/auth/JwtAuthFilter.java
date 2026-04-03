package com.cbmp.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                var claims = jwtUtil.parseToken(token);
                String userId = claims.getSubject();
                String name = claims.get("name", String.class);
                String email = claims.get("email", String.class);
                String role = claims.get("role", String.class);
                // Null role would NPE on toUpperCase() and drop auth → anonymous → 403 on API calls
                String roleNorm = (role == null || role.isBlank()) ? "USER" : role;
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + roleNorm.toUpperCase()));
                var auth = new UsernamePasswordAuthenticationToken(
                        new AuthUser(userId, name, email, roleNorm, claims.get("companyId", String.class)),
                        null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ignored) {
            }
        }
        filterChain.doFilter(request, response);
    }

    public record AuthUser(String id, String name, String email, String role, String companyId) {}
}
