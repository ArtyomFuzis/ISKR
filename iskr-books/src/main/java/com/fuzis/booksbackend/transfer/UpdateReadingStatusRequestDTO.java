package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateReadingStatusRequestDTO {
    @NotBlank(message = "Reading status is required")
    private String readingStatus;
}