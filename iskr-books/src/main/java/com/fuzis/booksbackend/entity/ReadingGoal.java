package com.fuzis.booksbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "READING_GOALS", schema = "BOOKS")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pgoal_id")
    private Integer pgoalId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "period", nullable = false, length = 20)
    private String period;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "goal_type", nullable = false, length = 50)
    private String goalType;

    @Column(name = "current_progress", nullable = false)
    private Integer currentProgress = 0;
}