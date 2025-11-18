package com.fuzis.accountsbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;

@Entity
@Table(name="reset_password_requests")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ResetPasswordRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rpr_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id")
    private User user;

    private ZonedDateTime request_date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="token_id")
    private Token token;
}
