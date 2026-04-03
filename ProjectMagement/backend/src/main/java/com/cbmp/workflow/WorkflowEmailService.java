package com.cbmp.workflow;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends workflow emails when {@code spring.mail.host} is configured and {@link JavaMailSender} is available.
 */
@Service
public class WorkflowEmailService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailFromUsername;

    public WorkflowEmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public void send(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            if (mailFromUsername != null && !mailFromUsername.isBlank()) {
                msg.setFrom(mailFromUsername);
            }
            sender.send(msg);
        } catch (Exception ex) {
            log.warn("Could not send email to {}: {}", toEmail, ex.getMessage());
        }
    }
}
