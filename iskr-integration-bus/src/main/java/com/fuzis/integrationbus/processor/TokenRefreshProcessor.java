package com.fuzis.integrationbus.processor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fuzis.integrationbus.configuration.SSOConfiguration;
import com.fuzis.integrationbus.exception.AuthenticationException;
import com.fuzis.integrationbus.exception.NoRequiredHeader;
import com.fuzis.integrationbus.exception.ServiceFall;
import com.fuzis.integrationbus.util.FormatEncoder;
import com.fuzis.integrationbus.util.ProcessorUtils;
import org.apache.camel.CamelContext;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.apache.camel.ProducerTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class TokenRefreshProcessor implements Processor
{

    private final SSOConfiguration ssoConfiguration;

    private final ProducerTemplate producerTemplate;

    private final ProcessorUtils processorUtils;

    private final FormatEncoder formatEncoder;

    @Autowired
    public TokenRefreshProcessor(SSOConfiguration ssoConfiguration, CamelContext camelContext, FormatEncoder formatEncoder, ProcessorUtils processorUtils) {
        this.ssoConfiguration = ssoConfiguration;
        this.producerTemplate = camelContext.createProducerTemplate();
        this.formatEncoder = formatEncoder;
        this.processorUtils = processorUtils;
    }

    @Override
    public void process(Exchange exchange) throws Exception {

        String httpEndpoint = ssoConfiguration.getKeycloakUrl() + "/realms/" + ssoConfiguration.getRealm() + "/protocol/openid-connect/token?throwExceptionOnFailure=false";

        Integer return_code = this.processorUtils.ssoRequest(producerTemplate,exchange,httpEndpoint,Map.of(
                "grant_type", "refresh_token",
                "client_id", ssoConfiguration.getService(),
                "client_secret", ssoConfiguration.getSecret(),
                "refresh_token", exchange.getIn().getHeader("Refresh", String.class)
        ),null, ProcessorUtils.SSORequestBodyType.URLENCODED);
        Map<String, Object> response =  exchange.getIn().getBody(Map.class);

        if(return_code != 200){
            throw new ServiceFall("Unable to refresh token");
        }
        exchange.getIn().setHeader("Authorization", response.get("access_token"));
        exchange.getIn().setHeader("Refresh", response.get("refresh_token"));
        exchange.getIn().setHeader("X-Session-ID", response.get("session_state"));
        exchange.getIn().setHeader("Set-Cookie", formatEncoder.makeBaseCookies(Map.of(
                "Authorization", response.get("access_token"),
                "Refresh", response.get("refresh_token")
        )));
    }
}
