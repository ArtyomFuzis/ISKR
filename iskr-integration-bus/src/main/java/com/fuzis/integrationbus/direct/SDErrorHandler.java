package com.fuzis.integrationbus.direct;

import com.fuzis.integrationbus.processor.ExceptionProcessor;
import org.apache.camel.Exchange;
import org.apache.camel.builder.RouteBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SDErrorHandler extends RouteBuilder {
    private final ExceptionProcessor exceptionProcessor;

    @Autowired
    public SDErrorHandler(@Autowired ExceptionProcessor exceptionProcessor) {
        this.exceptionProcessor = exceptionProcessor;
    }

    @Override
    public void configure(){
        from("direct:error-sd-fail-handler")
                .routeId("sd-error-direct")
                .process(exceptionProcessor)
                .setHeader(Exchange.HTTP_RESPONSE_CODE, constant(503))
                .to("direct:finalize-request")
                .end();
    }
}
