package com.cbmp.documents;

import com.cbmp.flex.AppRecordEntity;
import com.cbmp.flex.AppRecordRepository;
import com.cbmp.flex.FlexibleRecordService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentFileController {

    private final FlexibleRecordService flex;
    private final AppRecordRepository appRecordRepository;
    private final ObjectMapper objectMapper;
    private final Path uploadDir;

    public DocumentFileController(
            FlexibleRecordService flex,
            AppRecordRepository appRecordRepository,
            ObjectMapper objectMapper
    ) throws IOException {
        this.flex = flex;
        this.appRecordRepository = appRecordRepository;
        this.objectMapper = objectMapper;
        this.uploadDir = Paths.get("uploads", "documents").toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam("projectId") String projectId,
            @RequestParam(value = "taskId", required = false) String taskId,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy
    ) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file required");
        }
        String id = UUID.randomUUID().toString();
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            ext = original.substring(dot);
        }
        String diskName = id + ext;
        Path target = uploadDir.resolve(diskName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = Files.probeContentType(target);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", id);
        body.put("projectId", projectId);
        if (taskId != null && !taskId.isBlank()) {
            body.put("taskId", taskId);
        }
        body.put("name", original);
        body.put("type", contentType);
        body.put("version", 1);
        body.put("uploadedAt", Instant.now().toString());
        body.put("uploadedBy", uploadedBy != null ? uploadedBy : "");
        body.put("filePath", "/api/documents/file/" + id);
        body.put("_diskName", diskName);
        return flex.save("document", projectId, body);
    }

    @GetMapping("/file/{id}")
    public ResponseEntity<Resource> file(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "false") boolean download
    ) throws IOException {
        AppRecordEntity e = appRecordRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"document".equals(e.getKind())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Map<String, Object> payload = objectMapper.readValue(e.getPayloadJson(), new TypeReference<>() {});
        Object disk = payload.get("_diskName");
        if (disk == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Path path = uploadDir.resolve(disk.toString());
        if (!Files.isRegularFile(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        FileSystemResource resource = new FileSystemResource(path.toFile());
        String fileName = payload.get("name") != null ? payload.get("name").toString() : "document";
        String safeName = fileName.replace("\"", "");
        String ct = Files.probeContentType(path);
        if (ct == null) {
            ct = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        String disposition = download ? "attachment" : "inline";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + safeName + "\"")
                .contentType(MediaType.parseMediaType(ct))
                .body(resource);
    }
}
