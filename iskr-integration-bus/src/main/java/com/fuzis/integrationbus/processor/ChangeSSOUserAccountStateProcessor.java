package com.fuzis.integrationbus.processor;

import com.fuzis.integrationbus.configuration.SSOConfiguration;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ChangeSSOUserAccountStateProcessor implements Processor {
    private static final Logger log = LoggerFactory.getLogger(ChangeSSOUserAccountStateProcessor.class);

    private final SSOConfiguration ssoConfiguration;

    private final ProducerTemplate producerTemplate;

    private final ProcessorUtils processorUtils;

    private final AdminTokenProcessor adminTokenProcessor;

    @Autowired
    public ChangeSSOUserAccountStateProcessor(SSOConfiguration ssoConfiguration, CamelContext camelContext, ProcessorUtils processorUtils, AdminTokenProcessor adminTokenProcessor) {
        this.ssoConfiguration = ssoConfiguration;
        this.producerTemplate = camelContext.createProducerTemplate();
        this.processorUtils =  processorUtils;
        this.adminTokenProcessor = adminTokenProcessor;
    }

    @Override
    public void process(Exchange exchange) throws Exception {
        this.adminTokenProcessor.process(exchange);
        String httpEndpoint = ssoConfiguration.getKeycloakUrl() + "/admin/realms/" + ssoConfiguration.getRealm() + "/users/"+
                exchange.getIn().getHeader("X-User-SSO-ID", String.class)+"?throwExceptionOnFailure=false";
        Map<String, Object> body = new HashMap<>();
        if(exchange.getIn().getHeader("X-Account-Banned") != null &&  exchange.getIn().getHeader("X-Account-Banned").equals("true")){
            body.put("requiredActions", List.of("CONFIGURE_TOTP"));
        }
        else body.put("requiredActions", new ArrayList<>());
        Integer return_code = this.processorUtils.ssoRequest(producerTemplate,exchange,httpEndpoint, body,Map.of(
                "Authorization", "Bearer "+exchange.getIn().getHeader("X-Tech-Token"),
                Exchange.HTTP_METHOD, "PUT"
        ), ProcessorUtils.SSORequestBodyType.JSON);
        exchange.getIn().removeHeader("X-Tech-Token");
        if(return_code != 204){
            throw new ServiceFall("Unable to process changing params in SSO");
        }
    }
}
