package com.fuzis.integrationbus.processor;

import com.fuzis.integrationbus.util.FormatEncoder;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ParseCookieProcessor implements Processor
{
    private final FormatEncoder formatEncoder;

    @Autowired
    public ParseCookieProcessor(FormatEncoder formatEncoder){
        this.formatEncoder = formatEncoder;
    }

    @Override
    public void process(Exchange exchange) throws Exception {
        Map<String,String> cookies = formatEncoder.parseCookie(exchange.getIn().getHeader("Cookie",  String.class));
        for (var el :  cookies.entrySet()){
            exchange.getIn().setHeader(el.getKey(), el.getValue());
        }
    }
}
