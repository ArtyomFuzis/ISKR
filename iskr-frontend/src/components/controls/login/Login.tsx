import './Login.scss';
import Input from "../input/Input.tsx";
import PrimaryButton from "../primary-button/PrimaryButton.tsx";
import {useState, useEffect} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { login, signUp, clearError, clearRegistrationSuccess } from "../../../redux/authSlice.ts";
import { setDailyGoal, setYearlyGoal, setDailyRead, setYearlyRead } from "../../../redux/goalsSlice.ts";
import type { RootState } from '../../../redux/store';
import type { AppDispatch } from '../../../redux/store';

interface LoginProps {
  type: 'login' | 'signup';
  onSubmit?: () => void;
  titleId?: string;
  onSwitchType?: () => void;
  onForgotPassword?: () => void;
}

function Login({ type: initialType, onSubmit, titleId, onSwitchType, onForgotPassword }: LoginProps) {
  const [type, setType] = useState<'login' | 'signup'>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string>('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const authError = useSelector((state: RootState) => state.auth.error);
  const authLoading = useSelector((state: RootState) => state.auth.isLoading);
  const authRegistrationSuccess = useSelector((state: RootState) => state.auth.registrationSuccess);

  // Сбрасываем ошибки при изменении типа формы
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearRegistrationSuccess());
    setLocalError('');
    setRegistrationSuccess(false);
  }, [type, dispatch]);

  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  useEffect(() => {
    if (authRegistrationSuccess) {
      setRegistrationSuccess(true);
    }
  }, [authRegistrationSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());
    
    const formData = new FormData(e.currentTarget);

    if (type === 'login') {
      const identifier = formData.get('identifier') as string;
      const password = formData.get('password') as string;

      // Валидация
      if (!identifier || !password) {
        setLocalError('Заполните все поля');
        return;
      }

      // Для OAPI отправляем username
      let username = identifier;
      
      try {
        setIsLoading(true);
        
        await dispatch(login({ 
          username, 
          password 
        })).unwrap();

        // После успешного логина
        // TODO: загрузить реальные цели с бэкенда
        dispatch(setDailyGoal(30));
        dispatch(setDailyRead(0));
        dispatch(setYearlyGoal(12));
        dispatch(setYearlyRead(0));
        
        if (onSubmit) {
          onSubmit();
        }
      } catch (error) {
        console.error('Login error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      const nickname = formData.get('nickname') as string;
      const email = formData.get('email') as string;
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirm-password') as string;

      // Валидация (убрана проверка длины пароля)
      if (!nickname || !email || !username || !password || !confirmPassword) {
        setLocalError('Заполните все поля');
        return;
      }

      if (password !== confirmPassword) {
        setLocalError('Пароли не совпадают');
        return;
      }

      if (username.length < 3) {
        setLocalError('Имя пользователя должно быть не менее 3 символов');
        return;
      }

      try {
        setIsLoading(true);
        
        await dispatch(signUp({ 
          Nickname: nickname,
          Email: email,
          Username: username,
          Password: password
        })).unwrap();

        // После успешной регистрации НЕ устанавливаем цели - пользователь еще не вошел
        // Ждем подтверждения email
      } catch (error) {
        console.error('Signup error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSwitchType = () => {
    setType(type === 'login' ? 'signup' : 'login');
    setRegistrationSuccess(false);
    if (onSwitchType) {
      onSwitchType();
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  const handleCloseModal = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  const displayError = localError || authError;
  const loading = isLoading || authLoading;

  return (
    <div className="login-container">
      <h2 className="login-title" id={titleId}>
        {type === 'login' ? 'Войти' : 'Регистрация'}
      </h2>
      
      {type === 'signup' && registrationSuccess ? (
        <div className="registration-success">
          <p className="registration-success-message">
            Аккаунт успешно создан! На указанный email было отправлено письмо для подтверждения.
          </p>
          <p className="registration-success-note">
            Пожалуйста, проверьте вашу почту и подтвердите email. После подтверждения вы сможете войти в аккаунт.
          </p>
          <PrimaryButton
            label="Закрыть"
            onClick={handleCloseModal}
          />
        </div>
      ) : (
        <>
          <form className="login-form" onSubmit={handleSubmit}>
            {type === 'signup' && (
              <>
                <label htmlFor="nickname">Никнейм</label>
                <Input 
                  type="text" 
                  id="nickname" 
                  name="nickname" 
                  required 
                  placeholder="Ваш никнейм"
                  disabled={loading}
                  minLength={2}
                />

                <label htmlFor="email">Электронная почта</label>
                <Input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  placeholder="example@mail.com"
                  disabled={loading}
                />

                <label htmlFor="username">Имя пользователя</label>
                <Input 
                  type="text" 
                  id="username" 
                  name="username" 
                  required 
                  placeholder="username"
                  disabled={loading}
                  minLength={3}
                />
              </>
            )}

            {type === 'login' && (
              <>
                <label htmlFor="identifier">Имя пользователя или электронная почта</label>
                <Input 
                  type="text" 
                  id="identifier" 
                  name="identifier" 
                  required 
                  placeholder="example@mail.com"
                  disabled={loading}
                />
              </>
            )}

            <label htmlFor="password">Пароль</label>
            <Input 
              type="password" 
              id="password" 
              name="password" 
              required 
              placeholder="********"
              disabled={loading}
              // Убрали minLength
            />

            {type === 'signup' && (
              <>
                <label htmlFor="confirm-password">Подтвердите пароль</label>
                <Input 
                  type="password" 
                  id="confirm-password" 
                  name="confirm-password" 
                  required 
                  placeholder="********"
                  disabled={loading}
                  // Убрали minLength
                />
              </>
            )}

            {displayError && (
              <div className="login-error">
                {displayError}
              </div>
            )}

            <PrimaryButton
              label={loading ? 'Загрузка...' : (type === 'login' ? 'Войти' : 'Зарегистрироваться')}
              type="submit"
              disabled={loading}
              onClick={() => {}}
            />
          </form>

          <div className="login-footer">
            {type === 'login' ? (
              <>
                <div className="login-footer-left">
                  <button 
                    onClick={handleSwitchType} 
                    className="login-switch-button"
                    disabled={loading}
                    type="button"
                  >
                    Зарегистрироваться
                  </button>
                </div>
                <div className="login-footer-right">
                  <button 
                    onClick={handleForgotPassword} 
                    className="login-forgot-button"
                    disabled={loading}
                    type="button"
                  >
                    Забыли пароль?
                  </button>
                </div>
              </>
            ) : (
              <div className="login-footer-left">
                <button 
                  onClick={handleSwitchType} 
                  className="login-switch-button"
                  disabled={loading}
                  type="button"
                >
                  Войти
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Login;