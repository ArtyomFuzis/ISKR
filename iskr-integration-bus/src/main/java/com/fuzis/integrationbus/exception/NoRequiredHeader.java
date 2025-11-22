package com.fuzis.integrationbus.exception;

public class NoRequiredHeader extends RuntimeException {
    public NoRequiredHeader(String message) {
        super(message);
    }
}
