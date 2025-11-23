package com.fuzis.integrationbus.direct;

import com.fuzis.integrationbus.processor.EnrichProcessor;
import org.apache.camel.Exchange;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.converter.stream.ReaderCache;
import org.apache.camel.model.dataformat.JsonLibrary;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class FinalizeDirect extends RouteBuilder {

    private final EnrichProcessor enrichProcessor;

    public FinalizeDirect(EnrichProcessor enrichProcessor) {
        this.enrichProcessor = enrichProcessor;
    }

    @Override
    public void configure() throws Exception {
        from("direct:finalize-request")
                .routeId("finalize-request-direct")
                .process(enrichProcessor)
                .choice()
                    .when(header("X-Debug").isNotEqualTo("true"))
                        .removeHeader("X-Email-Verified")
                        .removeHeader("X-Realm-Roles")
                        .removeHeader("X-Client-Roles")
                        .removeHeader("X-User-SSO-ID")
                        .removeHeader("X-Service-Request")
                        .removeHeader("X-Service")
                        .removeHeader("X-Email")
                        .removeHeader("X-Nickname")
                        .removeHeader("Authorization")
                        .removeHeader("Refresh")
                        .removeHeader("X-Roles-Required")
                        .removeHeader("X-Include-Body")
                        .removeHeader("username")
                        .removeHeader("password")
                        .removeHeader("Cookie")
                        .removeHeader("X-Service-Url")
                .end()
                .process(exchange -> {
                    // Получаем текущее тело сообщения (которое содержит data с ReaderCache)
                    Map<String, Object> body = exchange.getIn().getBody(Map.class);
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    if (data.containsKey("body") && data.get("body") instanceof ReaderCache) {
                        ReaderCache readerCache = (ReaderCache) data.get("body");
                        String content = exchange.getContext().getTypeConverter()
                                .convertTo(String.class, exchange, readerCache);
                        data.put("body", content);
                    }

                })
                .marshal().json()
                .end();
    }
}
