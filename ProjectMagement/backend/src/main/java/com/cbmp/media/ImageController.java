package com.cbmp.media;

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
import java.util.*;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final FlexibleRecordService flex;
    private final AppRecordRepository appRecordRepository;
    private final ObjectMapper objectMapper;
    private final Path uploadDir;

    public ImageController(
            FlexibleRecordService flex,
            AppRecordRepository appRecordRepository,
            ObjectMapper objectMapper
    ) throws IOException {
        this.flex = flex;
        this.appRecordRepository = appRecordRepository;
        this.objectMapper = objectMapper;
        this.uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String projectId) {
        if (projectId != null && !projectId.isBlank()) {
            return flex.list("image", projectId);
        }
        return flex.list("image", null);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam("projectId") String projectId,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy
    ) throws IOException {
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

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", id);
        body.put("projectId", projectId);
        body.put("companyId", "1");
        body.put("filePath", "/api/images/file/" + id);
        body.put("fileName", original);
        body.put("uploadedBy", uploadedBy != null ? uploadedBy : "");
        Instant uploadedAt = Instant.now();
        body.put("uploadedAt", uploadedAt.toString());
        body.put("_diskName", diskName);
        ImageExifExtractor.enrichImagePayload(target, body);
        return flex.save("image", projectId, body);
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
}
