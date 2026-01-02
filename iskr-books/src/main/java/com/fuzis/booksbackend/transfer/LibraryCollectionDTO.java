package com.fuzis.booksbackend.transfer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LibraryCollectionDTO {
    private Integer bcolsId;
    private Integer ownerId;
    private String title;
    private String description;
    private String confidentiality;
    private String bookCollectionType;
    private ImageLinkDTO photoLink;
    private String ownerNickname;
    private Long bookCount;
}