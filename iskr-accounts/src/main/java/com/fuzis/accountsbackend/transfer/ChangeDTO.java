package com.fuzis.accountsbackend.transfer;

import com.fuzis.accountsbackend.transfer.state.State;
import jakarta.annotation.Nullable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ChangeDTO<T> implements Serializable, IStateDTO{
    private State state;
    private String message;
    @Nullable
    T key;
}
