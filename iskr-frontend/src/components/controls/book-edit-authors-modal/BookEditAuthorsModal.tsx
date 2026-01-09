// /src/components/controls/book-edit-authors-modal/BookEditAuthorsModal.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store.ts";
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import Input from '../input/Input';
import './BookEditAuthorsModal.scss';
import bookAPI from '../../../api/bookService';
import searchAPI from '../../../api/searchService';
import type { BookDetail, UpdateBookData } from '../../../api/bookService';
import type { SearchAuthorData } from '../../../types/search';

interface BookEditAuthorsModalProps {
  open: boolean;
  onClose: () => void;
  book: BookDetail;
  onBookUpdated: () => Promise<void>;
}

function BookEditAuthorsModal({ open, onClose, book, onBookUpdated }: BookEditAuthorsModalProps) {
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [currentAuthors, setCurrentAuthors] = useState(book.authors);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchAuthorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Определяем, является ли книга пользователя своей
  const isMine = currentUser ? book.addedBy.userId === Number(currentUser.id) : false;

  // Поиск авторов с задержкой
  useEffect(() => {
    const searchAuthors = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const authors = await searchAPI.searchAuthors(searchQuery.trim());
        // Исключаем уже добавленных авторов
        const filteredAuthors = authors.filter(
          author => !currentAuthors.some(existing => existing.authorId === author.id)
        );
        setSearchResults(filteredAuthors);
      } catch (err: any) {
        console.error('Error searching authors:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAuthors, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentAuthors]);

  const handleAddAuthor = (author: SearchAuthorData) => {
    if (!currentAuthors.some(a => a.authorId === author.id)) {
      setCurrentAuthors([
        ...currentAuthors,
        {
          authorId: author.id,
          name: author.name,
          realName: author.realName || '',
          birthDate: null,
          description: null
        }
      ]);
      setSearchResults(results => results.filter(a => a.id !== author.id));
    }
  };

  const handleRemoveAuthor = (authorId: number) => {
    setCurrentAuthors(currentAuthors.filter(author => author.authorId !== authorId));
  };

  const handleSave = async () => {
    if (currentAuthors.length === 0) {
      setError('Книга должна иметь хотя бы одного автора');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UpdateBookData = {
        authorIds: currentAuthors.map(a => a.authorId)
      };

      // Используем административный endpoint, если пользователь - администратор и книга не его
      if (isAdmin && !isMine) {
        await bookAPI.updateBookAdmin(book.bookId, updateData);
      } else {
        await bookAPI.updateBook(book.bookId, updateData);
      }
      
      setSuccess('Авторы успешно обновлены');
      
      setTimeout(async () => {
        try {
          await onBookUpdated();
        } finally {
          onClose();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error updating authors:', err);
      
      if (err.response?.data?.data?.details) {
        setError(err.response.data.data.details.message || 'Ошибка обновления авторов');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка обновления авторов');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentAuthors(book.authors);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="book-edit-authors-modal">
        <h2 className="modal-title">
          {isAdmin && !isMine ? 'Редактирование авторов (Администратор)' : 'Редактирование авторов книги'}
        </h2>
        {isAdmin && !isMine && (
          <p className="admin-notice">
            Вы редактируете авторов книги как администратор. Книга добавлена пользователем: {book.addedBy.nickname}
          </p>
        )}

        <div className="current-authors-section">
          <h3 className="section-title">Текущие авторы</h3>
          {currentAuthors.length > 0 ? (
            <div className="authors-list">
              {currentAuthors.map(author => (
                <div key={author.authorId} className="author-item">
                  <div className="author-info">
                    <span className="author-name">{author.name}</span>
                    {author.realName && (
                      <span className="author-real-name">({author.realName})</span>
                    )}
                  </div>
                  <button
                    className="remove-author-btn"
                    onClick={() => handleRemoveAuthor(author.authorId)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-authors-message">Нет авторов</p>
          )}
        </div>

        <div className="search-section">
          <h3 className="section-title">Добавить автора</h3>
          <Input
            type="text"
            placeholder="Начните вводить имя автора..."
            value={searchQuery}
            onChange={setSearchQuery}
            disabled={loading}
          />
          
          {searchLoading ? (
            <div className="search-loading">Поиск...</div>
          ) : searchResults.length > 0 ? (
            <div className="search-results">
              {searchResults.map(author => (
                <div
                  key={author.id}
                  className="search-result-item"
                  onClick={() => handleAddAuthor(author)}
                >
                  <div className="author-info">
                    <span className="author-name">{author.name}</span>
                    {author.realName && (
                      <span className="author-real-name">({author.realName})</span>
                    )}
                  </div>
                  <div className="add-author-btn">+</div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="no-results-message">Авторы не найдены</p>
          ) : null}
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
            onClick={handleSave}
            disabled={loading}
          />
        </div>
      </div>
    </Modal>
  );
}

export default BookEditAuthorsModal;