// GenreCreateDTO.java
package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenreCreateDTO {
    @NotBlank(message = "Genre name is required")
    private String name;
}