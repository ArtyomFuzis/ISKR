// /src/components/pages/collection/Collection.tsx
import './Collection.scss';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store.ts';
import CardElement from '../../controls/card-element/CardElement.tsx';
import PrimaryButton from '../../controls/primary-button/PrimaryButton.tsx';
import SecondaryButton from '../../controls/secondary-button/SecondaryButton.tsx';
import Modal from '../../controls/modal/Modal.tsx';
import ConfirmDialog from '../../controls/confirm-dialog/ConfirmDialog.tsx';
import BookSearchModal from '../../controls/book-search-modal/BookSearchModal.tsx';
import EditCollectionModal from '../../controls/edit-collection-modal/EditCollectionModal.tsx';
import Change from '../../../assets/elements/change-pink.svg';
import Delete from '../../../assets/elements/delete-pink.svg';
import HeartEmpty from '../../../assets/elements/heart-empty.svg';
import HeartFilled from '../../../assets/elements/heart-filled.svg';
import PlaceholderImage from '../../../assets/images/placeholder.jpg';
import { collectionAPI, type CollectionInfo, type CollectionBook } from '../../../api/collectionService';
import { getImageUrl, getBookImageUrl, formatRating } from '../../../api/popularService';
import { russianLocalWordConverter } from '../../../utils/russianLocalWordConverter.ts';
import LockIcon from '../../../assets/elements/lock.svg';

// Функции для перевода значений
const translateCollectionType = (type: string): string => {
  const translations: Record<string, string> = {
    'Standard': 'Обычная',
    'Liked': 'Понравившиеся',
    'Wishlist': 'Вишлист'
  };
  return translations[type] || type;
};

const translateConfidentiality = (confidentiality: string): string => {
  const translations: Record<string, string> = {
    'Public': 'Публичная',
    'Private': 'Приватная'
  };
  return translations[confidentiality] || confidentiality;
};

interface BookCardData {
  id: string;
  title: string;
  author: string;
  rating?: number;
  imageUrl: string;
  originalData: CollectionBook;
}

