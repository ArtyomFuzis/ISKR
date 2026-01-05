// /src/components/controls/book-search-modal/BookSearchModal.tsx
import { useState, useEffect, useCallback } from 'react';
import './BookSearchModal.scss';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import Input from '../input/Input';
import CardElement from '../card-element/CardElement';
import searchAPI from '../../../api/searchService';
import collectionAPI, { type BookInCollectionStatus } from '../../../api/collectionService';
import { getSearchImageUrl, formatRating } from '../../../api/popularService';
import PlaceholderImage from '../../../assets/images/placeholder.jpg';
import { useDebounce } from '../../../hooks/useDebounce';

interface BookSearchModalProps {
  collectionId: number;
  onClose: () => void;
  onBooksAdded?: (bookIds: number[]) => void;
}

function BookSearchModal({ collectionId, onClose, onBooksAdded }: BookSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
  const [processingBooks, setProcessingBooks] = useState<Set<number>>(new Set());
  const [bookInCollectionStatus, setBookInCollectionStatus] = useState<Record<number, boolean>>({});

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Поиск книг
  useEffect(() => {
    const searchBooks = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await searchAPI.search({
          Query: debouncedSearchQuery,
          Types: 'book',
          Limit: 20
        });

        setSearchResults(response.books);

        // Проверяем для каждой книги, есть ли она уже в коллекции
        const statusMap: Record<number, boolean> = {};
        const promises = response.books.map(async (book: any) => {
          try {
            const status = await collectionAPI.checkBookInCollection(collectionId, book.bookId);
            statusMap[book.bookId] = status.exists;
          } catch (err) {
            statusMap[book.bookId] = false;
          }
        });

        await Promise.all(promises);
        setBookInCollectionStatus(statusMap);
      } catch (err: any) {
        console.error('Error searching books:', err);
        setError('Ошибка поиска книг');
      } finally {
        setLoading(false);
      }
    };

    searchBooks();
  }, [debouncedSearchQuery, collectionId]);

  // Обработка добавления/удаления книги из коллекции
  const handleBookToggle = async (bookId: number) => {
    try {
      setProcessingBooks(prev => new Set(prev).add(bookId));

      const isInCollection = bookInCollectionStatus[bookId];

      if (isInCollection) {
        await collectionAPI.removeBookFromCollection(collectionId, bookId);
        setBookInCollectionStatus(prev => ({
          ...prev,
          [bookId]: false
        }));
      } else {
        await collectionAPI.addBookToCollection(collectionId, bookId);
        setBookInCollectionStatus(prev => ({
          ...prev,
          [bookId]: true
        }));
      }
    } catch (err: any) {
      console.error('Error toggling book in collection:', err);
      setError('Ошибка при обновлении коллекции');
    } finally {
      setProcessingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const getBookImageUrl = (book: any): string => {
    if (book.photoLink) {
      return getSearchImageUrl(book.photoLink.imageData?.uuid, book.photoLink.imageData?.extension) || PlaceholderImage;
    }
    if (book.imageUuid && book.imageExtension) {
      return getSearchImageUrl(book.imageUuid, book.imageExtension) || PlaceholderImage;
    }
    return PlaceholderImage;
  };

  const getAuthorsString = (book: any): string => {
    if (book.authors && Array.isArray(book.authors)) {
      return book.authors.join(', ');
    }
    if (book.author) {
      return book.author;
    }
    return 'Автор неизвестен';
  };

  return (
    <div className="book-search-modal">
      <div className="modal-header">
        <h2 className="modal-title">Добавить книги в коллекцию</h2>
      </div>

      <div className="modal-content">
        <div className="search-input-container">
          <Input
            type="text"
            placeholder="Поиск книг по названию или автору..."
            value={searchQuery}
            onChange={setSearchQuery}
            autoFocus
          />
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="search-results-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Поиск книг...</p>
            </div>
          ) : searchResults.length === 0 && debouncedSearchQuery.trim() ? (
            <div className="no-results-message">
              По запросу "{debouncedSearchQuery}" ничего не найдено
            </div>
          ) : searchResults.length === 0 ? (
            <div className="no-results-message">
              Начните вводить название книги или автора для поиска
            </div>
          ) : (
            <div className="search-results-grid">
              {searchResults.map(book => {
                const isInCollection = bookInCollectionStatus[book.bookId] || false;
                const isProcessing = processingBooks.has(book.bookId);

                return (
                  <div
                    key={book.bookId}
                    className={`search-result-item ${isInCollection ? 'in-collection' : ''} ${isProcessing ? 'processing' : ''}`}
                  >
                    <CardElement
                      title={book.title}
                      description={getAuthorsString(book)}
                      // Если книга в коллекции, не передаем рейтинг
                      starsCount={isInCollection ? undefined : formatRating(book.averageRating)}
                      imageUrl={getBookImageUrl(book)}
                      button={true}
                      buttonLabel={isInCollection ? "Убрать из коллекции" : "Добавить в коллекцию"}
                      onButtonClick={() => handleBookToggle(book.bookId)}
                      infoDecoration={isInCollection ? "В коллекции" : undefined}
                      starsSize="small"
                    />
                    {isProcessing && (
                      <div className="processing-overlay">
                        <div className="processing-spinner"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

          <div className="modal-actions">
            <SecondaryButton
              label="Готово"
              onClick={onClose}
            />
        </div>
      </div>
    </div>
  );
}

export default BookSearchModal;