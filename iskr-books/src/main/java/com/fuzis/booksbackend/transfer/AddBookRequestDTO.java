package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddBookRequestDTO {
    @NotNull(message = "Book ID is required")
    private Integer bookId;
}