package com.fuzis.accountsbackend.repository;


import com.fuzis.accountsbackend.entity.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenTypeRepository extends JpaRepository<TokenType, Integer> {

    TokenType getTokenTypeByttName(String verifyEmailToken);
}
