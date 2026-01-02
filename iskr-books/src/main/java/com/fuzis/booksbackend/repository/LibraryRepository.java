package com.fuzis.booksbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.fuzis.booksbackend.entity.Book;
import com.fuzis.booksbackend.entity.BookCollection;

import java.util.List;

@Repository
public interface LibraryRepository extends JpaRepository<Book, Integer> {

    @Query(value = "SELECT * FROM BOOKS.GET_VISIBLE_COLLECTIONS_FOR_USER(:userId)", nativeQuery = true)
    List<Object[]> findVisibleCollectionsForUser(@Param("userId") Integer userId);

    @Query(value = "SELECT * FROM BOOKS.GET_VISIBLE_BOOKS_FOR_USER(:userId)", nativeQuery = true)
    List<Object[]> findVisibleBooksForUser(@Param("userId") Integer userId);

    @Query("SELECT bc FROM BookCollection bc WHERE bc.owner.userId = :userId AND bc.collectionType = 'Wishlist'")
    List<BookCollection> findWishlistByUserId(@Param("userId") Integer userId);
}