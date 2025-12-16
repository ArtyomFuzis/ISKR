package com.fuzis.accountsbackend.repository;


import com.fuzis.accountsbackend.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
    @Query("SELECT up FROM UserProfile up WHERE LOWER(up.user.username) = LOWER(:searchTerm) OR LOWER(up.email) = LOWER(:searchTerm)")
    Optional<UserProfile> findByUsernameOrEmail(@Param("searchTerm") String searchTerm);
}
