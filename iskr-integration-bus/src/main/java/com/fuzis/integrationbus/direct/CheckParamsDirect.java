package com.fuzis.integrationbus.direct;

import com.fuzis.integrationbus.processor.CheckParamsProcessor;
import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;

@Component
public class CheckParamsDirect  extends RouteBuilder {

    private final CheckParamsProcessor checkParamsProcessor;
    public CheckParamsDirect(CheckParamsProcessor checkParamsProcessor) {
        this.checkParamsProcessor = checkParamsProcessor;
    }

    @Override
    public void configure() throws Exception {
        from("direct:check-params")
                .routeId("check-params-direct")
                .onException(IllegalStateException.class)
                    .handled(true)
                    .to("direct:wrong-headers-error-handler")
                .end()
                .process(checkParamsProcessor)
                .end();
    }
}
