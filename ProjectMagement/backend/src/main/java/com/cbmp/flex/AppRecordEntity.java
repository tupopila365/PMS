package com.cbmp.flex;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_records")
public class AppRecordEntity {

    @Id
    private String id;

    /** e.g. stakeholder, raid, raci, resource, timesheet, change, cost_benefit, notification, document, image, baseline */
    private String kind;

    private String projectId;

    @Column(columnDefinition = "TEXT")
    private String payloadJson;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }
}
