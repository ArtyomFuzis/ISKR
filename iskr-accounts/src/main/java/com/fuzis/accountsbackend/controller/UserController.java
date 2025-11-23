package com.fuzis.accountsbackend.controller;

import com.fuzis.accountsbackend.entity.User;
import com.fuzis.accountsbackend.service.UserService;
import com.fuzis.accountsbackend.transfer.ChangeDTO;
import com.fuzis.accountsbackend.transfer.IStateDTO;
import com.fuzis.accountsbackend.transfer.SelectDTO;
import com.fuzis.accountsbackend.util.HttpUtil;
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

    private final HttpUtil httpUtil;

    @Autowired
    public UserController( UserService userService, HttpUtil httpUtil) {
        this.userService =  userService;
        this.httpUtil = httpUtil;
    }


    @GetMapping("/{id}")
    public ResponseEntity<SelectDTO<User>> getUserData(@PathVariable @Min(0) Integer id) {
        return httpUtil.handleServiceResponse(userService.getUserData(id));
    }

    @GetMapping
    public ResponseEntity<SelectDTO<User>> getUserData(@RequestParam @NotBlank String username) {
        return httpUtil.handleServiceResponse(userService.getUserData(username));
    }

    @PostMapping
    public ResponseEntity<ChangeDTO<Integer>> createUser(@RequestParam @NotBlank String username){
        return httpUtil.handleServiceResponse(userService.createUser(username));
    }

    @DeleteMapping
    public ResponseEntity<ChangeDTO<Integer>> deleteUser(@RequestParam @NotBlank String username){
        return httpUtil.handleServiceResponse(userService.deleteUser(username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ChangeDTO<Integer>> deleteUser(@PathVariable @Min(0) Integer id){
        return httpUtil.handleServiceResponse(userService.deleteUser(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeDTO<Integer>> changeUsername(@PathVariable @Min(0) Integer id,  @RequestParam @NotBlank String new_username){
        return httpUtil.handleServiceResponse(userService.changeUsername(id, new_username));
    }

    @PutMapping
    public ResponseEntity<ChangeDTO<Integer>> changeUsername(@RequestParam @NotBlank String username,  @RequestParam @NotBlank String new_username){
        return httpUtil.handleServiceResponse(userService.changeUsername(username, new_username));
    }
}
