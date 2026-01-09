// AuthorCreateDTO.java
package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthorCreateDTO {
    @NotBlank(message = "Author name is required")
    private String name;

    private String realName;
    private String description;
}