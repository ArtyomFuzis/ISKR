package com.fuzis.integrationbus.processor;

import com.fuzis.integrationbus.exception.NoRequiredHeader;
import com.fuzis.integrationbus.util.JwtValidator;
import com.fuzis.integrationbus.exception.AuthenticationException;
import com.fuzis.integrationbus.exception.AuthorizationException;
import com.fuzis.integrationbus.model.UserInfo;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Arrays;


@Component
public class AuthHeaderProcessor implements Processor {

    private static final Logger log = LoggerFactory.getLogger(AuthHeaderProcessor.class);

    private final JwtValidator jwtValidator;

    private final TokenRefreshProcessor tokenRefreshProcessor;

    @Autowired
    public AuthHeaderProcessor(JwtValidator jwtValidator , TokenRefreshProcessor tokenRefreshProcessor) {
        this.jwtValidator = jwtValidator;
        this.tokenRefreshProcessor = tokenRefreshProcessor;
    }

    @Override
    public void process(Exchange exchange) throws Exception {
        String authHeader = exchange.getIn().getHeader("Authorization", String.class);

        if (authHeader == null || authHeader.isEmpty()) {
            throw new NoRequiredHeader("Missing or empty authorization header");
        }
        UserInfo userInfo = null;
        try {
            userInfo = jwtValidator.extractUserInfo(authHeader);
        }
        catch (AuthenticationException e) {
            if(e.getCause().getMessage().contains("Jwt expired at")){
                tokenRefreshProcessor.process(exchange);
            }
            else throw e;
        }
        if (userInfo == null) {
            userInfo = jwtValidator.extractUserInfo(exchange.getIn().getHeader("Authorization", String.class));
        }
        exchange.getIn().setHeader("X-User-SSO-ID", userInfo.getSubject());
        exchange.getIn().setHeader("X-User-ID", userInfo.getUserId());
        exchange.getIn().setHeader("X-Login", userInfo.getLogin());
        exchange.getIn().setHeader("X-Email", userInfo.getEmail());
        exchange.getIn().setHeader("X-Email-Verified", userInfo.getEmailVerified());
        exchange.getIn().setHeader("X-Nickname", userInfo.getNickname());
        exchange.getIn().setHeader("X-Realm-Roles", String.join(",", userInfo.getRealmRoles()));
        exchange.getIn().setHeader("X-Client-Roles", String.join(",", userInfo.getClientRoles()));

        checkPermissions(exchange, userInfo);
    }

    private void checkPermissions(Exchange exchange, UserInfo userInfo) throws Exception {
        String roles = exchange.getIn().getHeader("X-Roles-Required", String.class);

        String[] roleList = Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(h -> !h.isEmpty())
                .toArray(String[]::new);

        if(!userInfo.hasAllRoles(roleList)){
            throw new AuthorizationException("No access to this resource");
        }
    }
}