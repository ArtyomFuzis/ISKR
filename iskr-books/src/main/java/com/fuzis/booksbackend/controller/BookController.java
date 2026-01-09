package com.fuzis.booksbackend.controller;

import com.fuzis.booksbackend.service.BookService;
import com.fuzis.booksbackend.transfer.BookCreateDTO;
import com.fuzis.booksbackend.transfer.BookReviewRequestDTO;
import com.fuzis.booksbackend.transfer.BookUpdateDTO;
import com.fuzis.booksbackend.transfer.ChangeDTO;
import com.fuzis.booksbackend.util.HttpUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;
    private final HttpUtil httpUtil;

    @PostMapping
    public ResponseEntity<ChangeDTO<Object>> createBook(
            @RequestHeader Integer userId,
            @Valid @RequestBody BookCreateDTO bookCreateDTO) {
        return httpUtil.handleServiceResponse(bookService.createBook(userId, bookCreateDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> getBookById(
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(bookService.getBookDetail(id));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<ChangeDTO<Object>> getBookReviews(
            @PathVariable @Min(1) Integer id,
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(bookService.getBookReviews(id, page, batch));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> updateBook(
            @RequestHeader(required = false) Integer userId,
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody BookUpdateDTO bookUpdateDTO) {
        return httpUtil.handleServiceResponse(bookService.updateBook(userId, id, bookUpdateDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> deleteBook(
            @RequestHeader(required = false) Integer userId,
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(bookService.deleteBook(userId, id));
    }

    @GetMapping
    public ResponseEntity<ChangeDTO<Object>> getAllBooks(
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(bookService.getAllBooks(page, batch));
    }
    @PostMapping("/{id}/reviews")
    public ResponseEntity<ChangeDTO<Object>> createBookReview(
            @RequestHeader Integer userId,
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody BookReviewRequestDTO bookReviewRequestDTO) {
        return httpUtil.handleServiceResponse(bookService.createBookReview(userId, id, bookReviewRequestDTO));
    }

    @PutMapping("/{id}/reviews")
    public ResponseEntity<ChangeDTO<Object>> updateBookReview(
            @RequestHeader Integer userId,
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody BookReviewRequestDTO bookReviewRequestDTO) {
        return httpUtil.handleServiceResponse(bookService.updateBookReview(userId, id, bookReviewRequestDTO));
    }

    @DeleteMapping("/{id}/reviews")
    public ResponseEntity<ChangeDTO<Object>> deleteBookReview(
            @RequestHeader Integer userId,
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(bookService.deleteBookReview(userId, id));
    }

    @GetMapping("/{id}/reviews/my")
    public ResponseEntity<ChangeDTO<Object>> getMyBookReview(
            @RequestHeader Integer userId,
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(bookService.getBookReviewByUserAndBook(userId, id));
    }
}