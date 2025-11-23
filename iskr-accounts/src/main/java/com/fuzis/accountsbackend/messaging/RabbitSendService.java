package com.fuzis.accountsbackend.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.fuzis.accountsbackend.transfer.messaging.EmailDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RabbitSendService {
    @Value("${rabbitmq.messaging_exchange}")
    private String messaging_exchange;


    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    private RabbitSendService(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    Logger log = LoggerFactory.getLogger(RabbitSendService.class);

    public Optional<String> objToJson(Object obj) {
        try {
            String objJackson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
            return Optional.of(objJackson);
        } catch (JsonProcessingException e) {
            log.error("failed conversion: Object to Json", e);
        }
        return Optional.empty();
    }

    public <T> void send_email(EmailDTO<T> message) {
        var msg_json = objToJson(message);
        if (msg_json.isPresent()) {
            Message msg = MessageBuilder.withBody(msg_json.get().getBytes())
                    .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                    .build();
            rabbitTemplate.send(messaging_exchange,message.getRouting_key(),msg);
        } else {
            log.warn("Message was not sent to service: {}", message.toString());
        }
    }

}