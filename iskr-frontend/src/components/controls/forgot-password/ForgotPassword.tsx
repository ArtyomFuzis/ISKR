import './ForgotPassword.scss';
import Input from "../input/Input.tsx";
import PrimaryButton from "../primary-button/PrimaryButton.tsx";
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearError } from "../../../redux/authSlice.ts";
import type { RootState } from '../../../redux/store';
import type { AppDispatch } from '../../../redux/store';

interface ForgotPasswordProps {
  onClose?: () => void;
  onBackToLogin?: () => void; // Новый пропс для возврата к форме входа
  titleId?: string;
}

function ForgotPassword({ onClose, onBackToLogin, titleId }: ForgotPasswordProps) {
  const [login, setLogin] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string>('');
  
  const dispatch = useDispatch<AppDispatch>();
  const authError = useSelector((state: RootState) => state.auth.error);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    if (!login.trim()) {
      setLocalError('Введите имя пользователя или email');
      return;
    }

    try {
      // Используем login как username для запроса
      await dispatch(resetPassword(login)).unwrap();
      setIsSubmitted(true);
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="forgot-password-container">
      <h2 className="forgot-password-title" id={titleId}>
        Восстановление пароля
      </h2>
      
      {isSubmitted ? (
        <div className="forgot-password-success">
          <p className="forgot-password-success-message">
            Если пользователь с таким именем существует, на его email было отправлено письмо с инструкциями по восстановлению пароля.
          </p>
          <p className="forgot-password-success-note">
            Проверьте папку "Спам", если письмо не пришло в течение нескольких минут.
          </p>
          <PrimaryButton
            label="Закрыть"
            onClick={onClose}
          />
        </div>
      ) : (
        <>
          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <p className="forgot-password-description">
              Введите имя пользователя или email, и мы отправим инструкции по восстановлению пароля
            </p>
            
            <label htmlFor="login">Имя пользователя или email</label>
            <Input 
              type="text" 
              id="login" 
              name="login" 
              required 
              value={login}
              onChange={(value: string) => setLogin(value)}
              placeholder="example@mail.com или username"
              disabled={isLoading}
            />

            {displayError && (
              <div className="forgot-password-error">
                {displayError}
              </div>
            )}

            <PrimaryButton
              label={isLoading ? 'Отправка...' : 'Отправить инструкции'}
              type="submit"
              disabled={isLoading}
              onClick={() => {}}
            />
          </form>

          <div className="forgot-password-footer">
            <button 
              onClick={onBackToLogin} // Используем onBackToLogin вместо onClose
              className="forgot-password-back"
              type="button"
              disabled={isLoading}
            >
              Назад к входу
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ForgotPassword;