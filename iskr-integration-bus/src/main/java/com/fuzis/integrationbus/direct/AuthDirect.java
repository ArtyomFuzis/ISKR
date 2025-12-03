package com.fuzis.integrationbus.direct;

import com.fuzis.integrationbus.exception.AuthenticationException;
import com.fuzis.integrationbus.exception.AuthorizationException;
import com.fuzis.integrationbus.exception.ServiceFall;
import com.fuzis.integrationbus.processor.AuthHeaderProcessor;
import com.fuzis.integrationbus.processor.ParseCookieProcessor;
import org.apache.camel.Exchange;
import org.apache.camel.builder.RouteBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AuthDirect extends RouteBuilder {

    private final AuthHeaderProcessor authHeaderProcessor;

    private final ParseCookieProcessor parseCookieProcessor;

    @Autowired
    private AuthDirect(AuthHeaderProcessor authHeaderProcessor, ParseCookieProcessor parseCookieProcessor) {
        this.authHeaderProcessor = authHeaderProcessor;
        this.parseCookieProcessor = parseCookieProcessor;
    }

    @Override
    public void configure() throws Exception {
        from("direct:auth")
            .routeId("auth-direct")
            .onException(AuthenticationException.class)
                .handled(true)
                .to("direct:auth-error-handler")
            .end()
            .onException(AuthorizationException.class)
                .handled(true)
                .to("direct:auth-error-handler")
            .end()
            .onException(ServiceFall.class)
                .handled(true)
                .to("direct:service-error-handler")
            .end()
            .process(parseCookieProcessor)
            .process(authHeaderProcessor)
            .log("User authorized, user id: ${header.X-User-ID}")
            .end();
    }
}
