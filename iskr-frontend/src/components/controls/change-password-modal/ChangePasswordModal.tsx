import { useState } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import './ChangePasswordModal.scss';
import profileAPI from '../../../api/profileService';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword.trim()) {
      setError('Введите новый пароль');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await profileAPI.changePassword(newPassword.trim());
      const result = response.data || response;

      if (result.state === 'OK') {
        setSuccess('Пароль успешно изменен');
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(result.message || 'Ошибка при изменении пароля');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка при изменении пароля');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="change-password-modal">
        <h2 className="modal-title">Смена пароля</h2>

        <div className="input-group">
          <label htmlFor="new-password" className="input-label">
            Новый пароль
          </label>
          <input
            id="new-password"
            type="password"
            className="password-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Введите новый пароль"
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <div className="input-group">
          <label htmlFor="confirm-password" className="input-label">
            Подтверждение пароля
          </label>
          <input
            id="confirm-password"
            type="password"
            className="password-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повторите новый пароль"
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            <span>{success}</span>
          </div>
        )}

        <div className="modal-actions">
          <SecondaryButton
            label="Отмена"
            onClick={handleClose}
            disabled={loading}
          />
          <PrimaryButton
            label={loading ? "Сохранение..." : "Сохранить"}
            onClick={handleSubmit}
            disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ChangePasswordModal;