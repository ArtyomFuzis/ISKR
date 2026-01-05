package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateReadingGoalRequestDTO {
    private String period;

    @Min(value = 1, message = "Amount must be at least 1")
    private Integer amount;

    private String goalType;
}