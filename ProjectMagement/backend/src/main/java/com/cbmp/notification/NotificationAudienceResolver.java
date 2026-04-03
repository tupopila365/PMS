package com.cbmp.notification;

import com.cbmp.org.UserEntity;
import com.cbmp.org.UserRepository;
import com.cbmp.project.ProjectEntity;
import com.cbmp.project.ProjectRepository;
import com.cbmp.task.TaskEntity;
import com.cbmp.task.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class NotificationAudienceResolver {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public NotificationAudienceResolver(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public String companyIdForProject(String projectId) {
        if (projectId == null || projectId.isBlank()) {
            return null;
        }
        return projectRepository.findById(projectId).map(ProjectEntity::getCompanyId).orElse(null);
    }

    public String projectName(String projectId) {
        if (projectId == null || projectId.isBlank()) {
            return "Project";
        }
        return projectRepository.findById(projectId).map(ProjectEntity::getName).orElse("Project");
    }

    /** Distinct user ids assigned to any task in the project. */
    public Set<String> taskAssigneeIdsForProject(String projectId) {
        Set<String> ids = new LinkedHashSet<>();
        if (projectId == null || projectId.isBlank()) {
            return ids;
        }
        for (TaskEntity t : taskRepository.findByProjectIdOrderBySortOrderAscIdAsc(projectId)) {
            if (t.getAssignedTo() == null) {
                continue;
            }
            for (String raw : t.getAssignedTo()) {
                if (raw != null) {
                    String id = raw.trim();
                    if (!id.isEmpty()) {
                        ids.add(id);
                    }
                }
            }
        }
        return ids;
    }

    public List<UserEntity> usersInCompanyWithRoles(String companyId, String... roles) {
        if (companyId == null || companyId.isBlank() || roles == null || roles.length == 0) {
            return List.of();
        }
        Set<String> want = Set.of(roles);
        return userRepository.findByCompanyId(companyId).stream()
                .filter(u -> u.getRole() != null && want.contains(u.getRole()))
                .toList();
    }

    /** Admin, project manager, and accountant (finance). */
    public Stream<String> managerAndFinanceUserIds(String companyId) {
        return usersInCompanyWithRoles(companyId, "admin", "project_manager", "accountant").stream()
                .map(UserEntity::getId)
                .filter(id -> id != null && !id.isBlank());
    }

    /** Assignees on the project plus managers (deduped). */
    public Set<String> projectTeamAndManagers(String projectId) {
        Set<String> out = new LinkedHashSet<>(taskAssigneeIdsForProject(projectId));
        String cid = companyIdForProject(projectId);
        managerAndFinanceUserIds(cid).forEach(out::add);
        return out;
    }
}
