package com.fuzis.accountsbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class AccountsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccountsBackendApplication.class, args);
    }

}
