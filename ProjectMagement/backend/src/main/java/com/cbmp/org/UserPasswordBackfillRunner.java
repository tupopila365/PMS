package com.cbmp.org;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Existing databases may have users with null password_hash; set default "password" hash.
 */
@Component
@Order(100)
public class UserPasswordBackfillRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserPasswordBackfillRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (UserEntity u : userRepository.findAll()) {
            String h = u.getPasswordHash();
            if (h == null || h.isBlank()) {
                u.setPasswordHash(passwordEncoder.encode("password"));
                userRepository.save(u);
            }
        }
    }
}
