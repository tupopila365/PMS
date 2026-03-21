package com.cbmp.org;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class OrgDataLoader implements ApplicationRunner {

    private final CompanyRepository companyRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public OrgDataLoader(
            CompanyRepository companyRepository,
            SubscriptionRepository subscriptionRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.companyRepository = companyRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (companyRepository.count() > 0) return;

        CompanyEntity company = new CompanyEntity();
        company.setId("1");
        company.setName("CBMP Construction");
        company.setSubscriptionId("sub-1");
        companyRepository.save(company);

        SubscriptionEntity sub = new SubscriptionEntity();
        sub.setId("sub-1");
        sub.setCompanyId("1");
        sub.setPlan("standard");
        sub.setMaxUsers(10);
        sub.setMaxProjects(-1);
        sub.setStorageGB(50);
        sub.setExpiresAt("2025-12-31");
        sub.setStatus("active");
        subscriptionRepository.save(sub);

        UserEntity u1 = new UserEntity();
        u1.setId("1");
        u1.setName("Admin User");
        u1.setEmail("admin@cbmp.com");
        u1.setRole("admin");
        u1.setCompanyId("1");
        u1.setPasswordHash(passwordEncoder.encode("password"));
        userRepository.save(u1);

        UserEntity u2 = new UserEntity();
        u2.setId("2");
        u2.setName("Project Manager");
        u2.setEmail("pm@cbmp.com");
        u2.setRole("project_manager");
        u2.setCompanyId("1");
        u2.setPasswordHash(passwordEncoder.encode("password"));
        userRepository.save(u2);

        UserEntity u3 = new UserEntity();
        u3.setId("3");
        u3.setName("Site Contractor");
        u3.setEmail("contractor@cbmp.com");
        u3.setRole("contractor");
        u3.setCompanyId("1");
        u3.setPasswordHash(passwordEncoder.encode("password"));
        userRepository.save(u3);
    }
}
