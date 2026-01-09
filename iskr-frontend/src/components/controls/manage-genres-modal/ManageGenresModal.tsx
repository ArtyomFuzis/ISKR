// /src/components/controls/manage-genres-modal/ManageGenresModal.tsx
import { useState, useEffect } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import Input from '../input/Input';
import './ManageGenresModal.scss';
import searchAPI from '../../../api/searchService';
import adminAPI, { type Genre } from '../../../api/adminService';
import type { SearchGenreData } from '../../../types/search';

interface ManageGenresModalProps {
  open: boolean;
  onClose: () => void;
}

function ManageGenresModal({ open, onClose }: ManageGenresModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchGenreData[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<SearchGenreData | null>(null);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>('view');
  
  const [genreName, setGenreName] = useState('');
  
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
        setSearchResults(genres);
      } catch (err: any) {
        console.error('Error searching genres:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchGenres, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCreateClick = () => {
    setMode('create');
    setSelectedGenre(null);
    setGenreName('');
    setError(null);
    setSuccess(null);
  };

  const handleEditClick = (genre: SearchGenreData) => {
    setSelectedGenre(genre);
    setMode('edit');
    setGenreName(genre.name);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteClick = async (genre: SearchGenreData) => {
    if (!confirm(`Вы уверены, что хотите удалить жанр "${genre.name}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminAPI.deleteGenre(genre.id);
      setSuccess(`Жанр "${genre.name}" успешно удален`);
      
      // Удаляем из результатов поиска
      setSearchResults(prev => prev.filter(g => g.id !== genre.id));
      
      // Сбрасываем форму, если редактировали этот жанр
      if (selectedGenre?.id === genre.id) {
        setSelectedGenre(null);
        setMode('view');
      }
    } catch (err: any) {
      console.error('Error deleting genre:', err);
      setError(err.message || 'Ошибка при удалении жанра');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGenre = async () => {
    if (!genreName.trim()) {
      setError('Название жанра не может быть пустым');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'create') {
        const createdGenre = await adminAPI.createGenre({ name: genreName.trim() });
        setSuccess(`Жанр "${createdGenre.name}" успешно создан`);
        setMode('view');
        
        // Обновляем результаты поиска
        if (searchQuery.trim()) {
          const genres = await searchAPI.searchGenres(searchQuery.trim());
          setSearchResults(genres);
        }
      } else if (mode === 'edit' && selectedGenre) {
        if (genreName.trim() !== selectedGenre.name) {
          const updatedGenre = await adminAPI.updateGenre(selectedGenre.id, genreName.trim());
          setSuccess(`Жанр "${updatedGenre.name}" успешно обновлен`);
          
          // Обновляем результаты поиска
          const genres = await searchAPI.searchGenres(searchQuery.trim() || updatedGenre.name);
          setSearchResults(genres);
          
          // Обновляем выбранный жанр
          setSelectedGenre({
            id: updatedGenre.genreId,
            name: updatedGenre.name,
          });
        } else {
          setSuccess('Нет изменений для сохранения');
        }
      }
    } catch (err: any) {
      console.error('Error saving genre:', err);
      
      if (err.response?.data?.data?.details) {
        const errorDetails = err.response.data.data.details;
        if (errorDetails.state === 'Fail_Conflict' && errorDetails.message === 'Genre with this name already exists') {
          setError('Жанр с таким названием уже существует');
        } else {
          setError(errorDetails.message || 'Ошибка сохранения жанра');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка сохранения жанра');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMode('view');
    setSelectedGenre(null);
    setGenreName('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedGenre(null);
    setMode('view');
    setGenreName('');
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="manage-genres-modal">
        <h2 className="modal-title">Управление жанрами</h2>

        {mode === 'view' ? (
          <>
            <div className="search-section">
              <div className="search-header">
                <h3 className="section-title">Поиск жанров</h3>
                <PrimaryButton
                  label="Создать жанр"
                  onClick={handleCreateClick}
                  disabled={loading}
                />
              </div>
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
                    <div key={genre.id} className="search-result-item">
                      <div className="genre-info">
                        <span className="genre-name">{genre.name}</span>
                      </div>
                      <div className="genre-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditClick(genre)}
                          title="Редактировать"
                          disabled={loading}
                        >
                          ✎
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteClick(genre)}
                          title="Удалить"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <p className="no-results-message">Жанры не найдены</p>
              ) : (
                <p className="no-results-message">Введите название жанра для поиска</p>
              )}
            </div>
          </>
        ) : (
          <div className="edit-section">
            <h3 className="section-title">
              {mode === 'create' ? 'Создание жанра' : 'Редактирование жанра'}
            </h3>
            
            <div className="form-group">
              <label htmlFor="genre-name" className="form-label">
                Название жанра *
              </label>
              <input
                id="genre-name"
                type="text"
                className="form-input"
                value={genreName}
                onChange={(e) => setGenreName(e.target.value)}
                disabled={loading}
                placeholder="Введите название жанра"
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
                onClick={handleCancel}
                disabled={loading}
              />
              <PrimaryButton
                label={loading ? "Сохранение..." : "Сохранить"}
                onClick={handleSaveGenre}
                disabled={loading || !genreName.trim()}
              />
            </div>
          </div>
        )}

        {mode === 'view' && (
          <div className="modal-actions">
            <SecondaryButton
              label="Закрыть"
              onClick={handleClose}
              disabled={loading}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ManageGenresModal;