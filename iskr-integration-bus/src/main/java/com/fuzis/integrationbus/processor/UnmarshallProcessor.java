package com.fuzis.integrationbus.processor;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.apache.camel.converter.stream.InputStreamCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class UnmarshallProcessor implements Processor {

    private final Logger log =  LoggerFactory.getLogger(UnmarshallProcessor.class);

    private final ObjectMapper objectMapper;

    public UnmarshallProcessor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void process(Exchange exchange) throws Exception {
        try {
            Map test_map = exchange.getIn().getBody(Map.class);
            if(test_map != null) return;
            InputStreamCache cache = exchange.getIn().getBody(InputStreamCache.class);
            String content;
            if (cache == null) {
                content = exchange.getIn().getBody(String.class);
            }
            else{
                content = new String(cache.readAllBytes(), StandardCharsets.UTF_8);
            }

            if (content == null || content.trim().isEmpty()) {
                return;
            }
            try {
                Map result = objectMapper.readValue(content, Map.class);
                exchange.getIn().setBody(result);
            }
            catch (Exception ignored) {
                exchange.getIn().setBody(content);
            }
        }
        catch (Exception ignored) {

        }
    }
}
