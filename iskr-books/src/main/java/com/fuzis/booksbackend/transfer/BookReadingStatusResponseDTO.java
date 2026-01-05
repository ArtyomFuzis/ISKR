package com.fuzis.booksbackend.transfer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookReadingStatusResponseDTO {
    private Integer brsId;
    private Integer userId;
    private Integer bookId;
    private String readingStatus;
    private Integer pageRead;
    private LocalDateTime lastReadDate;
    private Integer bookPageCnt;
    private String bookTitle;
}