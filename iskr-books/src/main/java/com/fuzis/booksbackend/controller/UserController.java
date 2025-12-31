package com.fuzis.booksbackend.controller;

import com.fuzis.booksbackend.service.UserService;
import com.fuzis.booksbackend.transfer.ChangeDTO;
import com.fuzis.booksbackend.util.HttpUtil;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final HttpUtil httpUtil;

    @GetMapping("/{userId}")
    public ResponseEntity<ChangeDTO<Object>> getUserDetail(
            @PathVariable @Min(1) Integer userId) {
        return httpUtil.handleServiceResponse(userService.getUserDetail(userId));
    }

    @GetMapping("/{userId}/subscribers")
    public ResponseEntity<ChangeDTO<Object>> getUserSubscribers(
            @PathVariable @Min(1) Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(userService.getUserSubscribers(userId, page, batch));
    }

    @GetMapping("/{userId}/subscriptions")
    public ResponseEntity<ChangeDTO<Object>> getUserSubscriptions(
            @PathVariable @Min(1) Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(userService.getUserSubscriptions(userId, page, batch));
    }

    @GetMapping("/{userId}/collections")
    public ResponseEntity<ChangeDTO<Object>> getUserCollections(
            @PathVariable @Min(1) Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(userService.getUserCollections(userId, page, batch));
    }
}