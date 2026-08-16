package com.attendtrack.dto;

public class ProjectionItemDTO {
    private int count; // missed or attended count
    private double percentage;
    private boolean safe;

    public ProjectionItemDTO() {
    }

    public ProjectionItemDTO(int count, double percentage, boolean safe) {
        this.count = count;
        this.percentage = percentage;
        this.safe = safe;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public boolean isSafe() {
        return safe;
    }

    public void setSafe(boolean safe) {
        this.safe = safe;
    }
}
