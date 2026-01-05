package com.fuzis.booksbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "BOOK_READING_STATUS", schema = "BOOKS")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookReadingStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brs_id")
    private Integer brsId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "reading_status", nullable = false, length = 50)
    private String readingStatus;

    @Column(name = "page_read", nullable = false)
    private Integer pageRead;

    @Column(name = "last_read_date")
    private LocalDateTime lastReadDate;
}