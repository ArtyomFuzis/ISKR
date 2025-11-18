package com.fuzis.accountsbackend.controller;

import com.fuzis.accountsbackend.entity.User;
import com.fuzis.accountsbackend.service.UserService;
import com.fuzis.accountsbackend.transfer.ChangeDTO;
import com.fuzis.accountsbackend.transfer.IStateDTO;
import com.fuzis.accountsbackend.transfer.SelectDTO;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/accounts/user")
public class UserController {

    private final UserService userService;

    public UserController(@Autowired UserService userService) {
        this.userService =  userService;
    }

    private <T extends IStateDTO> ResponseEntity<T> handleServiceResponse(T res){
        return switch (res.getState()) {
            case OK -> new ResponseEntity<>(res, HttpStatus.OK);
            case Fail_BadData -> new ResponseEntity<>(res, HttpStatus.BAD_REQUEST);
            case Fail_NotFound -> new ResponseEntity<>(res, HttpStatus.NOT_FOUND);
            case Fail_Conflict -> new ResponseEntity<>(res, HttpStatus.CONFLICT);
            case Fail -> new ResponseEntity<>(res, HttpStatus.INTERNAL_SERVER_ERROR);
        };
    }

    @GetMapping("/{id}")
    public ResponseEntity<SelectDTO<User>> getUserData(@PathVariable @Min(0) Integer id) {
        return handleServiceResponse(userService.getUserData(id));
    }

    @GetMapping
    public ResponseEntity<SelectDTO<User>> getUserData(@RequestParam @NotBlank String username) {
        return handleServiceResponse(userService.getUserData(username));
    }

    @PostMapping
    public ResponseEntity<ChangeDTO<Integer>> createUser(@RequestParam @NotBlank String username){
        return handleServiceResponse(userService.createUser(username));
    }

    @DeleteMapping
    public ResponseEntity<ChangeDTO<Integer>> deleteUser(@RequestParam @NotBlank String username){
        return handleServiceResponse(userService.deleteUser(username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ChangeDTO<Integer>> deleteUser(@PathVariable @Min(0) Integer id){
        return handleServiceResponse(userService.deleteUser(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeDTO<Integer>> changeUsername(@PathVariable @Min(0) Integer id,  @RequestParam @NotBlank String new_username){
        return handleServiceResponse(userService.changeUsername(id, new_username));
    }

    @PutMapping
    public ResponseEntity<ChangeDTO<Integer>> changeUsername(@RequestParam @NotBlank String username,  @RequestParam @NotBlank String new_username){
        return handleServiceResponse(userService.changeUsername(username, new_username));
    }
}
