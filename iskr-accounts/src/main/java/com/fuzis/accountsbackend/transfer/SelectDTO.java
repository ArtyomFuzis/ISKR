package com.fuzis.accountsbackend.transfer;

import com.fuzis.accountsbackend.transfer.state.State;
import jakarta.annotation.Nullable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class SelectDTO <T> implements Serializable, IStateDTO{
    private State state;
    @Nullable
    private T data;
    private String error;
}
