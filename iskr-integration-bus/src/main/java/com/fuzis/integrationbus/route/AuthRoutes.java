package com.fuzis.integrationbus.route;

import com.fuzis.integrationbus.exception.AuthenticationException;
import com.fuzis.integrationbus.exception.NoRequiredHeader;
import com.fuzis.integrationbus.exception.ServiceFall;
import com.fuzis.integrationbus.processor.LoginProcessor;
import org.apache.camel.Exchange;
import org.apache.camel.LoggingLevel;
import org.apache.camel.builder.RouteBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AuthRoutes extends RouteBuilder {

    private final LoginProcessor loginProcessor;


    @Autowired
    public AuthRoutes(LoginProcessor loginProcessor) {
        this.loginProcessor = loginProcessor;
    }

    @Override
    public void configure() throws Exception {
        errorHandler(defaultErrorHandler()
                .maximumRedeliveries(0)
                .retryAttemptedLogLevel(LoggingLevel.WARN));

        from("platform-http:/oapi/v1/accounts/login?httpMethodRestrict=POST")
                .routeId("login-user-post-route")
                .onException(NoRequiredHeader.class)
                    .handled(true)
                    .to("direct:bad-request-error-handler")
                .end()
                .onException(AuthenticationException.class)
                    .handled(true)
                    .to("direct:auth-error-handler")
                .end()
                .onException(ServiceFall.class)
                    .handled(true)
                    .to("direct:service-error-handler")
                .end()
                .process(loginProcessor)
                .to("direct:finalize-request");
    }
}
