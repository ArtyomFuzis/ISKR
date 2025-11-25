package com.fuzis.accountsbackend.service;

import com.fuzis.accountsbackend.entity.User;
import com.fuzis.accountsbackend.repository.UserRepository;
import com.fuzis.accountsbackend.transfer.ChangeDTO;
import com.fuzis.accountsbackend.transfer.SelectDTO;
import com.fuzis.accountsbackend.transfer.state.State;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserService
{
    private final UserRepository userRepository;

    public UserService(@Autowired UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public SelectDTO<User> getUserData(Integer userId){
        try {
            Optional<User> user = userRepository.findById(userId);
            return user
                    .map(value -> new SelectDTO<>(State.OK, value, ""))
                    .orElseGet(() -> new SelectDTO<>(State.Fail_NotFound, null, "User not found"));
        }
        catch (Exception e){
            return new SelectDTO<>(State.Fail, null, "Unexpected error: " + e.getMessage());
        }
    }

    public ChangeDTO<Integer> deleteUser(Integer userId){
        try {
            Optional<User> user = userRepository.findById(userId);
            if(user.isEmpty())return new ChangeDTO<>(State.Fail_NotFound, "No user found", null);
            userRepository.deleteById(userId);
            return new ChangeDTO<>(State.OK, "User deleted successfully", null);
        }
        catch (Exception e){
            return new ChangeDTO<>(State.Fail, "Unexpected error: " + e.getMessage(), null);
        }
    }

    public ChangeDTO<Integer> changePersonalData(Integer userId, String new_username){
        try {
            Optional<User> user = userRepository.findUserByUsername(new_username);
            if (user.isPresent()) return new ChangeDTO<>(State.Fail_Conflict, "Username already taken", null);
            int res = userRepository.updateUsername(userId, new_username);
            if(res == 0) return new ChangeDTO<>(State.Fail_NotFound, "User not found", null);
            if(res != 1) return new ChangeDTO<>(State.Fail, "Unexpected error", null);
            return new ChangeDTO<>(State.OK, "Username changed successfully", null);
        }
        catch (Exception e){
            return new ChangeDTO<>(State.Fail, "Unexpected error: " + e.getMessage(), null);
        }
    }
}
