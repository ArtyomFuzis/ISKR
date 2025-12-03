package com.fuzis.integrationbus.route;

import com.fuzis.integrationbus.exception.AuthenticationException;
import com.fuzis.integrationbus.exception.NoRequiredHeader;
import com.fuzis.integrationbus.exception.ServiceFall;
import com.fuzis.integrationbus.processor.*;
import org.apache.camel.Exchange;
import org.apache.camel.LoggingLevel;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.dataformat.JsonLibrary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AccountsUserRoutes extends RouteBuilder {

    private final ChangeSSOUserDataProcessor changeSSOUserDataProcessor;

    private final SearchUserProcessor searchUserProcessor;

    @Autowired
    public AccountsUserRoutes(ChangeSSOUserDataProcessor changeSSOUserDataProcessor,  SearchUserProcessor searchUserProcessor) {
        this.changeSSOUserDataProcessor = changeSSOUserDataProcessor;
        this.searchUserProcessor = searchUserProcessor;
    }

    @Override
    public void configure() {

        errorHandler(defaultErrorHandler()
                .maximumRedeliveries(0)
                .retryAttemptedLogLevel(LoggingLevel.WARN));

        from("platform-http:/oapi/v1/accounts/user?httpMethodRestrict=GET")
                .routeId("accounts-user-get-route")
                .setHeader("X-Roles-Required", constant("profile-watch"))
                .to("direct:auth")
                .setHeader(Exchange.HTTP_METHOD, constant("GET"))
                .setHeader("X-Service", constant("Accounts"))
                .setHeader("X-Service-Request", simple("api/v1/accounts/user/${header.X-User-ID}"))
                .to("direct:sd-call-finalize");

//        from("platform-http:/oapi/v1/accounts/user?httpMethodRestrict=PUT")
//                .routeId("accounts-user-put-route")
//                .onException(NoRequiredHeader.class)
//                    .handled(true)
//                    .to("direct:bad-request-error-handler")
//                .end()
//                .onException(AuthenticationException.class)
//                    .handled(true)
//                    .to("direct:auth-error-handler")
//                .end()
//                .onException(ServiceFall.class)
//                    .handled(true)
//                    .to("direct:service-error-handler")
//                .end()
//                .setHeader("X-Roles-Required", constant("profile-watch,profile-change"))
//                .to("direct:auth")
//                .process(changeSSOUserDataProcessor)
//                .end();
//                .setHeader(Exchange.HTTP_METHOD, constant("PUT"))
//                .setHeader("X-Service", constant("Accounts"))
//                .setHeader("X-Service-Request", simple("api/v1/accounts/user/${header.X-User-ID}"))
//                .to("direct:sd-call-finalize");

        from("platform-http:/oapi/v1/accounts/verify-email?httpMethodRestrict=POST")
                .routeId("accounts-verify-email-route")
                .setHeader("X-Roles-Required", constant("profile-watch"))
                .to("direct:auth")
                .setHeader(Exchange.HTTP_METHOD, constant("POST"))
                .setHeader("X-Service", constant("Integration"))
                .setHeader("X-Service-Request", simple("oapi-inner/v1/accounts/verify-email"))
                .setBody(constant(""))
                .to("direct:sd-call-finalize");

        from("platform-http:/oapi-inner/v1/accounts/verify-email?httpMethodRestrict=POST")
                .routeId("accounts-inner-verify-email-route")
                .setHeader(Exchange.HTTP_METHOD, constant("POST"))
                .setHeader("X-Service", constant("Accounts"))
                .setHeader("X-No-Meta", constant(true))
                .setHeader("X-Service-Request", simple("api/v1/accounts/token"))
                .setHeader(Exchange.CONTENT_TYPE, constant("application/x-www-form-urlencoded"))
                .setBody(simple("type=verify_email_token&userId=${header.X-User-ID}"))
                .to("direct:sd-call-finalize");

        from("platform-http:/oapi/v1/accounts/redeem-token?httpMethodRestrict=POST")
                .routeId("accounts-redeem-token-route")
                .setHeader("X-Headers-Required", constant("Token"))
                .to("direct:check-params")
                .setHeader(Exchange.HTTP_METHOD, constant("POST"))
                .setHeader("X-Service", constant("Integration"))
                .setHeader("X-Service-Request", simple("oapi-inner/v1/accounts/redeem-token"))
                .setBody(constant(""))
                .to("direct:sd-call-finalize");

        from("platform-http:/oapi-inner/v1/accounts/redeem-token?httpMethodRestrict=POST")
                .routeId("accounts-inner-redeem-token-route")
                .setHeader(Exchange.HTTP_METHOD, constant("POST"))
                .setHeader("X-Service", constant("Accounts"))
                .setHeader("X-No-Meta", constant(true))
                .setHeader("X-Service-Request", simple("api/v1/accounts/token/redeem"))
                .setHeader(Exchange.CONTENT_TYPE, constant("application/x-www-form-urlencoded"))
                .setBody(simple("token=${header.Token}"))
                .to("direct:sd-call-finalize");

        from("platform-http:/oapi-inner/v1/accounts/verify-email-sso?httpMethodRestrict=POST")
                .routeId("accounts-inner-verify-email-sso-route")
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
                .setHeader("X-Headers-Required", constant("Email-Verified, X-User-ID"))
                .setHeader("X-Headers-Forbidden", constant("New-Nickname, New-Username"))
                .to("direct:check-params")
                .process(searchUserProcessor)
                .process(changeSSOUserDataProcessor)
                .end();

    }
}