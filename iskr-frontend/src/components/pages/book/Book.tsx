// /src/components/pages/book/Book.tsx
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store.ts";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PrimaryButton from "../../controls/primary-button/PrimaryButton.tsx";
import SecondaryButton from "../../controls/secondary-button/SecondaryButton.tsx";
import Change from "../../../assets/elements/change-pink.svg";
import Delete from "../../../assets/elements/delete-pink.svg";
import DeleteIcon from "../../../assets/elements/delete-pink.svg";
import './Book.scss';
import Stars from "../../stars/Stars.tsx";
import Modal from "../../controls/modal/Modal.tsx";
import ConfirmDialog from "../../controls/confirm-dialog/ConfirmDialog.tsx";
import ReadingForm from "../../controls/reading-form/ReadingForm.tsx";
import CollectionListModal from "../../controls/collection-list-modal/CollectionListModal.tsx";
import BookEditMenu from "../../controls/book-edit-menu/BookEditMenu.tsx";
import ReviewModal from "../../controls/review-modal/ReviewModal.tsx";
import PlaceholderImage from '../../../assets/images/placeholder.jpg';
import bookAPI, { type BookDetail, type Review } from '../../../api/bookService';
import readingService, { type ReadingStatusResponse } from '../../../api/readingService';
import { getImageUrl, getBookImageUrl, formatRating } from '../../../api/popularService';
import { russianLocalWordConverter } from '../../../utils/russianLocalWordConverter.ts';
import ReadingStatusModal from "../../controls/reading-status-modal/ReadingStatusModal.tsx";
import { selectIsAdmin } from "../../../redux/authSlice";

