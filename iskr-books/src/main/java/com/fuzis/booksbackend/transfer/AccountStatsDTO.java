package com.fuzis.booksbackend.transfer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountStatsDTO {
    private Integer totalBooksRead;
    private Integer totalPagesRead;
    private Integer currentlyReadingBooks;
    private Integer planningToReadBooks;
    private Integer delayedBooks;
    private Integer gaveUpBooks;
}