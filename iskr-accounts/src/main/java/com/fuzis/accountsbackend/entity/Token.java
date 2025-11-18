package com.fuzis.accountsbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;

@Entity
@Table(name="tokens")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Token {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ct_id;

    private String token_key;

    private ZonedDateTime till_date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "token_type")
    private TokenType token_type;

    private String token_body;
}