function Book() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();
  const navigate = useNavigate();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteReviewDialog, setShowDeleteReviewDialog] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReadingStatusModal, setShowReadingStatusModal] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookDetail, setBookDetail] = useState<BookDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 0,
    totalPages: 1,
    totalElements: 0,
    batch: 10
  });
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [readingStatus, setReadingStatus] = useState<ReadingStatusResponse | null>(null);
  const [loadingReadingStatus, setLoadingReadingStatus] = useState(false);

  const [adminSelectedReview, setAdminSelectedReview] = useState<Review | null>(null);
  const [showAdminReviewModal, setShowAdminReviewModal] = useState(false);
  const [showAdminDeleteReviewDialog, setShowAdminDeleteReviewDialog] = useState(false);

  const bookId = parseInt(location.state?.id || '0');

  const loadBookData = async () => {
    if (!bookId) {
      setError('ID книги не указан');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [bookData, reviewsData] = await Promise.all([
        bookAPI.getBook(bookId),
        bookAPI.getBookReviews(bookId, 10, 0)
      ]);

      setBookDetail(bookData);
      setReviews(reviewsData.reviews);
      setReviewsPagination({
        page: reviewsData.page,
        totalPages: reviewsData.totalPages,
        totalElements: reviewsData.totalElements,
        batch: reviewsData.batch
      });
      setHasMoreReviews(reviewsData.totalPages > 1);

      if (isAuthenticated) {
        try {
          const myReview = await bookAPI.getMyReview(bookId);
          setUserReview(myReview);
          if (myReview) {
            setUserRating(myReview.score / 2);
          } else {
            setUserRating(0);
          }
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.error('Error fetching user review:', err);
          }
          setUserReview(null);
          setUserRating(0);
        }
      }
    } catch (err: any) {
      console.error('Error loading book:', err);
      setError(err.message || 'Ошибка загрузки информации о книге');
    } finally {
      setLoading(false);
    }
  };

  const loadReadingStatus = async () => {
    if (!bookId || !isAuthenticated) return;

    setLoadingReadingStatus(true);
    try {
      const status = await readingService.getReadingStatus(bookId);
      setReadingStatus(status);
    } catch (err: any) {
      console.error('Error loading reading status:', err);
    } finally {
      setLoadingReadingStatus(false);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [bookId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && bookId) {
      loadReadingStatus();
    }
  }, [bookId, isAuthenticated]);

  const loadMoreReviews = async () => {
    if (!bookId || !hasMoreReviews) return;

    try {
      const nextPage = reviewsPagination.page + 1;
      const reviewsData = await bookAPI.getBookReviews(bookId, 10, nextPage);

      setReviews(prev => [...prev, ...reviewsData.reviews]);
      setReviewsPagination({
        page: reviewsData.page,
        totalPages: reviewsData.totalPages,
        totalElements: reviewsData.totalElements,
        batch: reviewsData.batch
      });
      setHasMoreReviews(nextPage < reviewsData.totalPages - 1);
    } catch (err) {
      console.error('Error loading more reviews:', err);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    coverUrl: PlaceholderImage,
    genre: '',
    year: '',
    rating: 0,
    isMine: false,
    pages: '0',
    description: ''
  });

  useEffect(() => {
    if (bookDetail) {
      const isMine = currentUser ? bookDetail.addedBy.userId === Number(currentUser.id) : false;

      setFormData({
        title: bookDetail.title,
        author: bookDetail.authors.map(a => a.name).join(', '),
        coverUrl: getBookImageUrl(bookDetail) || PlaceholderImage,
        genre: bookDetail.genres.map(g => g.name).join(', '),
        year: '',
        rating: formatRating(bookDetail.averageRating),
        isMine,
        pages: bookDetail.pageCnt.toString(),
        description: bookDetail.description || 'Нет описания'
      });
    }
  }, [bookDetail, currentUser]);

  const handleSaveReview = () => {
    if (!isAuthenticated) return;

    if (userReview) {
      setShowReviewModal(true);
    } else {
      if (userRating === 0) {
        return;
      }
      setShowReviewModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      if (isAdmin && !formData.isMine) {
        await bookAPI.deleteBookAdmin(bookId);
      } else {
        await bookAPI.deleteBook(bookId);
      }
      setShowDeleteDialog(false);
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting book:', err);
      setError(err.message || 'Ошибка при удалении книги');
      setShowDeleteDialog(false);
    }
  };

  const handleAddToCollection = () => {
    setShowCollectionForm(true);
  };

  const handleMarkAsRead = () => {
    setShowReadingStatusModal(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleEditBook = () => {
    setShowEditMenu(true);
  };

  const handleBookUpdated = async () => {
    await loadBookData();
  };

  const handleCreateReview = async (score: number, reviewText: string) => {
    try {
      setReviewLoading(true);
      const scoreIn10 = score * 2;
      const newReview = await bookAPI.createReview(bookId, scoreIn10, reviewText);

      setReviews(prev => [newReview, ...prev]);
      setUserReview(newReview);
      setUserRating(score);

      if (bookDetail) {
        setBookDetail({
          ...bookDetail,
          reviewsCount: bookDetail.reviewsCount + 1
        });
      }

      setShowReviewModal(false);
    } catch (error: any) {
      console.error('Error creating review:', error);
      throw error;
    } finally {
      setReviewLoading(false);
    }
  };

  const handleUpdateReview = async (score: number, reviewText: string) => {
    try {
      setReviewLoading(true);
      const scoreIn10 = score * 2;
      const updatedReview = await bookAPI.updateReview(bookId, scoreIn10, reviewText);

      setReviews(prev => prev.map(review =>
        review.reviewId === updatedReview.reviewId ? updatedReview : review
      ));
      setUserReview(updatedReview);
      setUserRating(score);

      setShowReviewModal(false);
    } catch (error: any) {
      console.error('Error updating review:', error);
      throw error;
    } finally {
      setReviewLoading(false);
    }
  };

  const confirmDeleteReview = async () => {
    if (!userReview) return;

    try {
      await bookAPI.deleteReview(bookId);

      setReviews(prev => prev.filter(review =>
        review.reviewId !== userReview.reviewId
      ));
      setUserReview(null);
      setUserRating(0);

      if (bookDetail) {
        setBookDetail({
          ...bookDetail,
          reviewsCount: Math.max(0, bookDetail.reviewsCount - 1)
        });
      }
      setShowDeleteReviewDialog(false);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      alert('Ошибка при удалении отзыва: ' + error.message);
    }
  };

  const handleAdminReviewEdit = (review: Review) => {
    setAdminSelectedReview(review);
    setShowAdminReviewModal(true);
  };

  const handleAdminReviewDelete = (review: Review) => {
    setAdminSelectedReview(review);
    setShowAdminDeleteReviewDialog(true);
  };

  const handleAdminReviewSave = async (score: number, reviewText: string) => {
    if (!adminSelectedReview) return;

    try {
      setReviewLoading(true);
      const scoreIn10 = score * 2;
      const updatedReview = await bookAPI.updateReviewAdmin(
        bookId,
        adminSelectedReview.user.userId,
        { reviewText, score: scoreIn10 }
      );

      setReviews(prev => prev.map(review =>
        review.reviewId === updatedReview.reviewId ? updatedReview : review
      ));

      setShowAdminReviewModal(false);
      setAdminSelectedReview(null);
    } catch (error: any) {
      console.error('Error updating review as admin:', error);
      throw error;
    } finally {
      setReviewLoading(false);
    }
  };

  const confirmAdminDeleteReview = async () => {
    if (!adminSelectedReview) return;

    try {
      await bookAPI.deleteReviewAdmin(bookId, adminSelectedReview.user.userId);

      setReviews(prev => prev.filter(review =>
        review.reviewId !== adminSelectedReview.reviewId
      ));

      if (bookDetail) {
        setBookDetail({
          ...bookDetail,
          reviewsCount: Math.max(0, bookDetail.reviewsCount - 1)
        });
      }

      setShowAdminDeleteReviewDialog(false);
      setAdminSelectedReview(null);
    } catch (error: any) {
      console.error('Error deleting review as admin:', error);
      alert('Ошибка при удалении отзыва: ' + error.message);
    }
  };

  const handleAuthorClick = (userId: number) => {
    navigate('/profile', {
      state: {
        userId
      }
    });
  };

  const handleReviewUserClick = (userId: number) => {
    navigate('/profile', {
      state: {
        userId
      }
    });
  };

  const handleReadingStatusUpdated = (updatedStatus: ReadingStatusResponse) => {
    setReadingStatus(updatedStatus);
  };

  const renderReadingStats = () => {
    if (!readingStatus) return null;

    const percentage = Math.round((readingStatus.pageRead / readingStatus.bookPageCnt) * 100);
    const lastReadDate = readingStatus.lastReadDate 
      ? new Date(readingStatus.lastReadDate).toLocaleDateString('ru-RU')
      : null;

    const getStatusText = (status: string): string => {
      switch (status) {
        case 'Planning': return 'Запланировано к прочтению';
        case 'Reading': return 'В процессе чтения';
        case 'Delayed': return 'Отложено';
        case 'GaveUp': return 'Брошено';
        case 'Finished': return 'Прочитано';
        default: return 'Неизвестный статус';
      }
    };

    return (
      <div className="book-reading-stats">
        <div className="stats-header">
          <h3>Статистика чтения</h3>
          <span className={`reading-status status-${readingStatus.readingStatus.toLowerCase()}`}>
            {getStatusText(readingStatus.readingStatus)}
          </span>
        </div>
        <div className="reading-stats-content">
          <div className="reading-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              <span className="pages-read">{readingStatus.pageRead}</span>
              <span className="pages-separator"> из </span>
              <span className="pages-total">{readingStatus.bookPageCnt}</span>
              <span className="pages-label"> страниц</span>
              <span className="percentage"> ({percentage}%)</span>
            </div>
          </div>
          {lastReadDate && (
            <div className="last-read-info">
              <span className="last-read-label">Последний раз читалась:</span>
              <span className="last-read-date">{lastReadDate}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Загрузка информации о книге...</p>
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

  if (loading) {
    return (
      <main>
        <div className="book-page-container container">
          {renderLoadingState()}
        </div>
      </main>
    );
  }

  if (error || !bookDetail) {
    return (
      <main>
        <div className="book-page-container container">
          {renderErrorState()}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="book-page-container container">
        <div className="book-info-panel">
          <button
            className="page-close-button"
            onClick={() => navigate(-1)}
            aria-label="Вернуться назад"
            data-tooltip="Закрыть окно"
          >
            ×
          </button>

          <div className="book-header">
            <div className="book-title-section">
              <h2 className="book-title">{formData.title}</h2>
              {bookDetail.subtitle && (
                <h3 className="book-subtitle">{bookDetail.subtitle}</h3>
              )}
              <div className="book-rating-badge">
                <Stars count={formData.rating} size="small" showValue={true} />
                <span className="reviews-count">
                  {bookDetail.reviewsCount} {russianLocalWordConverter(
                    bookDetail.reviewsCount,
                    'отзыв',
                    'отзыва',
                    'отзывов',
                    'отзывов'
                  )}
                </span>
              </div>
            </div>

            {(formData.isMine || isAdmin) && isAuthenticated && (
              <div className="book-actions">
                <button onClick={handleEditBook} title="Редактировать">
                  <img src={Change} alt="Редактировать" />
                </button>
                <button onClick={handleDelete} title="Удалить">
                  <img src={Delete} alt="Удалить" />
                </button>
              </div>
            )}
          </div>

          <div className="book-content">
            <div className="book-main-info">
              <div className="book-cover-section">
                <img
                  className="book-cover"
                  src={formData.coverUrl}
                  alt={`Обложка книги ${formData.title}`}
                />
                {isAuthenticated && (
                  <div className="book-rating-section">
                    <div className="rating-title">
                      {userReview ? 'Ваша оценка:' : 'Поставьте оценку:'}
                    </div>
                    <Stars
                      count={userRating}
                      onChange={userReview ? undefined : setUserRating}
                      size="large"
                      showValue={true}
                    />
                    {!userReview && (
                      <PrimaryButton
                        label="Сохранить оценку"
                        onClick={handleSaveReview}
                        fullWidth={true}
                        disabled={userRating === 0}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="book-details-section">
                <div className="book-details-grid">
                  <div className="detail-group">
                    <label htmlFor="author">Автор</label>
                    <div className="authors-list">
                      {bookDetail.authors.map((author, index) => (
                        <div key={author.authorId} className="author-item">
                          <span className="author-name">{author.name}</span>
                          {author.realName && author.realName !== author.name && (
                            <span className="author-real-name">({author.realName})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-group">
                    <label htmlFor="genre">Жанры</label>
                    <div className="genres-list">
                      {bookDetail.genres.map((genre) => (
                        <span key={genre.genreId} className="genre-tag">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="detail-group">
                    <label htmlFor="pages">Количество страниц</label>
                    <span className="field-value">{formData.pages} стр.</span>
                  </div>

                  <div className="detail-group">
                    <label htmlFor="isbn">ISBN</label>
                    <span className="field-value">{bookDetail.isbn}</span>
                  </div>

                  <div className="detail-group">
                    <label htmlFor="collections">В коллекциях</label>
                    <span className="field-value">
                      {bookDetail.collectionsCount} {russianLocalWordConverter(
                        bookDetail.collectionsCount,
                        'коллекции',
                        'коллекциях',
                        'коллекциях',
                        'коллекциях'
                      )}
                    </span>
                  </div>

                  <div className="detail-group full-width">
                    <label htmlFor="description">Описание</label>
                    <p className="field-value description-text">{formData.description}</p>
                  </div>

                  <div className="detail-group full-width">
                    <label>Добавлено пользователем</label>
                    <div
                      className="added-by clickable"
                      onClick={() => handleAuthorClick(bookDetail.addedBy.userId)}
                    >
                      <img
                        src={getImageUrl(bookDetail.addedBy.profileImage) || PlaceholderImage}
                        alt={bookDetail.addedBy.nickname}
                        className="added-by-avatar"
                      />
                      <span className="added-by-name">{bookDetail.addedBy.nickname}</span>
                    </div>
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="book-action-buttons">
                    <PrimaryButton 
                      label={readingStatus ? "Изменить статус чтения" : "Отметить прочитанное"} 
                      onClick={handleMarkAsRead} 
                      type="button" 
                    />
                    <SecondaryButton label="Добавить в коллекцию" onClick={handleAddToCollection} type="button" />
                  </div>
                )}
              </div>
            </div>

            {isAuthenticated && readingStatus && renderReadingStats()}

            <div className="book-reviews-section">
              <div className="reviews-header">
                <h3>Отзывы</h3>
                <span className="reviews-count">
                  {reviews.length} {russianLocalWordConverter(
                    reviews.length,
                    'отзыв',
                    'отзыва',
                    'отзывов',
                    'отзывов'
                  )}
                </span>
              </div>

              {userReview && (
                <div className="my-review-section">
                  <div className="section-header">
                    <h3>Мой отзыв</h3>
                    <div className="review-actions">
                      <button
                        className="edit-review-btn"
                        onClick={() => setShowReviewModal(true)}
                        title="Редактировать отзыв"
                      >
                        ✎
                      </button>
                      <button
                        className="delete-review-btn"
                        onClick={() => setShowDeleteReviewDialog(true)}
                        title="Удалить отзыв"
                      >
                        <img src={DeleteIcon} alt="Удалить отзыв" />
                      </button>
                    </div>
                  </div>
                  <div className="review-card my-review">
                    <div className="review-header">
                      <div className="review-user">
                        <img
                          src={getImageUrl(userReview.user.profileImage) || PlaceholderImage}
                          alt={userReview.user.nickname}
                          className="review-user-avatar"
                        />
                        <div className="review-user-info">
                          <span className="review-user-name">{userReview.user.nickname}</span>
                          <span className="review-date">
                            {new Date(userReview.user.registeredDate).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                      <Stars count={formatRating(userReview.score)} size="small" showValue={true} />
                    </div>
                    <div className="review-content">
                      <p className="review-text">{userReview.reviewText}</p>
                    </div>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <>
                  <div className="reviews-list">
                    {reviews
                      .filter(review => !userReview || review.reviewId !== userReview.reviewId)
                      .map((review) => (
                        <div key={review.reviewId} className="review-card">
                          <div className="review-header">
                            <div
                              className="review-user clickable"
                              onClick={() => handleReviewUserClick(review.user.userId)}
                            >
                              <img
                                src={getImageUrl(review.user.profileImage) || PlaceholderImage}
                                alt={review.user.nickname}
                                className="review-user-avatar"
                              />
                              <div className="review-user-info">
                                <span className="review-user-name">{review.user.nickname}</span>
                                <span className="review-date">
                                  {new Date(review.user.registeredDate).toLocaleDateString('ru-RU')}
                                </span>
                              </div>
                            </div>
                            <div className="review-header-right">
                              <Stars count={formatRating(review.score)} size="small" showValue={true} />
                              {isAdmin && isAuthenticated && review.user.userId !== Number(currentUser?.id) && (
                                <div className="review-admin-actions">
                                  <button
                                    className="edit-review-btn"
                                    onClick={() => handleAdminReviewEdit(review)}
                                    title="Редактировать отзыв (Администратор)"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className="delete-review-btn"
                                    onClick={() => handleAdminReviewDelete(review)}
                                    title="Удалить отзыв (Администратор)"
                                  >
                                    <img src={DeleteIcon} alt="Удалить отзыв" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="review-content">
                            <p className="review-text">{review.reviewText}</p>
                          </div>
                        </div>
                      ))}
                  </div>

                  {hasMoreReviews && (
                    <div className="load-more-container">
                      <PrimaryButton
                        label="Загрузить еще отзывы"
                        onClick={loadMoreReviews}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="no-reviews-message">Пока нет отзывов о этой книге</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <ConfirmDialog
          title="Удаление книги"
          message="Вы уверены, что хотите удалить эту книгу?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </Modal>

      <Modal open={showDeleteReviewDialog} onClose={() => setShowDeleteReviewDialog(false)}>
        <ConfirmDialog
          title="Удаление отзыва"
          message="Вы уверены, что хотите удалить свой отзыв?"
          onConfirm={confirmDeleteReview}
          onCancel={() => setShowDeleteReviewDialog(false)}
        />
      </Modal>

      <Modal open={showAdminDeleteReviewDialog} onClose={() => setShowAdminDeleteReviewDialog(false)}>
        <ConfirmDialog
          title="Удаление отзыва (Администратор)"
          message={`Вы уверены, что хотите удалить отзыв пользователя ${adminSelectedReview?.user.nickname}?`}
          onConfirm={confirmAdminDeleteReview}
          onCancel={() => setShowAdminDeleteReviewDialog(false)}
        />
      </Modal>

      <ReadingStatusModal
        open={showReadingStatusModal}
        onClose={() => setShowReadingStatusModal(false)}
        bookId={bookId}
        bookTitle={formData.title}
        totalPages={parseInt(formData.pages) || 0}
        currentStatus={readingStatus}
        onStatusUpdated={handleReadingStatusUpdated}
      />

      <Modal open={showCollectionForm} onClose={() => setShowCollectionForm(false)}>
        <CollectionListModal
          bookId={bookId}
          onClose={() => setShowCollectionForm(false)}
        />
      </Modal>

      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={userReview ? handleUpdateReview : handleCreateReview}
        initialScore={userReview ? userReview.score / 2 : userRating}
        initialReviewText={userReview?.reviewText || ''}
        loading={reviewLoading}
      />

      <ReviewModal
        open={showAdminReviewModal}
        onClose={() => {
          setShowAdminReviewModal(false);
          setAdminSelectedReview(null);
        }}
        onSubmit={handleAdminReviewSave}
        initialScore={adminSelectedReview ? adminSelectedReview.score / 2 : 0}
        initialReviewText={adminSelectedReview?.reviewText || ''}
        loading={reviewLoading}
        title="Редактирование отзыва (Администратор)"
      />

      {bookDetail && (
        <Modal open={showEditMenu} onClose={() => setShowEditMenu(false)}>
          <BookEditMenu
            onClose={() => setShowEditMenu(false)}
            book={bookDetail}
            onBookUpdated={handleBookUpdated}
          />
        </Modal>
      )}
    </main>
  );
}

export default Book;