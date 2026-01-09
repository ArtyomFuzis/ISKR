// /src/components/controls/manage-authors-modal/ManageAuthorsModal.tsx
import { useState, useEffect, useCallback } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import Input from '../input/Input';
import './ManageAuthorsModal.scss';
import searchAPI from '../../../api/searchService';
import adminAPI, { type Author, type CreateAuthorData, type UpdateAuthorData } from '../../../api/adminService';
import type { SearchAuthorData } from '../../../types/search';

interface ManageAuthorsModalProps {
  open: boolean;
  onClose: () => void;
}

function ManageAuthorsModal({ open, onClose }: ManageAuthorsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchAuthorData[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<SearchAuthorData | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>('view');
  
  const [authorName, setAuthorName] = useState('');
  const [authorRealName, setAuthorRealName] = useState('');
  const [authorDescription, setAuthorDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        setSearchResults(authors);
      } catch (err: any) {
        console.error('Error searching authors:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAuthors, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCreateClick = () => {
    setMode('create');
    setSelectedAuthor(null);
    setAuthorName('');
    setAuthorRealName('');
    setAuthorDescription('');
    setError(null);
    setSuccess(null);
  };

  const handleEditClick = (author: SearchAuthorData) => {
    setSelectedAuthor(author);
    setMode('edit');
    setAuthorName(author.name);
    setAuthorRealName(author.realName || '');
    setAuthorDescription(author.description || '');
    setError(null);
    setSuccess(null);
  };

  const handleDeleteClick = async (author: SearchAuthorData) => {
    if (!confirm(`Вы уверены, что хотите удалить автора "${author.name}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminAPI.deleteAuthor(author.id);
      setSuccess(`Автор "${author.name}" успешно удален`);
      
      // Удаляем из результатов поиска
      setSearchResults(prev => prev.filter(a => a.id !== author.id));
      
      // Сбрасываем форму, если редактировали этого автора
      if (selectedAuthor?.id === author.id) {
        setSelectedAuthor(null);
        setMode('view');
      }
    } catch (err: any) {
      console.error('Error deleting author:', err);
      setError(err.message || 'Ошибка при удалении автора');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAuthor = async () => {
    if (!authorName.trim()) {
      setError('Имя автора не может быть пустым');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'create') {
        const authorData: CreateAuthorData = {
          name: authorName.trim(),
        };
        
        if (authorRealName.trim()) {
          authorData.realName = authorRealName.trim();
        }
        
        if (authorDescription.trim()) {
          authorData.description = authorDescription.trim();
        }

        const createdAuthor = await adminAPI.createAuthor(authorData);
        setSuccess(`Автор "${createdAuthor.name}" успешно создан`);
        setMode('view');
        
        // Обновляем результаты поиска
        if (searchQuery.trim()) {
          const authors = await searchAPI.searchAuthors(searchQuery.trim());
          setSearchResults(authors);
        }
      } else if (mode === 'edit' && selectedAuthor) {
        const updateData: UpdateAuthorData = {};
        
        if (authorName.trim() !== selectedAuthor.name) {
          updateData.name = authorName.trim();
        }
        
        if (authorRealName.trim() !== selectedAuthor.realName) {
          updateData.realName = authorRealName.trim() || null;
        }
        
        if (authorDescription.trim() !== selectedAuthor.description) {
          updateData.description = authorDescription.trim() || null;
        }

        // Если есть изменения
        if (Object.keys(updateData).length > 0) {
          const updatedAuthor = await adminAPI.updateAuthor(selectedAuthor.id, updateData);
          setSuccess(`Автор "${updatedAuthor.name}" успешно обновлен`);
          
          // Обновляем результаты поиска
          const authors = await searchAPI.searchAuthors(searchQuery.trim() || updatedAuthor.name);
          setSearchResults(authors);
          
          // Обновляем выбранного автора
          setSelectedAuthor({
            id: updatedAuthor.authorId,
            name: updatedAuthor.name,
            realName: updatedAuthor.realName || '',
            description: updatedAuthor.description || '',
          });
        } else {
          setSuccess('Нет изменений для сохранения');
        }
      }
    } catch (err: any) {
      console.error('Error saving author:', err);
      
      if (err.response?.data?.data?.details) {
        const errorDetails = err.response.data.data.details;
        if (errorDetails.state === 'Fail_Conflict' && errorDetails.message === 'Author with this name already exists') {
          setError('Автор с таким именем уже существует');
        } else {
          setError(errorDetails.message || 'Ошибка сохранения автора');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка сохранения автора');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMode('view');
    setSelectedAuthor(null);
    setAuthorName('');
    setAuthorRealName('');
    setAuthorDescription('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAuthor(null);
    setMode('view');
    setAuthorName('');
    setAuthorRealName('');
    setAuthorDescription('');
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="manage-authors-modal">
        <h2 className="modal-title">Управление авторами</h2>

        {mode === 'view' ? (
          <>
            <div className="search-section">
              <div className="search-header">
                <h3 className="section-title">Поиск авторов</h3>
                <PrimaryButton
                  label="Создать автора"
                  onClick={handleCreateClick}
                  disabled={loading}
                />
              </div>
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
                    <div key={author.id} className="search-result-item">
                      <div className="author-info">
                        <span className="author-name">{author.name}</span>
                        {author.realName && (
                          <span className="author-real-name">({author.realName})</span>
                        )}
                      </div>
                      <div className="author-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditClick(author)}
                          title="Редактировать"
                          disabled={loading}
                        >
                          ✎
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteClick(author)}
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
                <p className="no-results-message">Авторы не найдены</p>
              ) : (
                <p className="no-results-message">Введите имя автора для поиска</p>
              )}
            </div>
          </>
        ) : (
          <div className="edit-section">
            <h3 className="section-title">
              {mode === 'create' ? 'Создание автора' : 'Редактирование автора'}
            </h3>
            
            <div className="form-group">
              <label htmlFor="author-name" className="form-label">
                Имя автора *
              </label>
              <input
                id="author-name"
                type="text"
                className="form-input"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={loading}
                placeholder="Введите имя автора"
              />
            </div>

            <div className="form-group">
              <label htmlFor="author-real-name" className="form-label">
                Настоящее имя
              </label>
              <input
                id="author-real-name"
                type="text"
                className="form-input"
                value={authorRealName}
                onChange={(e) => setAuthorRealName(e.target.value)}
                disabled={loading}
                placeholder="Необязательно"
              />
            </div>

            <div className="form-group">
              <label htmlFor="author-description" className="form-label">
                Описание
              </label>
              <textarea
                id="author-description"
                className="form-textarea"
                value={authorDescription}
                onChange={(e) => setAuthorDescription(e.target.value)}
                disabled={loading}
                rows={4}
                placeholder="Описание автора"
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
                onClick={handleSaveAuthor}
                disabled={loading || !authorName.trim()}
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

export default ManageAuthorsModal;