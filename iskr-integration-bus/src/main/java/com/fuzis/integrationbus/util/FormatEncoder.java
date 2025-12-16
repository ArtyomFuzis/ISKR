package com.fuzis.integrationbus.util;

import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class FormatEncoder {
    public String encodeMapUrlEncoded(Map<String, Object> map) {
        return map.entrySet()
                .stream()
                .map(entry ->
                        URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8)
                        + "=" +
                        URLEncoder.encode(entry.getValue().toString(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    public Map<String,String> parseCookie(String cookie){
        Map<String,String> cookies = new HashMap<>();
        String[] cookiePairs = cookie.split(";");
        for (String pair : cookiePairs) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length == 2) {
                cookies.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
        return cookies;
    }

    public List<String> makeBaseCookies(Map<String, Object> cookies){
        List<String> cookiesList = new ArrayList<>();
        for(var val: cookies.entrySet()){
            cookiesList.add(val.getKey() + "=" + val.getValue() + "; Path=/; HttpOnly; SameSite=Strict");
        }
        return cookiesList;
    }
}
