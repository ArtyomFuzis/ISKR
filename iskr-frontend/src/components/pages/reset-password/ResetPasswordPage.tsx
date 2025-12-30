import './ResetPasswordPage.scss';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPasswordConfirm, clearError } from '../../../redux/authSlice';
import type { AppDispatch, RootState } from '../../../redux/store';
import Input from '../../controls/input/Input.tsx';
import PrimaryButton from '../../controls/primary-button/PrimaryButton.tsx';

function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const authError = useSelector((state: RootState) => state.auth.error);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    // Валидация (УБРАЛИ проверку на длину пароля)
    if (!password || !confirmPassword) {
      setLocalError('Заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Пароли не совпадают');
      return;
    }

    if (!token) {
      setLocalError('Недействительная ссылка для сброса пароля');
      return;
    }

    try {
      await dispatch(resetPasswordConfirm({
        Token: token,
        Password: password
      })).unwrap();
      
      setIsSuccess(true);
    } catch (error) {
      console.error('Reset password confirmation error:', error);
    }
  };

  const handleGoToLogin = () => {
    // Используем навигацию с состоянием чтобы передать флаг для открытия модалки
    navigate('/', { state: { showLoginModal: true } });
  };

  const displayError = localError || authError;

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h2 className="reset-password-title">
          {isSuccess ? 'Пароль успешно изменен' : 'Создание нового пароля'}
        </h2>
        
        {isSuccess ? (
          <div className="reset-password-success">
            <p className="reset-password-success-message">
              Ваш пароль был успешно изменен. Теперь вы можете войти в систему с новым паролем.
            </p>
            <PrimaryButton
              label="Войти в систему"
              onClick={handleGoToLogin}
            />
          </div>
        ) : (
          <form className="reset-password-form" onSubmit={handleSubmit}>
            <p className="reset-password-description">
              Придумайте новый пароль для вашего аккаунта
            </p>
            
            <div className="form-group">
              <label htmlFor="password">Новый пароль</label>
              <Input 
                type="password" 
                id="password" 
                value={password}
                onChange={(value: string) => setPassword(value)}
                placeholder="Введите новый пароль"
                disabled={isLoading}
                // Убрали minLength
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите пароль</label>
              <Input 
                type="password" 
                id="confirmPassword" 
                value={confirmPassword}
                onChange={(value: string) => setConfirmPassword(value)}
                placeholder="Повторите новый пароль"
                disabled={isLoading}
                // Убрали minLength
              />
            </div>

            {displayError && (
              <div className="reset-password-error">
                {displayError}
              </div>
            )}

            <PrimaryButton
              label={isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
              type="submit"
              disabled={isLoading}
              onClick={() => {}}
            />
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;