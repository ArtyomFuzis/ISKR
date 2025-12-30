package com.fuzis.booksbackend.transfer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookUpdateDTO {
    @Size(max = 1024, message = "Title must not exceed 1024 characters")
    private String title;

    @Min(value = 1, message = "Page count must be at least 1")
    private Integer pageCnt;

    @Size(max = 1024, message = "Subtitle must not exceed 1024 characters")
    private String subtitle;

    private String description;

    @Size(max = 17, message = "ISBN must not exceed 17 characters")
    private String isbn;

    @Min(value = 1, message = "Photo link must be a positive integer")
    private Integer photoLink;

    private Set<Integer> authorIds;
    private Set<Integer> genreIds;
}