package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateReadingProgressRequestDTO {
    @NotNull(message = "Page read is required")
    @Min(value = 1, message = "Page read must be at least 1")
    private Integer pageRead;
}