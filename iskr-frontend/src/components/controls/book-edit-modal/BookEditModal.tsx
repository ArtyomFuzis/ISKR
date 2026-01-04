// /src/components/controls/book-edit-modal/BookEditModal.tsx
import { useState, useEffect } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import './BookEditModal.scss';
import bookAPI from '../../../api/bookService';
import type { BookDetail, UpdateBookData } from '../../../api/bookService';

interface BookEditModalProps {
  open: boolean;
  onClose: () => void;
  book: BookDetail;
  onBookUpdated: () => Promise<void>;
}

function BookEditModal({ open, onClose, book, onBookUpdated }: BookEditModalProps) {
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle || '');
  const [description, setDescription] = useState(book.description || '');
  const [isbn, setIsbn] = useState(book.isbn);
  const [pageCnt, setPageCnt] = useState(book.pageCnt.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setTitle(book.title);
    setSubtitle(book.subtitle || '');
    setDescription(book.description || '');
    setIsbn(book.isbn);
    setPageCnt(book.pageCnt.toString());
    setError(null);
    setSuccess(null);
  }, [book]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Заголовок не может быть пустым');
      return;
    }

    const pageCntNum = parseInt(pageCnt, 10);
    if (isNaN(pageCntNum) || pageCntNum <= 0) {
      setError('Количество страниц должно быть положительным числом');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UpdateBookData = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        isbn: isbn.trim() || null,
        pageCnt: pageCntNum,
      };

      await bookAPI.updateBook(book.bookId, updateData);
      setSuccess('Информация о книге успешно обновлена');
      
      // Ждем немного, чтобы показать сообщение об успехе, затем обновляем данные книги и закрываем
      setTimeout(async () => {
        try {
          await onBookUpdated();
        } finally {
          onClose();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error updating book:', err);
      
      // Обработка специфичных ошибок
      if (err.response?.data?.data?.details) {
        const errorDetails = err.response.data.data.details;
        if (errorDetails.state === 'Fail_Conflict') {
          if (errorDetails.message === 'Book with this ISBN already exists') {
            setError('Книга с таким ISBN уже существует');
          } else if (errorDetails.message === 'A book with this title and subtitle combination already exists') {
            setError('Книга с таким заголовком и подзаголовком уже существует');
          } else {
            setError(errorDetails.message || 'Ошибка обновления книги');
          }
        } else {
          setError(errorDetails.message || 'Ошибка обновления книги');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка обновления книги');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(book.title);
    setSubtitle(book.subtitle || '');
    setDescription(book.description || '');
    setIsbn(book.isbn);
    setPageCnt(book.pageCnt.toString());
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="book-edit-modal">
        <h2 className="modal-title">Редактирование информации о книге</h2>

        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Заголовок *
          </label>
          <input
            id="title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="subtitle" className="form-label">
            Подзаголовок
          </label>
          <input
            id="subtitle"
            type="text"
            className="form-input"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            disabled={loading}
            placeholder="Необязательно"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Описание
          </label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={5}
            placeholder="Описание книги"
          />
        </div>

        <div className="form-group">
          <label htmlFor="pageCnt" className="form-label">
            Количество страниц *
          </label>
          <input
            id="pageCnt"
            type="number"
            className="form-input"
            value={pageCnt}
            onChange={(e) => setPageCnt(e.target.value)}
            disabled={loading}
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="isbn" className="form-label">
            ISBN
          </label>
          <input
            id="isbn"
            type="text"
            className="form-input"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            disabled={loading}
            placeholder="Необязательно"
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
            disabled={loading || !title.trim()}
          />
        </div>
      </div>
    </Modal>
  );
}

export default BookEditModal;