package com.fuzis.booksbackend.controller;

import com.fuzis.booksbackend.service.LibraryService;
import com.fuzis.booksbackend.transfer.ChangeDTO;
import com.fuzis.booksbackend.util.HttpUtil;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/library")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService libraryService;
    private final HttpUtil httpUtil;

    @GetMapping("/visible-collections")
    public ResponseEntity<ChangeDTO<Object>> getVisibleCollections(
            @RequestHeader @Min(1) Integer userId) {
        return httpUtil.handleServiceResponse(libraryService.getVisibleCollections(userId));
    }

    @GetMapping("/visible-books")
    public ResponseEntity<ChangeDTO<Object>> getVisibleBooks(
            @RequestHeader @Min(1) Integer userId) {
        return httpUtil.handleServiceResponse(libraryService.getVisibleBooks(userId));
    }

    @GetMapping("/wishlist-books")
    public ResponseEntity<ChangeDTO<Object>> getWishlistBooks(
            @RequestHeader @Min(1) Integer userId) {
        return httpUtil.handleServiceResponse(libraryService.getWishlistBooks(userId));
    }
}