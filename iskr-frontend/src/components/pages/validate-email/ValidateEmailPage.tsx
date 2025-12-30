import './ValidateEmailPage.scss';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { redeemToken, clearError } from '../../../redux/authSlice';
import type { AppDispatch, RootState } from '../../../redux/store';
import PrimaryButton from '../../controls/primary-button/PrimaryButton.tsx';

function ValidateEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [localError, setLocalError] = useState<string>('');
  
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const authError = useSelector((state: RootState) => state.auth.error);
  const emailVerificationSuccess = useSelector((state: RootState) => state.auth.emailVerificationSuccess);

  // При загрузке компонента отправляем запрос на подтверждение email
  useEffect(() => {
    const validateEmail = async () => {
      if (!token) {
        setLocalError('Недействительная ссылка для подтверждения email');
        return;
      }

      setLocalError('');
      dispatch(clearError());

      try {
        await dispatch(redeemToken({
          Token: token
        })).unwrap();
      } catch (error) {
        console.error('Email validation error:', error);
      }
    };

    validateEmail();
  }, [token, dispatch]);

  const handleGoToLogin = () => {
    navigate('/', { state: { showLoginModal: true } });
  };

  const displayError = localError || authError;

  return (
    <div className="validate-email-page">
      <div className="validate-email-container">
        {isLoading ? (
          <div className="validate-email-loading">
            <h2 className="validate-email-title">Проверка email...</h2>
            <p className="validate-email-description">
              Пожалуйста, подождите, идет подтверждение вашего email.
            </p>
          </div>
        ) : emailVerificationSuccess ? (
          <div className="validate-email-success">
            <h2 className="validate-email-title">Email успешно подтвержден!</h2>
            <p className="validate-email-success-message">
              Ваш email был успешно подтвержден. Теперь вы можете войти в свой аккаунт.
            </p>
            <PrimaryButton
              label="Войти в систему"
              onClick={handleGoToLogin}
            />
          </div>
        ) : (
          <div className="validate-email-error">
            <h2 className="validate-email-title">Ошибка подтверждения email</h2>
            {displayError && (
              <div className="validate-email-error-message">
                {displayError}
              </div>
            )}
            <p className="validate-email-error-note">
              Ссылка для подтверждения email недействительна или устарела.
            </p>
            <PrimaryButton
              label="Перейти на главную"
              onClick={() => navigate('/')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidateEmailPage;