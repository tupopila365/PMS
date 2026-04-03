package com.cbmp.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Optional outbound POST when a variation order reaches {@code approved}. Set {@code app.erp.webhook-url} to enable.
 */
@Service
public class ErpWebhookPublisher {

    private static final Logger log = LoggerFactory.getLogger(ErpWebhookPublisher.class);

    private final ObjectMapper objectMapper;

    @Value("${app.erp.webhook-url:}")
    private String webhookUrl;

    public ErpWebhookPublisher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void onVariationOrderApproved(Map<String, Object> payload) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(payload);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl.trim()))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build()
                    .send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ex) {
            log.warn("ERP webhook failed: {}", ex.getMessage());
        }
    }
}
