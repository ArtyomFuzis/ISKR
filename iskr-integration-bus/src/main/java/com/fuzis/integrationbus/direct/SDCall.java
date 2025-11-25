package com.fuzis.integrationbus.direct;

import com.fuzis.integrationbus.exception.ServiceDiscoveryFailed;
import com.fuzis.integrationbus.util.ServiceDiscovery;
import org.apache.camel.Exchange;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.dataformat.JsonLibrary;
import org.springframework.stereotype.Component;

@Component
public class SDCall extends RouteBuilder
{
    private final ServiceDiscovery serviceDiscovery;

    public SDCall(ServiceDiscovery serviceDiscovery)
    {
        this.serviceDiscovery = serviceDiscovery;
    }

    @Override
    public void configure() throws Exception {
        from("direct:sd-call")
                .routeId("sd-call-direct")
                .onException(ServiceDiscoveryFailed.class)
                    .handled(true)
                    .to("direct:error-sd-fail-handler")
                .end()
                .removeHeader(Exchange.HTTP_PATH)
                .removeHeader(Exchange.HTTP_URI)
                .removeHeader(Exchange.HTTP_URL)
                .choice()
                    .when(header("X-Service").isEqualTo("Accounts"))
                    .setHeader("X-Service-Url", method(serviceDiscovery, "getAccountsServiceUrl"))
                    .when(header("X-Service").isEqualTo("Integration"))
                    .setHeader("X-Service-Url", method(serviceDiscovery, "getIntegrationUrl"))
                .end()
                .toD("${header.X-Service-Url}/${header.X-Service-Request}?bridgeEndpoint=true&throwExceptionOnFailure=false")
                .end();
    }
}
