import { useState, useEffect } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import './ChangeNicknameModal.scss';
import profileAPI from '../../../api/profileService';

interface ChangeNicknameModalProps {
  open: boolean;
  onClose: () => void;
  currentNickname: string | null;
  onSuccess: (newNickname: string) => void;
}

function ChangeNicknameModal({ open, onClose, currentNickname, onSuccess }: ChangeNicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNickname(currentNickname || '');
  }, [currentNickname]);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setError('Введите никнейм');
      return;
    }

    if (nickname.length > 255) {
      setError('Никнейм не должен превышать 255 символов');
      return;
    }

    if (nickname.trim() === (currentNickname || '')) {
      setError('Новый никнейм совпадает с текущим');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await profileAPI.changeNickname(nickname.trim());
      const result = response.data || response;

      if (result.state === 'OK') {
        setSuccess('Никнейм успешно изменен');
        setTimeout(() => {
          onSuccess(nickname.trim());
          handleClose();
        }, 1500);
      } else {
        setError(result.message || 'Ошибка при изменении никнейма');
      }
    } catch (err: any) {
      console.error('Error changing nickname:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка при изменении никнейма');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNickname(currentNickname || '');
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="change-nickname-modal">
        <h2 className="modal-title">Смена никнейма</h2>

        <div className="current-nickname-info">
          <span className="info-label">Текущий никнейм:</span>
          <span className="info-value">{currentNickname || 'Не установлен'}</span>
        </div>

        <div className="input-group">
          <label htmlFor="nickname" className="input-label">
            Новый никнейм
          </label>
          <input
            id="nickname"
            type="text"
            className="nickname-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Введите новый никнейм"
            disabled={loading}
            maxLength={255}
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
            disabled={loading || !nickname.trim() || nickname.trim() === (currentNickname || '')}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ChangeNicknameModal;