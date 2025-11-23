-- liquibase formatted sql
-- changeset fuzis:1
DELETE FROM ACCOUNTS.TOKEN_TYPES WHERE tt_id IN (1,2,3);