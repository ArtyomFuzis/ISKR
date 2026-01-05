package com.fuzis.booksbackend.transfer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoalStatsDTO {
    private Integer totalGoals;
    private Integer completedGoals;
    private Integer inProgressGoals;
    private Integer failedGoals;
}