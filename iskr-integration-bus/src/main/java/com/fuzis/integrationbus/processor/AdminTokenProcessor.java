package com.fuzis.integrationbus.processor;

import com.fuzis.integrationbus.configuration.SSOConfiguration;
import com.fuzis.integrationbus.exception.AuthenticationException;
import com.fuzis.integrationbus.exception.ServiceFall;
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
public class AdminTokenProcessor implements Processor {
    private static final Logger log = LoggerFactory.getLogger(AdminTokenProcessor.class);

    private final SSOConfiguration ssoConfiguration;

    private final ProducerTemplate producerTemplate;

    private final ProcessorUtils processorUtils;


    @Autowired
    public AdminTokenProcessor(SSOConfiguration ssoConfiguration, CamelContext camelContext, ProcessorUtils processorUtils) {
        this.ssoConfiguration = ssoConfiguration;
        this.producerTemplate = camelContext.createProducerTemplate();
        this.processorUtils =  processorUtils;
    }

    @Override
    public void process(Exchange exchange) throws Exception {

        String httpEndpoint = ssoConfiguration.getKeycloakUrl() + "/realms/" + ssoConfiguration.getAdminRealm() + "/protocol/openid-connect/token?throwExceptionOnFailure=false";
        Integer return_code = this.processorUtils.ssoRequest(producerTemplate,exchange,httpEndpoint, Map.of(
                "grant_type", "password",
                "client_id", "admin-cli",
                "username", ssoConfiguration.getAdminUser(),
                "password", ssoConfiguration.getAdminPassword()
        ),null, ProcessorUtils.SSORequestBodyType.URLENCODED);
        Map<String, Object> response = exchange.getIn().getBody(Map.class);

        if(return_code != 200){
            if(return_code == 401 && response.containsKey("error") && response.get("error") == "invalid_grant" ){
                throw new AuthenticationException("Invalid tech user credentials");
            }
            throw new ServiceFall("Unable to get tech user token");
        }
        exchange.getIn().setHeader("X-Tech-Token", response.get("access_token"));
    }
}
