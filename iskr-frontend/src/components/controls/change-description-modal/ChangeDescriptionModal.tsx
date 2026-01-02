import { useState, useEffect } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import './ChangeDescriptionModal.scss';
import profileAPI from '../../../api/profileService';

interface ChangeDescriptionModalProps {
  open: boolean;
  onClose: () => void;
  currentDescription: string | null;
  onSuccess: (newDescription: string) => void;
}

function ChangeDescriptionModal({ open, onClose, currentDescription, onSuccess }: ChangeDescriptionModalProps) {
  const [description, setDescription] = useState(currentDescription || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDescription(currentDescription || '');
  }, [currentDescription]);

  const handleSubmit = async () => {
    if (description.length > 1024) {
      setError('Описание не должно превышать 1024 символа');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await profileAPI.changeProfileDescription(description);
      const result = response.data || response;

      if (result.state === 'OK') {
        setSuccess('Описание профиля успешно изменено');
        setTimeout(() => {
          onSuccess(description);
          handleClose();
        }, 1500);
      } else {
        setError(result.message || 'Ошибка при изменении описания');
      }
    } catch (err: any) {
      console.error('Error changing description:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка при изменении описания');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription(currentDescription || '');
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  const charactersLeft = 1024 - description.length;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="change-description-modal">
        <h2 className="modal-title">Редактирование описания профиля</h2>

        <div className="input-group">
          <label htmlFor="description" className="input-label">
            Описание профиля
          </label>
          <textarea
            id="description"
            className="description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Расскажите о себе"
            disabled={loading}
            rows={6}
            maxLength={1024}
          />
          <div className="character-counter">
            {charactersLeft} символов осталось
          </div>
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
            disabled={loading || description === (currentDescription || '')}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ChangeDescriptionModal;