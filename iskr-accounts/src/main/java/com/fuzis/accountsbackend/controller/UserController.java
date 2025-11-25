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

import java.time.ZonedDateTime;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<ChangeDTO<Integer>> deleteUser(@PathVariable @Min(0) Integer id){
        return httpUtil.handleServiceResponse(userService.deleteUser(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeDTO<Integer>> changePersonalData(@PathVariable @Min(0) Integer id,
                                                                 @RequestParam(required = false) String username,
                                                                 @RequestParam(required = false) String nickname,
                                                                 @RequestParam(required = false) String birth_date,
                                                                 @RequestParam(required = false) String profile_description,
                                                                 @RequestParam(required = false) String email
    ){
        return httpUtil.handleServiceResponse(userService.changePersonalData(id, username));
    }
}
