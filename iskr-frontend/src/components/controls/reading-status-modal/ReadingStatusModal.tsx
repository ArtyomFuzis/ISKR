import { useState, useEffect } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import Input from '../input/Input';
import './ReadingStatusModal.scss';
import readingService, { type ReadingStatusType, type ReadingStatusResponse } from '../../../api/readingService';

interface ReadingStatusModalProps {
  open: boolean;
  onClose: () => void;
  bookId: number;
  bookTitle: string;
  totalPages: number;
  currentStatus: ReadingStatusResponse | null;
  onStatusUpdated: (status: ReadingStatusResponse) => void;
}

const statusOptions = [
  { value: 'Planning', label: 'Планирую' },
  { value: 'Reading', label: 'Читаю' },
  { value: 'Delayed', label: 'Отложено' },
  { value: 'GaveUp', label: 'Брошено' },
  { value: 'Finished', label: 'Прочитано' },
];

function ReadingStatusModal({
  open,
  onClose,
  bookId,
  bookTitle,
  totalPages,
  currentStatus,
  onStatusUpdated,
}: ReadingStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatusType | ''>('');
  const [pagesReadToday, setPagesReadToday] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Вычисляем оставшееся количество страниц
  const pagesAlreadyRead = currentStatus?.pageRead || 0;
  const pagesRemaining = totalPages - pagesAlreadyRead;
  const isBookFinished = pagesRemaining <= 0 || currentStatus?.readingStatus === 'Finished';

  // Сброс формы при открытии
  useEffect(() => {
    if (open) {
      if (currentStatus) {
        setSelectedStatus(currentStatus.readingStatus);
      } else {
        setSelectedStatus('');
      }
      setPagesReadToday('');
      setError(null);
      setSuccess(null);
    }
  }, [open, currentStatus]);

  // Валидация введенного количества страниц
  const validatePages = (pages: string): boolean => {
    const pagesNum = parseInt(pages);
    if (isNaN(pagesNum) || pagesNum < 0) {
      setError('Введите корректное количество страниц');
      return false;
    }
    if (pagesNum > totalPages) {
      setError(`Количество страниц не может превышать ${totalPages} (всего страниц в книге)`);
      return false;
    }
    // Проверяем, что не пытаемся отметить больше страниц, чем осталось
    if (pagesNum > pagesRemaining) {
      setError(`Нельзя отметить больше страниц, чем осталось. Осталось прочитать: ${pagesRemaining} страниц`);
      return false;
    }
    return true;
  };

  const handleSaveStatus = async () => {
    if (!selectedStatus) {
      setError('Выберите статус чтения');
      return;
    }

    // Если книга уже полностью прочитана и пытаемся добавить прогресс - показываем ошибку
    if (isBookFinished && pagesReadToday.trim() && parseInt(pagesReadToday) > 0) {
      setError('Книга уже полностью прочитана. Невозможно добавить прогресс.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let updatedStatus: ReadingStatusResponse;

      if (!currentStatus) {
        // Создаем новый статус
        updatedStatus = await readingService.createReadingStatus(bookId, selectedStatus);
        setSuccess('Статус чтения успешно создан');
      } else {
        // Обновляем существующий статус
        updatedStatus = await readingService.updateReadingStatus(bookId, selectedStatus);
        setSuccess('Статус чтения успешно обновлен');
      }

      // Если ввели страницы и книга еще не полностью прочитана, добавляем прогресс
      if (pagesReadToday.trim() && parseInt(pagesReadToday) > 0) {
        if (!isBookFinished) {
          if (validatePages(pagesReadToday)) {
            const pagesNum = parseInt(pagesReadToday);
            try {
              updatedStatus = await readingService.addReadingProgress(bookId, pagesNum);
              setSuccess(prev => prev ? `${prev} и прогресс добавлен` : 'Прогресс чтения добавлен');
            } catch (progressError: any) {
              // Если ошибка при добавлении прогресса, все равно обновляем статус
              console.error('Error adding progress:', progressError);
              if (progressError.response?.data?.data?.details?.state === 'Fail_BadData') {
                setError(progressError.response.data.data.details.message || 'Неверное количество страниц');
              }
            }
          } else {
            // Если валидация не прошла, все равно сохраняем обновленный статус
            onStatusUpdated(updatedStatus);
            setLoading(false);
            return;
          }
        }
      }

      onStatusUpdated(updatedStatus);
      
      // Закрываем модальное окно через 2 секунды после успешного сохранения
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error updating reading status:', err);
      
      if (err.response?.data?.data?.details) {
        const errorDetails = err.response.data.data.details;
        setError(errorDetails.message || 'Ошибка обновления статуса чтения');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка обновления статуса чтения');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePagesChange = (value: string) => {
    // Разрешаем только цифры
    const numericValue = value.replace(/[^0-9]/g, '');
    setPagesReadToday(numericValue);
    
    // Очищаем ошибку при вводе
    if (error?.includes('страниц')) {
      setError(null);
    }
  };

  const getStatusDescription = (status: ReadingStatusType | ''): string => {
    switch (status) {
      case 'Planning': return 'Книга запланирована к прочтению';
      case 'Reading': return 'В процессе чтения';
      case 'Delayed': return 'Чтение отложено';
      case 'GaveUp': return 'Чтение прекращено';
      case 'Finished': return 'Книга прочитана полностью';
      default: return 'Выберите статус чтения';
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="reading-status-modal">
        <h2>Статус чтения книги</h2>
        <p className="book-title">{bookTitle}</p>
        
        <div className="current-status-info">
          {currentStatus ? (
            <div className="status-info">
              <span className="status-label">Текущий статус:</span>
              <span className={`status-value status-${currentStatus.readingStatus.toLowerCase()}`}>
                {statusOptions.find(opt => opt.value === currentStatus.readingStatus)?.label}
              </span>
              <div className="progress-info">
                <span>Прочитано страниц: {currentStatus.pageRead} из {currentStatus.bookPageCnt}</span>
                {currentStatus.lastReadDate && (
                  <span className="last-read">
                    Последнее чтение: {new Date(currentStatus.lastReadDate).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="no-status-info">
              Вы еще не начали читать эту книгу
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label required">
              Новый статус чтения
            </label>
            <div className="status-options">
              {statusOptions.map((option) => (
                <label key={option.value} className={`status-option ${selectedStatus === option.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="readingStatus"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value as ReadingStatusType);
                      setError(null);
                    }}
                    disabled={loading}
                  />
                  <span className="option-label">{option.label}</span>
                </label>
              ))}
            </div>
            <div className="status-description">
              {getStatusDescription(selectedStatus)}
            </div>
          </div>

          {/* Показываем поле ввода страниц только если книга еще не полностью прочитана */}
          {selectedStatus && selectedStatus !== '' && !isBookFinished && (
            <div className="form-group">
              <label className="form-label">
                Страниц прочитано сегодня
              </label>
              <Input
                type="number"
                value={pagesReadToday}
                onChange={handlePagesChange}
                placeholder={`Введите количество страниц (макс. ${pagesRemaining})`}
                disabled={loading}
                min="0"
                max={pagesRemaining.toString()}
              />
              <div className="hint">
                Всего страниц в книге: {totalPages}
                <span className="pages-left">
                  Осталось прочитать: {pagesRemaining} страниц
                </span>
              </div>
            </div>
          )}

          {/* Сообщение, если книга уже полностью прочитана */}
          {isBookFinished && selectedStatus && selectedStatus !== '' && (
            <div className="form-group">
              <div className="status-description" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                Книга уже полностью прочитана ({pagesAlreadyRead} из {totalPages} страниц). 
                {selectedStatus !== 'Finished' && ' Вы можете изменить статус, но нельзя добавить прогресс.'}
              </div>
            </div>
          )}
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
            onClick={onClose}
            disabled={loading}
          />
          <PrimaryButton
            label={loading ? "Сохранение..." : (currentStatus ? "Обновить статус" : "Сохранить статус")}
            onClick={handleSaveStatus}
            disabled={loading || !selectedStatus}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ReadingStatusModal;