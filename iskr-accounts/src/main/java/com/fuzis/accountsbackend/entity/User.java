package com.fuzis.accountsbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;

@Entity
@Table(name="users")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class User
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer user_id;

    private String username;

    private ZonedDateTime registered_date;

    public User(String username,  ZonedDateTime registered_date){
        this.username = username;
        this.registered_date = registered_date;
    }

    public User(String username){
        this.username = username;
        this.registered_date = ZonedDateTime.now();
    }
}
