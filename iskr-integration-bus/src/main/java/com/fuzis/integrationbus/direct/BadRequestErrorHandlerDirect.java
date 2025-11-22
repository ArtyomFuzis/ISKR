package com.fuzis.integrationbus.direct;

import com.fuzis.integrationbus.processor.ExceptionProcessor;
import org.apache.camel.Exchange;
import org.apache.camel.builder.RouteBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


@Component
public class BadRequestErrorHandlerDirect extends RouteBuilder {
    private final ExceptionProcessor exceptionProcessor;

    @Autowired
    public BadRequestErrorHandlerDirect(ExceptionProcessor exceptionProcessor) {
        this.exceptionProcessor = exceptionProcessor;
    }

    @Override
    public void configure() throws Exception {
        from("direct:bad-request-error-handler")
                .routeId("bad-request-error-direct")
                .process(exceptionProcessor)
                .setHeader(Exchange.HTTP_RESPONSE_CODE, constant(400))
                .to("direct:finalize-request")
                .end();
    }
}
