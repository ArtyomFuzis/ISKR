import { useState, useEffect } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import Stars from '../../stars/Stars';
import './ReviewModal.scss';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (score: number, reviewText: string) => Promise<void>;
  initialScore?: number;
  initialReviewText?: string;
  loading?: boolean;
}

function ReviewModal({ 
  open, 
  onClose, 
  onSubmit, 
  initialScore = 0,
  initialReviewText = '',
  loading = false
}: ReviewModalProps) {
  const [score, setScore] = useState(initialScore);
  const [reviewText, setReviewText] = useState(initialReviewText);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setScore(initialScore);
      setReviewText(initialReviewText);
      setError(null);
    }
  }, [open, initialScore, initialReviewText]);

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      setError('Текст отзыва не может быть пустым');
      return;
    }

    if (score === 0) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }

    try {
      await onSubmit(score, reviewText.trim());
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении отзыва');
    }
  };

  const handleClose = () => {
    setScore(initialScore);
    setReviewText(initialReviewText);
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="review-modal">
        <h2 className="modal-title">
          {initialReviewText ? 'Редактировать отзыв' : 'Написать отзыв'}
        </h2>

        <div className="rating-section">
          <label className="rating-label">Ваша оценка:</label>
          <Stars 
            count={score} 
            onChange={setScore} 
            size="large"
            showValue={true}
          />
        </div>

        <div className="review-text-section">
          <label htmlFor="review-text" className="review-text-label">
            Текст отзыва * {/* Оставили только одну звездочку */}
          </label>
          <textarea
            id="review-text"
            className="review-textarea"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            disabled={loading}
            rows={6}
            placeholder="Напишите ваш отзыв о книге..."
            maxLength={1000}
          />
          <div className="character-counter">
            {reviewText.length}/1000 символов
          </div>
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
            label={loading ? "Сохранение..." : "Сохранить"}
            onClick={handleSubmit}
            disabled={loading || !reviewText.trim() || score === 0}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ReviewModal;