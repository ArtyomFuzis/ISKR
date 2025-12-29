import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authAPI, type LoginData, type RegisterData, type UserData } from '../api/authService';

export interface User extends UserData {
  id: string | number;
  username: string;
  nickname?: string;
  email?: string;
  role?: string;
  email_verified?: boolean;
  status?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Безопасная функция для получения данных из localStorage
const getStoredUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

const getStoredToken = (): string | null => {
  const token = localStorage.getItem('token');
  return token && token !== 'undefined' && token !== 'null' ? token : null;
};

const initialState: AuthState = {
  isAuthenticated: !!getStoredToken(),
  user: getStoredUser(),
  token: getStoredToken(),
  isLoading: false,
  error: null,
};

// Асинхронные thunk'и для работы с API
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.data?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Ошибка входа';
      return rejectWithValue(errorMessage);
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.data?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Ошибка регистрации';
      return rejectWithValue(errorMessage);
    }
  }
);

// Добавляем thunk для проверки авторизации
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const userData = await authAPI.getCurrentUser();
      return userData;
    } catch (error: any) {
      // Если не авторизован, очищаем состояние
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const errorMessage = error.response?.status === 404 
        ? 'Сессия истекла' 
        : 'Не авторизован';
      
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state): void => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setUsername: (state, action: PayloadAction<string>): void => {
      if (state.user) {
        state.user.username = action.payload;
        if (state.user.profile) {
          state.user.profile.nickname = action.payload;
        }
        try {
          localStorage.setItem('user', JSON.stringify(state.user));
        } catch (error) {
          console.error('Error saving user to localStorage:', error);
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Логин
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        
        // Безопасное сохранение в localStorage
        try {
          if (action.payload.token) {
            localStorage.setItem('token', action.payload.token);
          }
          if (action.payload.user) {
            localStorage.setItem('user', JSON.stringify(action.payload.user));
          }
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Регистрация
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        
        try {
          if (action.payload.token) {
            localStorage.setItem('token', action.payload.token);
          }
          if (action.payload.user) {
            localStorage.setItem('user', JSON.stringify(action.payload.user));
          }
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Проверка авторизации
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        
        try {
          if (action.payload) {
            localStorage.setItem('user', JSON.stringify(action.payload));
          }
        } catch (error) {
          console.error('Error saving user to localStorage:', error);
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
        
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (error) {
          console.error('Error clearing localStorage:', error);
        }
      });
  },
});

// Экспортируем все actions
export const { logout, setUsername, clearError } = authSlice.actions;

export default authSlice.reducer;