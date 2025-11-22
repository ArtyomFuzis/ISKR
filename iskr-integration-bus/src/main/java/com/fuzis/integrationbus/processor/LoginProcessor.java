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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class LoginProcessor implements Processor {

    private final SSOConfiguration ssoConfiguration;

    private final ProducerTemplate producerTemplate;

    private final FormatEncoder formatEncoder;

    private final ProcessorUtils processorUtils;

    @Autowired
    public LoginProcessor(SSOConfiguration ssoConfiguration, CamelContext camelContext, FormatEncoder formatEncoder, ProcessorUtils processorUtils) {
        this.ssoConfiguration = ssoConfiguration;
        this.producerTemplate = camelContext.createProducerTemplate();
        this.formatEncoder = formatEncoder;
        this.processorUtils = processorUtils;
    }

    @Override
    public void process(Exchange exchange) throws Exception {

        if(exchange.getIn().getHeader("username") == null){
            throw new NoRequiredHeader("Missing required header 'username'");
        }

        if(exchange.getIn().getHeader("password") == null){
            throw new NoRequiredHeader("Missing required header 'password'");
        }

        String httpEndpoint = ssoConfiguration.getKeycloakUrl() + "/realms/" + ssoConfiguration.getRealm() + "/protocol/openid-connect/token?throwExceptionOnFailure=false";

        Integer return_code = this.processorUtils.ssoRequest(producerTemplate,exchange,httpEndpoint,Map.of(
                "grant_type", "password",
                "client_id", ssoConfiguration.getService(),
                "client_secret", ssoConfiguration.getSecret(),
                "username", exchange.getIn().getHeader("username", String.class),
                "password", exchange.getIn().getHeader("password", String.class)
        ),null, ProcessorUtils.SSORequestBodyType.URLENCODED);
        Map<String, Object> response =  exchange.getIn().getBody(Map.class);
        if(return_code != 200){
            if(return_code == 401 && response.containsKey("error") && response.get("error") == "invalid_grant" ){
                throw new AuthenticationException("Invalid credentials");
            }
           throw new ServiceFall("Unable to get token");
        }
        exchange.getIn().setHeader("Authorization", response.get("access_token"));
        exchange.getIn().setHeader("Refresh", response.get("refresh_token"));
        exchange.getIn().setHeader("Set-Cookie", formatEncoder.makeBaseCookies(Map.of(
                "Authorization", response.get("access_token"),
                "Refresh", response.get("refresh_token")
        )));
    }
}
