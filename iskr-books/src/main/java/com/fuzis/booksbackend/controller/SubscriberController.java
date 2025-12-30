package com.fuzis.booksbackend.controller;

import com.fuzis.booksbackend.service.SubscriberService;
import com.fuzis.booksbackend.transfer.ChangeDTO;
import com.fuzis.booksbackend.util.HttpUtil;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/subscribers")
@RequiredArgsConstructor
public class SubscriberController {

    private final SubscriberService subscriberService;
    private final HttpUtil httpUtil;

    @PostMapping("/subscribe")
    public ResponseEntity<ChangeDTO<Object>> subscribe(
            @RequestParam @Min(1) Integer userId,
            @RequestParam @Min(1) Integer userOnId) {
        return httpUtil.handleServiceResponse(subscriberService.subscribe(userId, userOnId));
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<ChangeDTO<Object>> unsubscribe(
            @RequestParam @Min(1) Integer userId,
            @RequestParam @Min(1) Integer userOnId) {
        return httpUtil.handleServiceResponse(subscriberService.unsubscribe(userId, userOnId));
    }

    @GetMapping("/subscriptions/{userId}")
    public ResponseEntity<ChangeDTO<Object>> getUserSubscriptions(
            @PathVariable @Min(1) Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(subscriberService.getUserSubscriptions(userId, page, batch));
    }

    @GetMapping("/subscribers/{userId}")
    public ResponseEntity<ChangeDTO<Object>> getUserSubscribers(
            @PathVariable @Min(1) Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) Integer page,
            @RequestParam(defaultValue = "10") @Min(1) Integer batch) {
        return httpUtil.handleServiceResponse(subscriberService.getUserSubscribers(userId, page, batch));
    }

    @GetMapping("/is-subscriber")
    public ResponseEntity<ChangeDTO<Object>> isSubscriber(
            @RequestParam @Min(1) Integer userId,
            @RequestParam @Min(1) Integer userOnId) {
        return httpUtil.handleServiceResponse(subscriberService.isSubscriber(userId, userOnId));
    }

    @GetMapping("/subscribers-count/{userId}")
    public ResponseEntity<ChangeDTO<Object>> countSubscribers(
            @PathVariable @Min(1) Integer userId) {
        return httpUtil.handleServiceResponse(subscriberService.countSubscribers(userId));
    }

    @GetMapping("/subscriptions-count/{userId}")
    public ResponseEntity<ChangeDTO<Object>> countSubscriptions(
            @PathVariable @Min(1) Integer userId) {
        return httpUtil.handleServiceResponse(subscriberService.countSubscriptions(userId));
    }
}