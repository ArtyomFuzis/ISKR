package com.fuzis.booksbackend.repository;

import com.fuzis.booksbackend.entity.Subscriber;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriberRepository extends JpaRepository<Subscriber, Integer> {

    Optional<Subscriber> findBySubsUserIdAndSubsUserOnId(Integer subsUserId, Integer subsUserOnId);

    boolean existsBySubsUserIdAndSubsUserOnId(Integer subsUserId, Integer subsUserOnId);

    @Query("SELECT s FROM Subscriber s WHERE s.subsUserId = :userId")
    Page<Subscriber> findSubscriptionsByUserId(@Param("userId") Integer userId, Pageable pageable);

    @Query("SELECT s FROM Subscriber s WHERE s.subsUserOnId = :userId")
    Page<Subscriber> findSubscribersByUserId(@Param("userId") Integer userId, Pageable pageable);

    @Query("SELECT COUNT(s) FROM Subscriber s WHERE s.subsUserId = :userId")
    long countSubscriptionsByUserId(@Param("userId") Integer userId);

    @Query("SELECT COUNT(s) FROM Subscriber s WHERE s.subsUserOnId = :userId")
    long countSubscribersByUserId(@Param("userId") Integer userId);

    void deleteBySubsUserIdAndSubsUserOnId(Integer subsUserId, Integer subsUserOnId);
}