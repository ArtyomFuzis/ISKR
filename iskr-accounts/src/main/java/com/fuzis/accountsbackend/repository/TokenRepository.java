package com.fuzis.accountsbackend.repository;

import com.fuzis.accountsbackend.entity.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenRepository extends JpaRepository<Token, Integer>
{
    Token findByTokenKey(String token);
}
