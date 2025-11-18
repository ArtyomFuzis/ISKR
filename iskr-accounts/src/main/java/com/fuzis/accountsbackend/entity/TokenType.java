package com.fuzis.accountsbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name="token_types")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class TokenType {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer tt_id;

    private String tt_name;

    public TokenType(String tt_name) {
        this.tt_name = tt_name;
    }

    @OneToMany(mappedBy = "token_type")
    private List<Token> tokens;
}
