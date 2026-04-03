package com.cbmp.media;

import com.cbmp.auth.JwtAuthFilter;
import com.cbmp.org.UserEntity;
import com.cbmp.flex.AppRecordEntity;
import com.cbmp.flex.AppRecordRepository;
import com.cbmp.flex.FlexibleRecordService;
import com.cbmp.project.ProjectAccessService;
import com.cbmp.notification.InAppNotificationPublisher;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private static final int MAX_COMMENT_LENGTH = 4000;

    private final FlexibleRecordService flex;
    private final AppRecordRepository appRecordRepository;
    private final ObjectMapper objectMapper;
    private final InAppNotificationPublisher notificationPublisher;
    private final ProjectAccessService projectAccessService;
    private final Path uploadDir;

    public ImageController(
            FlexibleRecordService flex,
            AppRecordRepository appRecordRepository,
            ObjectMapper objectMapper,
            InAppNotificationPublisher notificationPublisher,
            ProjectAccessService projectAccessService
    ) throws IOException {
        this.flex = flex;
        this.appRecordRepository = appRecordRepository;
        this.objectMapper = objectMapper;
        this.notificationPublisher = notificationPublisher;
        this.projectAccessService = projectAccessService;
        this.uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    @GetMapping
    public List<Map<String, Object>> list(
            @RequestParam(required = false) String projectId,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser auth
    ) {
        UserEntity user = projectAccessService.requireUser(auth);
        Set<String> visible = projectAccessService.visibleProjectIds(user);
        List<Map<String, Object>> rows;
        if (projectId != null && !projectId.isBlank()) {
            projectAccessService.requireAccess(user, projectId);
            rows = flex.list("image", projectId);
        } else {
            rows = flex.list("image", null).stream()
                    .filter(m -> {
                        Object pid = m.get("projectId");
                        return pid != null && !pid.toString().isBlank() && visible.contains(pid.toString());
                    })
                    .toList();
        }
        return rows.stream().map(this::enrichImageForResponse).toList();
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam("projectId") String projectId,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy,
            @RequestParam(value = "comment", required = false) String comment,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser authUser
    ) throws IOException {
        UserEntity user = projectAccessService.requireUser(authUser);
        projectAccessService.requireAccess(user, projectId);
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file required");
        }
        String id = UUID.randomUUID().toString();
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot);
        String diskName = id + ext;
        Path target = uploadDir.resolve(diskName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String displayName = authUser != null && authUser.name() != null && !authUser.name().isBlank()
                ? authUser.name()
                : (uploadedBy != null && !uploadedBy.isBlank() ? uploadedBy : "User");
        String userId = authUser != null ? authUser.id() : "";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", id);
        body.put("projectId", projectId);
        body.put("companyId", "1");
        body.put("filePath", "/api/images/file/" + id);
        body.put("fileName", original);
        body.put("uploadedBy", uploadedBy != null ? uploadedBy : displayName);
        Instant uploadedAt = Instant.now();
        body.put("uploadedAt", uploadedAt.toString());
        body.put("_diskName", diskName);
        if (authUser != null && !userId.isBlank()) {
            body.put("uploadedByUserId", userId);
        }

        List<Map<String, Object>> comments = new ArrayList<>();
        if (comment != null && !comment.isBlank()) {
            String c = comment.trim();
            if (c.length() > MAX_COMMENT_LENGTH) {
                c = c.substring(0, MAX_COMMENT_LENGTH);
            }
            comments.add(newCommentEntry(displayName, userId, c, "upload_note"));
        }
        body.put("comments", comments);

        ImageExifExtractor.ExifFlags exifFlags = ImageExifExtractor.enrichImagePayload(target, body);
        // Always store a display date: camera EXIF when present, otherwise upload time (capturedFromExif stays false).
        Object cap = body.get("capturedAt");
        if (cap == null || cap.toString().isBlank()) {
            body.put("capturedAt", uploadedAt.toString());
        }
        body.put("gpsExtracted", exifFlags.gpsExtracted());
        body.put("capturedFromExif", exifFlags.capturedFromExif());

        Map<String, Object> saved = flex.save("image", projectId, body, authUser);
        return enrichImageForResponse(saved);
    }

    public record ImageCommentBody(@JsonProperty("text") String text) {}

    @PostMapping(value = "/{id}/comments", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> addComment(
            @PathVariable String id,
            @RequestBody ImageCommentBody req,
            @AuthenticationPrincipal JwtAuthFilter.AuthUser user
    ) throws IOException {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        UserEntity dbUser = projectAccessService.requireUser(user);
        String text = req != null ? req.text() : null;
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "text required");
        }
        String trimmed = text.trim();
        if (trimmed.length() > MAX_COMMENT_LENGTH) {
            trimmed = trimmed.substring(0, MAX_COMMENT_LENGTH);
        }

        AppRecordEntity e = appRecordRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"image".equals(e.getKind())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        Map<String, Object> payload = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
        String imgProjectId = payload.get("projectId") != null ? payload.get("projectId").toString() : "";
        if (!imgProjectId.isBlank()) {
            projectAccessService.requireAccess(dbUser, imgProjectId);
        }
        List<Map<String, Object>> comments = copyCommentsFromPayload(payload);

        String legacy = payload.get("comment") != null ? payload.get("comment").toString().trim() : "";
        if (!legacy.isEmpty()) {
            boolean hasUploadNote = comments.stream()
                    .anyMatch(c -> "upload_note".equals(String.valueOf(c.get("kind"))));
            if (!hasUploadNote) {
                comments.add(0, legacyUploadNoteRow(payload, legacy));
            }
            payload.remove("comment");
        }

        String author = user.name() != null && !user.name().isBlank() ? user.name() : user.email();
        Set<String> notifyUserIds = collectImageParticipantUserIds(payload, comments);
        notifyUserIds.remove(user.id());

        comments.add(newCommentEntry(author, user.id(), trimmed, "comment"));
        payload.put("comments", comments);

        e.setPayloadJson(objectMapper.writeValueAsString(payload));
        appRecordRepository.save(e);

        String projectId = payload.get("projectId") != null ? payload.get("projectId").toString() : "";
        String fileLabel = payload.get("fileName") != null ? payload.get("fileName").toString() : "image";
        String msg = author + " commented on \"" + fileLabel + "\".";
        for (String uid : notifyUserIds) {
            if (uid == null || uid.isBlank()) {
                continue;
            }
            notificationPublisher.publish(uid, "general", "New comment on image", msg, projectId, null);
        }

        Map<String, Object> saved = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
        saved.put("id", e.getId());
        return enrichImageForResponse(saved);
    }

    @GetMapping("/file/{id}")
    public ResponseEntity<Resource> file(@PathVariable String id) throws IOException {
        AppRecordEntity e = appRecordRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"image".equals(e.getKind())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Map<String, Object> payload = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
        String diskName = payload.get("_diskName") != null ? payload.get("_diskName").toString() : id;
        Path path = uploadDir.resolve(diskName);
        if (!Files.isRegularFile(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        FileSystemResource resource = new FileSystemResource(path.toFile());
        String fileName = payload.get("fileName") != null ? payload.get("fileName").toString() : "image";
        String ct = Files.probeContentType(path);
        if (ct == null) ct = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName.replace("\"", "") + "\"")
                .contentType(MediaType.parseMediaType(ct))
                .body(resource);
    }

    private Map<String, Object> enrichImageForResponse(Map<String, Object> m) {
        Map<String, Object> out = new LinkedHashMap<>(m);
        List<Map<String, Object>> comments = copyCommentsFromPayload(m);
        String legacy = m.get("comment") != null ? m.get("comment").toString().trim() : "";
        if (!legacy.isEmpty()) {
            boolean hasUploadNote = comments.stream()
                    .anyMatch(c -> "upload_note".equals(String.valueOf(c.get("kind"))));
            if (!hasUploadNote) {
                comments.add(0, legacyUploadNoteRow(m, legacy));
            }
        }
        sortCommentsByCreatedAt(comments);
        out.put("comments", comments);
        return out;
    }

    private static Set<String> collectImageParticipantUserIds(Map<String, Object> payload, List<Map<String, Object>> commentsSoFar) {
        Set<String> ids = new LinkedHashSet<>();
        Object up = payload.get("uploadedByUserId");
        if (up != null && !up.toString().isBlank()) {
            ids.add(up.toString().trim());
        }
        for (Map<String, Object> c : commentsSoFar) {
            Object u = c.get("userId");
            if (u != null && !u.toString().isBlank()) {
                ids.add(u.toString().trim());
            }
        }
        return ids;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copyCommentsFromPayload(Map<String, Object> m) {
        List<Map<String, Object>> out = new ArrayList<>();
        Object raw = m.get("comments");
        if (raw instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> map) {
                    out.add(new LinkedHashMap<>((Map<String, Object>) (Map<?, ?>) map));
                }
            }
        }
        return out;
    }

    private static Map<String, Object> legacyUploadNoteRow(Map<String, Object> payload, String text) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", "legacy-" + Objects.toString(payload.get("id"), "x"));
        row.put("text", text);
        row.put("authorName", Optional.ofNullable(payload.get("uploadedBy"))
                .map(Object::toString)
                .filter(s -> !s.isBlank())
                .orElse("Uploader"));
        row.put("userId", "");
        row.put("createdAt", Objects.toString(payload.get("uploadedAt"), ""));
        row.put("kind", "upload_note");
        return row;
    }

    private static Map<String, Object> newCommentEntry(String authorName, String userId, String text, String kind) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", UUID.randomUUID().toString());
        row.put("text", text);
        row.put("authorName", authorName != null && !authorName.isBlank() ? authorName : "User");
        row.put("userId", userId != null ? userId : "");
        row.put("createdAt", Instant.now().toString());
        row.put("kind", kind);
        return row;
    }

    private static void sortCommentsByCreatedAt(List<Map<String, Object>> comments) {
        comments.sort(Comparator.comparing(c -> String.valueOf(c.getOrDefault("createdAt", ""))));
    }
}
