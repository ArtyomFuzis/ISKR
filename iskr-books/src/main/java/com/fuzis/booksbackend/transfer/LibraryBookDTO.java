package com.fuzis.booksbackend.transfer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LibraryBookDTO {
    private Integer bookId;
    private String isbn;
    private String title;
    private String subtitle;
    private String description;
    private Integer pageCnt;
    private Integer addedBy;
    private ImageLinkDTO photoLink;
    private Double averageRating;
    private Long collectionsCount;
    private List<AuthorDTO> authors;
    private List<GenreDTO> genres;
}