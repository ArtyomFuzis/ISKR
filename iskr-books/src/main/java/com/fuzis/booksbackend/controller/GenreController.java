// GenreController.java
package com.fuzis.booksbackend.controller;

import com.fuzis.booksbackend.service.GenreService;
import com.fuzis.booksbackend.transfer.GenreCreateDTO;
import com.fuzis.booksbackend.transfer.GenreUpdateDTO;
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
@RequestMapping("/api/v1/genres")
@RequiredArgsConstructor
public class GenreController {
    private final GenreService genreService;
    private final HttpUtil httpUtil;

    @PostMapping
    public ResponseEntity<ChangeDTO<Object>> createGenre(
            @Valid @RequestBody GenreCreateDTO genreCreateDTO) {
        return httpUtil.handleServiceResponse(genreService.createGenre(genreCreateDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> getGenreById(
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(genreService.getGenreById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> updateGenre(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody GenreUpdateDTO genreUpdateDTO) {
        return httpUtil.handleServiceResponse(genreService.updateGenre(id, genreUpdateDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ChangeDTO<Object>> deleteGenre(
            @PathVariable @Min(1) Integer id) {
        return httpUtil.handleServiceResponse(genreService.deleteGenre(id));
    }

    @GetMapping
    public ResponseEntity<ChangeDTO<Object>> getAllGenres(
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(genreService.getAllGenres(page, batch));
    }
}