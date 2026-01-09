// AuthorController.java
package com.fuzis.booksbackend.controller;

import com.fuzis.booksbackend.service.AuthorService;
import com.fuzis.booksbackend.transfer.AuthorCreateDTO;
import com.fuzis.booksbackend.transfer.AuthorUpdateDTO;
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
@RequestMapping("/api/v1/authors")
@RequiredArgsConstructor
public class AuthorController {
    private final AuthorService authorService;
    private final HttpUtil httpUtil;

    @PostMapping
    public ResponseEntity<ChangeDTO<Object>> createAuthor(
            @Valid @RequestBody AuthorCreateDTO authorCreateDTO) {
        return httpUtil.handleServiceResponse(authorService.createAuthor(authorCreateDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> getAuthorById(
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(authorService.getAuthorById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> updateAuthor(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody AuthorUpdateDTO authorUpdateDTO) {
        return httpUtil.handleServiceResponse(authorService.updateAuthor(id, authorUpdateDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> deleteAuthor(
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(authorService.deleteAuthor(id));
    }

    @GetMapping
    public ResponseEntity<ChangeDTO<Object>> getAllAuthors(
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(authorService.getAllAuthors(page, batch));
    }
}