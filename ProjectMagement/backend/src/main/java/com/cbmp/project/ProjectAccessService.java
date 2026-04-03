package com.cbmp.project;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.org.UserEntity;
import com.cbmp.org.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProjectAccessService {

    private static final Set<String> DISCIPLINE_BYPASS_ROLES = Set.of("admin", "project_manager", "accountant");

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public ProjectAccessService(UserRepository userRepository, ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    public UserEntity loadUser(JwtAuthFilter.AuthUser auth) {
        if (auth == null || auth.id() == null || auth.id().isBlank()) {
            return null;
        }
        return userRepository.findById(auth.id()).orElse(null);
    }

    public UserEntity requireUser(JwtAuthFilter.AuthUser auth) {
        UserEntity u = loadUser(auth);
        if (u == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return u;
    }

    public boolean bypassesDiscipline(UserEntity user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return DISCIPLINE_BYPASS_ROLES.contains(user.getRole().toLowerCase(Locale.ROOT));
    }

    /** Non-bypass users with a non-blank discipline only see projects whose type matches (case-insensitive). */
    public boolean restrictsToDiscipline(UserEntity user) {
        return !bypassesDiscipline(user)
                && user.getDiscipline() != null
                && !user.getDiscipline().isBlank();
    }

    public List<ProjectEntity> visibleProjects(UserEntity user) {
        if (user == null) {
            return List.of();
        }
        String companyId = user.getCompanyId();
        List<ProjectEntity> base = (companyId == null || companyId.isBlank())
                ? projectRepository.findAll()
                : projectRepository.findByCompanyId(companyId);
        if (bypassesDiscipline(user)) {
            return base;
        }
        String d = user.getDiscipline();
        if (d == null || d.isBlank()) {
            return base;
        }
        String norm = d.trim().toLowerCase(Locale.ROOT);
        return base.stream()
                .filter(p -> p.getType() != null && norm.equals(p.getType().trim().toLowerCase(Locale.ROOT)))
                .toList();
    }

    public Set<String> visibleProjectIds(UserEntity user) {
        return visibleProjects(user).stream().map(ProjectEntity::getId).collect(Collectors.toSet());
    }

    public boolean canAccess(UserEntity user, String projectId) {
        if (projectId == null || projectId.isBlank()) {
            return false;
        }
        return visibleProjectIds(user).contains(projectId);
    }

    public void requireAccess(UserEntity user, String projectId) {
        if (!canAccess(user, projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
