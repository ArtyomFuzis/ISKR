import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../../redux/authSlice';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import './ChangeEmailModal.scss';
import profileAPI from '../../../api/profileService';

interface ChangeEmailModalProps {
  open: boolean;
  onClose: () => void;
  currentEmail: string | null;
}

function ChangeEmailModal({ open, onClose, currentEmail }: ChangeEmailModalProps) {
  const [email, setEmail] = useState(currentEmail || '');
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setEmail(currentEmail || '');
  }, [currentEmail]);

  const handleSubmit = async () => {
    if (!confirmation) {
      setError('Подтвердите, что понимаете последствия смены email');
      return;
    }

    if (!email.trim()) {
      setError('Введите email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Введите корректный email адрес');
      return;
    }

    if (email.trim() === (currentEmail || '')) {
      setError('Новый email совпадает с текущим');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await profileAPI.changeEmail(email.trim());
      const result = response.data || response;

      if (result.state === 'OK') {
        // Выходим из аккаунта и переходим на главную
        dispatch(logout());
        navigate('/', { replace: true });
      } else {
        setError(result.message || 'Ошибка при изменении email');
      }
    } catch (err: any) {
      console.error('Error changing email:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка при изменении email');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleClose = () => {
    setEmail(currentEmail || '');
    setConfirmation(false);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="change-email-modal">
        <h2 className="modal-title">Смена email</h2>

        <div className="warning-message">
          <span className="warning-icon">⚠</span>
          <span>
            После смены email ваш аккаунт будет заблокирован до подтверждения нового адреса электронной почты.
            Вы будете автоматически вылогинены из системы.
          </span>
        </div>

        <div className="current-email-info">
          <span className="info-label">Текущий email:</span>
          <span className="info-value">{currentEmail || 'Не установлен'}</span>
        </div>

        <div className="input-group">
          <label htmlFor="email" className="input-label">
            Новый email
          </label>
          <input
            id="email"
            type="email"
            className="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите новый email"
            disabled={loading}
          />
        </div>

        <div className="confirmation-group">
          <label className="confirmation-label">
            <input
              type="checkbox"
              checked={confirmation}
              onChange={(e) => setConfirmation(e.target.checked)}
              disabled={loading}
            />
            <span>
              Я понимаю, что после смены email мой аккаунт будет заблокирован до подтверждения нового адреса,
              и я буду автоматически вылогинен из системы.
            </span>
          </label>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="modal-actions">
          <SecondaryButton
            label="Отмена"
            onClick={handleClose}
            disabled={loading}
          />
          <PrimaryButton
            label={loading ? "Смена email..." : "Сменить email"}
            onClick={handleSubmit}
            disabled={loading || !email.trim() || !confirmation || email.trim() === (currentEmail || '')}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ChangeEmailModal;