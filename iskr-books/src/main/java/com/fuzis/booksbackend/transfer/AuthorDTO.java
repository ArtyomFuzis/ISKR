package com.fuzis.booksbackend.transfer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDTO {
    private Integer authorId;
    private String name;
    LocalDateTime birthDate;
    String  description;
    private String realName;
    public AuthorDTO(Integer authorId, String name, String realName) {
        this.authorId = authorId;
        this.name = name;
        this.realName = realName;
    }
}