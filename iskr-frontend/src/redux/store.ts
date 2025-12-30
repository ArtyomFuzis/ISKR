import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import goalsReducer from './goalsSlice';
import popularReducer from './popularSlice'; // Добавляем новый reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    goals: goalsReducer,
    popular: popularReducer, // Добавляем
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;