function Collection() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteBookDialog, setShowDeleteBookDialog] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [books, setBooks] = useState<BookCardData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const collectionId = parseInt(location.state?.id || '0');
  const isOwner = collectionInfo && currentUser ? collectionInfo.ownerId === Number(currentUser.id) : false;

  // Загрузка данных коллекции
  useEffect(() => {
    const loadCollectionData = async () => {
      if (!collectionId) {
        setError('ID коллекции не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setIsForbidden(false);

        // Используем auth методы для авторизованных пользователей
        const [collectionData, booksData] = await Promise.all([
          collectionAPI.getCollection(collectionId, isAuthenticated),
          collectionAPI.getCollectionBooks(collectionId, 12, 0, isAuthenticated)
        ]);

        setCollectionInfo(collectionData);
        setLikesCount(collectionData.likesCount);
        setTotalPages(booksData.totalPages);
        setCurrentPage(booksData.page);
        setHasMore(booksData.totalPages > 1);

        // Преобразуем книги в формат для компонента
        const formattedBooks: BookCardData[] = booksData.books.map((book: CollectionBook) => ({
          id: book.bookId.toString(),
          title: book.title,
          author: book.authors.map(a => a.name).join(', '),
          rating: formatRating(book.averageRating),
          imageUrl: getBookImageUrl(book) || PlaceholderImage,
          originalData: book
        }));

        setBooks(formattedBooks);

        // Если пользователь авторизован и не владелец, проверяем лайк
        if (isAuthenticated && collectionData.ownerId !== Number(currentUser?.id)) {
          try {
            const likeStatus = await collectionAPI.getLikeStatus(collectionId);
            setIsLiked(likeStatus.isLiked);
          } catch (err) {
            console.error('Error fetching like status:', err);
          }
        }
      } catch (err: any) {
        console.error('Error loading collection:', err);
        
        if (err.response && err.response.status === 403) {
          setIsForbidden(true);
          setError('Доступ к этой коллекции запрещен');
        } else {
          setError(err.message || 'Ошибка загрузки коллекции');
        }
      } finally {
        setLoading(false);
      }
    };

    loadCollectionData();
  }, [collectionId, isAuthenticated, currentUser]);

  // Загрузка дополнительных книг (пагинация)
  const loadMoreBooks = async () => {
    if (!collectionId || !hasMore) return;

    try {
      const nextPage = currentPage + 1;
      const booksData = await collectionAPI.getCollectionBooks(collectionId, 12, nextPage, isAuthenticated);

      const formattedBooks: BookCardData[] = booksData.books.map((book: CollectionBook) => ({
        id: book.bookId.toString(),
        title: book.title,
        author: book.authors.map(a => a.name).join(', '),
        rating: formatRating(book.averageRating),
        imageUrl: getBookImageUrl(book) || PlaceholderImage,
        originalData: book
      }));

      setBooks(prev => [...prev, ...formattedBooks]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < totalPages - 1);
    } catch (err) {
      console.error('Error loading more books:', err);
    }
  };

  const handleDeleteCollection = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteCollection = async () => {
    try {
      await collectionAPI.deleteCollection(collectionId);
      setShowDeleteDialog(false);
      // Перенаправляем на корень (/)
      navigate('/library');
    } catch (err: any) {
      console.error('Error deleting collection:', err);
      setError('Ошибка удаления коллекции');
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setShowDeleteBookDialog(true);
  };

  const confirmDeleteBook = async () => {
    if (!selectedBookId || !collectionId) return;

    try {
      await collectionAPI.removeBookFromCollection(collectionId, parseInt(selectedBookId));
      setBooks(prev => prev.filter(book => book.id !== selectedBookId));
      setShowDeleteBookDialog(false);
      setSelectedBookId(null);
    } catch (err: any) {
      console.error('Error deleting book from collection:', err);
      setError('Ошибка удаления книги из коллекции');
      setShowDeleteBookDialog(false);
    }
  };

  const handleBooksAdded = (bookIds: number[]) => {
    // Перезагружаем список книг
    const loadBooks = async () => {
      try {
        const booksData = await collectionAPI.getCollectionBooks(collectionId, 12, 0, isAuthenticated);
        const formattedBooks: BookCardData[] = booksData.books.map((book: CollectionBook) => ({
          id: book.bookId.toString(),
          title: book.title,
          author: book.authors.map(a => a.name).join(', '),
          rating: formatRating(book.averageRating),
          imageUrl: getBookImageUrl(book) || PlaceholderImage,
          originalData: book
        }));
        setBooks(formattedBooks);
        setTotalPages(booksData.totalPages);
        setCurrentPage(booksData.page);
        setHasMore(booksData.totalPages > 1);
      } catch (err) {
        console.error('Error reloading books:', err);
      }
    };
    loadBooks();
  };

  const handleBookClick = (book: BookCardData) => {
    navigate('/book', {
      state: {
        id: book.id,
        title: book.title,
        author: book.author,
        rating: book.rating,
        coverUrl: book.imageUrl,
        isMine: isOwner,
        isEditMode: false,
        originalData: book.originalData
      }
    });
  };

  const handleOwnerClick = () => {
    if (collectionInfo) {
      navigate('/profile', {
        state: {
          userId: collectionInfo.ownerId
        }
      });
    }
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated || !collectionId) return;

    try {
      if (isLiked) {
        await collectionAPI.unlikeCollection(collectionId);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await collectionAPI.likeCollection(collectionId);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      setError('Ошибка обновления лайка');
    }
  };

  const handleCollectionUpdated = (updatedCollection: CollectionInfo) => {
    setCollectionInfo(updatedCollection);
    setLikesCount(updatedCollection.likesCount);
  };

  // Функция для форматирования количества книг
  const formatBooksCount = (count: number): string => {
    return `${count} ${russianLocalWordConverter(count, 'книга', 'книги', 'книг', 'книг')}`;
  };

  // Функция для форматирования количества лайков
  const formatLikesCount = (count: number): string => {
    return `${count} ${russianLocalWordConverter(count, 'лайк', 'лайка', 'лайков', 'лайков')}`;
  };

  // Рендер состояний загрузки и ошибок
  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Загрузка коллекции...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="error-state">
      <p>Ошибка: {error}</p>
      <SecondaryButton 
        label="Вернуться назад" 
        onClick={() => navigate(-1)}
      />
    </div>
  );

  const renderForbiddenState = () => (
    <div className="forbidden-state">
      <div className="forbidden-icon">
        <img src={LockIcon} alt="Замок" />
      </div>
      <h3>Коллекция недоступна</h3>
      <p className="forbidden-message">
        Эта коллекция является приватной или у вас нет прав для ее просмотра.
      </p>
      <p className="forbidden-hint">
        Если вы считаете, что это ошибка, обратитесь к владельцу коллекции.
      </p>
      <SecondaryButton 
        label="Вернуться назад" 
        onClick={() => navigate(-1)}
      />
    </div>
  );

  if (loading) {
    return (
      <main>
        <div className="collection-page-container">
          {renderLoadingState()}
        </div>
      </main>
    );
  }

  if (isForbidden) {
    return (
      <main>
        <div className="collection-page-container">
          {renderForbiddenState()}
        </div>
      </main>
    );
  }

  if (error || !collectionInfo) {
    return (
      <main>
        <div className="collection-page-container">
          {renderErrorState()}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="collection-page-container">
        <button
          className="page-close-button"
          onClick={() => navigate(-1)}
          aria-label="Вернуться назад"
          data-tooltip="Закрыть окно"
        >
          ×
        </button>
        
        <div className="collection-header">
          <div className="collection-title-section">
            <h2 className="collection-title">{collectionInfo.title}</h2>
            {collectionInfo.confidentiality === 'Private' && (
              <span className="collection-private-badge">
                <img src={LockIcon} alt="Приватная" />
                Приватная
              </span>
            )}
          </div>

          <div className="collection-actions">
            {isOwner && isAuthenticated ? (
              <>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(true)}
                  className="collection-action-btn"
                  title="Редактировать коллекцию"
                >
                  <img src={Change} alt="Редактировать" />
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteCollection}
                  className="collection-action-btn"
                  title="Удалить коллекцию"
                >
                  <img src={Delete} alt="Удалить" />
                </button>
              </>
            ) : isAuthenticated && (
              <button 
                type="button" 
                onClick={handleLikeToggle}
                className={`collection-action-btn like-btn ${isLiked ? 'liked' : ''}`}
                title={isLiked ? "Убрать из понравившегося" : "Добавить в понравившиеся"}
              >
                <img src={isLiked ? HeartFilled : HeartEmpty} alt="Лайк" />
                {isLiked ? 'Убрать из понравившегося' : 'Добавить в понравившиеся'}
              </button>
            )}
          </div>
        </div>

        {/* Информация о коллекции */}
        <div className="collection-info-section">
          <div className="collection-cover-container">
            <img 
              src={collectionInfo.photoLink ? getImageUrl(collectionInfo.photoLink) : PlaceholderImage} 
              alt="Обложка коллекции" 
              className="collection-cover"
            />
          </div>
          
          <div className="collection-details">
            {collectionInfo.description && (
              <div className="collection-description">
                <h3>Описание</h3>
                <p>{collectionInfo.description}</p>
              </div>
            )}
            
            <div className="collection-meta">
              <div className="collection-meta-item">
                <span className="meta-label">Тип:</span>
                <span className="meta-value">{translateCollectionType(collectionInfo.collectionType)}</span>
              </div>
              
              <div className="collection-meta-item">
                <span className="meta-label">Конфиденциальность:</span>
                <span className="meta-value">{translateConfidentiality(collectionInfo.confidentiality)}</span>
              </div>
              
              <div className="collection-meta-item">
                <span className="meta-label">Книги:</span>
                <span className="meta-value">{formatBooksCount(collectionInfo.booksCount)}</span>
              </div>
              
              <div className="collection-meta-item">
                <span className="meta-label">Лайки:</span>
                <span className="meta-value">{formatLikesCount(likesCount)}</span>
              </div>
              
              <div className="collection-meta-item clickable" onClick={handleOwnerClick}>
                <span className="meta-label">Владелец:</span>
                <span className="meta-value owner-name">{collectionInfo.ownerNickname}</span>
              </div>
            </div>
          </div>
        </div>

        {isOwner && isAuthenticated && (
          <div className="collection-buttons">
            <PrimaryButton label="Добавить книгу" onClick={() => setShowAddBookModal(true)} type="button" />
          </div>
        )}

        <div className="collection-books-section">
          <h3 className="books-section-title">Книги в коллекции</h3>
          
          {books.length > 0 ? (
            <>
              <div className="collection-books-list">
                {books.map((book) => (
                  <div key={book.id} className="collection-book-item">
                    {isOwner && isAuthenticated && (
                      <button
                        type="button"
                        className="delete-book-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBook(book.id);
                        }}
                      >
                        <img src={Delete} alt="Удалить из коллекции" />
                      </button>
                    )}
                    <div onClick={() => handleBookClick(book)}>
                      <CardElement
                        title={book.title}
                        description={book.author}
                        starsCount={book.rating}
                        imageUrl={book.imageUrl}
                        button={false}
                        starsSize="small"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div className="load-more-container">
                  <PrimaryButton
                    label="Загрузить еще"
                    onClick={loadMoreBooks}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="no-books-message">В этой коллекции пока нет книг</p>
          )}
        </div>
      </div>

      <Modal open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <ConfirmDialog
          title="Удаление коллекции"
          message="Вы уверены, что хотите удалить эту коллекцию? Все книги будут удалены из коллекции, но останутся в системе."
          onConfirm={confirmDeleteCollection}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </Modal>

      <Modal open={showDeleteBookDialog} onClose={() => setShowDeleteBookDialog(false)}>
        <ConfirmDialog
          title="Удаление книги из коллекции"
          message="Вы уверены, что хотите удалить эту книгу из коллекции?"
          onConfirm={confirmDeleteBook}
          onCancel={() => setShowDeleteBookDialog(false)}
        />
      </Modal>

      {showAddBookModal && (
        <Modal open={showAddBookModal} onClose={() => setShowAddBookModal(false)}>
          <BookSearchModal
            collectionId={collectionId}
            onClose={() => setShowAddBookModal(false)}
            onBooksAdded={handleBooksAdded}
          />
        </Modal>
      )}

      {collectionInfo && (
        <EditCollectionModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          collection={collectionInfo}
          onCollectionUpdated={handleCollectionUpdated}
        />
      )}
    </main>
  );
}

export default Collection;