package com.fuzis.booksbackend.repository;

import com.fuzis.booksbackend.entity.LikedCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LikedCollectionRepository extends JpaRepository<LikedCollection, Integer> {

    @Query("SELECT lc.bcols.bcolsId, COUNT(lc) as likesCount " +
            "FROM LikedCollection lc " +
            "GROUP BY lc.bcols.bcolsId " +
            "ORDER BY likesCount DESC")
    List<Object[]> findPopularCollections();

    @Query("SELECT lc FROM LikedCollection lc WHERE lc.user.userId = :userId AND lc.bcols.bcolsId = :collectionId")
    Optional<LikedCollection> findByUserIdAndCollectionId(@Param("userId") Integer userId,
                                                          @Param("collectionId") Integer collectionId);

    @Query("SELECT COUNT(lc) > 0 FROM LikedCollection lc WHERE lc.user.userId = :userId AND lc.bcols.bcolsId = :collectionId")
    boolean existsByUserIdAndCollectionId(@Param("userId") Integer userId,
                                          @Param("collectionId") Integer collectionId);
}