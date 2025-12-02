package com.fuzis.integrationbus.processor;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Component
public class ExceptionProcessor implements Processor {
    private final UnmarshallProcessor unmarshaller;

    public ExceptionProcessor(UnmarshallProcessor unmarshaller) {
        this.unmarshaller = unmarshaller;
    }
    @Override
    public void process(Exchange exchange) throws Exception {
        Exception exception = exchange.getProperty(Exchange.EXCEPTION_CAUGHT, Exception.class);
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("message", exception != null ? exception.getMessage() : "Unknown error");
        errorResponse.put("errorType", exception != null ? exception.getClass().getSimpleName() : "Unknown");
        if (exception != null && exception.getCause() != null) {
            errorResponse.put("rootCause", exception.getCause().getMessage());
        }
        if(exchange.getIn().getHeader("X-Include-Body") != null && exchange.getIn().getHeader("X-Include-Body", Boolean.class) == true) {
            unmarshaller.process(exchange);
            errorResponse.put("body", exchange.getIn().getBody());
        }
        exchange.getIn().setHeader(Exchange.CONTENT_TYPE, "application/json");
        exchange.getIn().setBody(errorResponse);
    }
}
