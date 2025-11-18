package com.fuzis.accountsbackend.repository;

import com.fuzis.accountsbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer>
{
    Optional<User> findUserByUsername(String username);

    void deleteUserByUsername(String username);

    @Modifying
    @Query("UPDATE User u SET u.username = :new_username WHERE u.user_id = :id")
    int updateUsername(@Param("id") Integer id, @Param("new_username") String new_username);

    @Modifying
    @Query("UPDATE User u SET u.username = :new_username WHERE u.username = :old_username")
    int updateUsernameByOldUsername(@Param("old_username") String old_username, @Param("new_username") String new_username);
}
