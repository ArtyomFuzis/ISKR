package com.fuzis.integrationbus.direct;

import com.fuzis.integrationbus.processor.ExceptionProcessor;
import org.apache.camel.Exchange;
import org.apache.camel.builder.RouteBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class WrongHeadersHandlerDirect extends RouteBuilder {

    private final ExceptionProcessor exceptionProcessor;

    public WrongHeadersHandlerDirect(@Autowired ExceptionProcessor exceptionProcessor) {
        this.exceptionProcessor = exceptionProcessor;
    }

    @Override
    public void configure() throws Exception {
        from("direct:wrong-headers-error-handler")
                .routeId("wrong-headers-error-direct")
                .setHeader("X-Include-Body", constant(true))
                .process(exceptionProcessor)
                .setHeader(Exchange.HTTP_RESPONSE_CODE, constant(400))
                .to("direct:finalize-request")
                .end();
    }
}
