package com.fuzis.booksbackend.transfer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResultDTO {
    private Integer subscriptionId;
    private Integer userId;
    private Integer subscribedToUserId;
}