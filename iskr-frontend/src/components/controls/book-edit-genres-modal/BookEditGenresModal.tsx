// /src/components/controls/book-edit-genres-modal/BookEditGenresModal.tsx
import { useState, useEffect } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import Input from '../input/Input';
import './BookEditGenresModal.scss';
import bookAPI from '../../../api/bookService';
import searchAPI from '../../../api/searchService';
import type { BookDetail, UpdateBookData } from '../../../api/bookService';
import type { SearchGenreData } from '../../../types/search';

interface BookEditGenresModalProps {
  open: boolean;
  onClose: () => void;
  book: BookDetail;
  onBookUpdated: () => Promise<void>;
}

function BookEditGenresModal({ open, onClose, book, onBookUpdated }: BookEditGenresModalProps) {
  const [currentGenres, setCurrentGenres] = useState(book.genres);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchGenreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Поиск жанров с задержкой
  useEffect(() => {
    const searchGenres = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const genres = await searchAPI.searchGenres(searchQuery.trim());
        // Исключаем уже добавленные жанры
        const filteredGenres = genres.filter(
          genre => !currentGenres.some(existing => existing.genreId === genre.id)
        );
        setSearchResults(filteredGenres);
      } catch (err: any) {
        console.error('Error searching genres:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchGenres, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentGenres]);

  const handleAddGenre = (genre: SearchGenreData) => {
    if (!currentGenres.some(g => g.genreId === genre.id)) {
      setCurrentGenres([
        ...currentGenres,
        {
          genreId: genre.id,
          name: genre.name
        }
      ]);
      setSearchResults(results => results.filter(g => g.id !== genre.id));
    }
  };

  const handleRemoveGenre = (genreId: number) => {
    setCurrentGenres(currentGenres.filter(genre => genre.genreId !== genreId));
  };

  const handleSave = async () => {
    if (currentGenres.length === 0) {
      setError('Книга должна иметь хотя бы один жанр');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UpdateBookData = {
        genreIds: currentGenres.map(g => g.genreId)
      };

      await bookAPI.updateBook(book.bookId, updateData);
      setSuccess('Жанры успешно обновлены');
      
      setTimeout(async () => {
        try {
          await onBookUpdated();
        } finally {
          onClose();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error updating genres:', err);
      
      if (err.response?.data?.data?.details) {
        const errorDetails = err.response.data.data.details;
        if (errorDetails.state === 'Fail_NotFound' && errorDetails.message === 'Some genres not found') {
          setError('Некоторые жанры не найдены. Пожалуйста, обновите список.');
        } else {
          setError(errorDetails.message || 'Ошибка обновления жанров');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка обновления жанров');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentGenres(book.genres);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="book-edit-genres-modal">
        <h2 className="modal-title">Редактирование жанров книги</h2>

        <div className="current-genres-section">
          <h3 className="section-title">Текущие жанры</h3>
          {currentGenres.length > 0 ? (
            <div className="genres-list">
              {currentGenres.map(genre => (
                <div key={genre.genreId} className="genre-item">
                  <span className="genre-name">{genre.name}</span>
                  <button
                    className="remove-genre-btn"
                    onClick={() => handleRemoveGenre(genre.genreId)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-genres-message">Нет жанров</p>
          )}
        </div>

        <div className="search-section">
          <h3 className="section-title">Добавить жанр</h3>
          <Input
            type="text"
            placeholder="Начните вводить название жанра..."
            value={searchQuery}
            onChange={setSearchQuery}
            disabled={loading}
          />
          
          {searchLoading ? (
            <div className="search-loading">Поиск...</div>
          ) : searchResults.length > 0 ? (
            <div className="search-results">
              {searchResults.map(genre => (
                <div
                  key={genre.id}
                  className="search-result-item"
                  onClick={() => handleAddGenre(genre)}
                >
                  <span className="genre-name">{genre.name}</span>
                  <div className="add-genre-btn">+</div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="no-results-message">Жанры не найдены</p>
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

export default BookEditGenresModal;