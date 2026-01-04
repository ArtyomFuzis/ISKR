package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookReviewRequestDTO {
    @NotNull(message = "Score is required")
    @Min(value = 1, message = "Score must be at least 1")
    @Max(value = 10, message = "Score must be at most 5")
    private Integer score;

    private String reviewText;
}