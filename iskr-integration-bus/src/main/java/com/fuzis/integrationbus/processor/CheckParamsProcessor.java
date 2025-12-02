package com.fuzis.integrationbus.processor;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CheckParamsProcessor implements Processor {
    @Override
    public void process(Exchange exchange) throws Exception {
        String requiredHeadersStr = exchange.getIn().getHeader("X-Headers-Required", String.class);
        String forbiddenHeadersStr = exchange.getIn().getHeader("X-Headers-Forbidden", String.class);

        if (!(requiredHeadersStr == null || requiredHeadersStr.trim().isEmpty())) {
            List<String> requiredHeaders = Arrays.stream(requiredHeadersStr.split(","))
                    .map(String::trim)
                    .filter(h -> !h.isEmpty())
                    .toList();

            for (String header : requiredHeaders) {
                if (exchange.getIn().getHeader(header) == null) {
                    throw new IllegalStateException("Missing required header: " + header);
                }
            }
        }

        if (!(forbiddenHeadersStr == null || forbiddenHeadersStr.trim().isEmpty())) {
            List<String> forbiddenHeaders = Arrays.stream(forbiddenHeadersStr.split(","))
                    .map(String::trim)
                    .filter(h -> !h.isEmpty())
                    .toList();

            for (String header : forbiddenHeaders) {
                if (exchange.getIn().getHeader(header) != null) {
                    throw new IllegalStateException("Forbidden header: " + header);
                }
            }
        }


    }
}
