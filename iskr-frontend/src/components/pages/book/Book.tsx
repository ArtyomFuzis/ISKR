// /src/components/pages/book/Book.tsx
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store.ts";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PrimaryButton from "../../controls/primary-button/PrimaryButton.tsx";
import SecondaryButton from "../../controls/secondary-button/SecondaryButton.tsx";
import Change from "../../../assets/elements/change-pink.svg";
import Delete from "../../../assets/elements/delete-pink.svg";
import './Book.scss';
import Stars from "../../stars/Stars.tsx";
import Modal from "../../controls/modal/Modal.tsx";
import ConfirmDialog from "../../controls/confirm-dialog/ConfirmDialog.tsx";
import ReadingForm from "../../controls/reading-form/ReadingForm.tsx";
import CollectionListModal from "../../controls/collection-list-modal/CollectionListModal.tsx";
import BookEditMenu from "../../controls/book-edit-menu/BookEditMenu.tsx";
import PlaceholderImage from '../../../assets/images/placeholder.jpg';
import bookAPI, { type BookDetail, type Review } from '../../../api/bookService';
import { getImageUrl, getBookImageUrl, formatRating } from '../../../api/popularService';
import { russianLocalWordConverter } from '../../../utils/russianLocalWordConverter.ts';

function Book() {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const location = useLocation();
    const navigate = useNavigate();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReadingForm, setShowReadingForm] = useState(false);
    const [showCollectionForm, setShowCollectionForm] = useState(false);
    const [showEditMenu, setShowEditMenu] = useState(false);
    const [userRating, setUserRating] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookDetail, setBookDetail] = useState<BookDetail | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsPagination, setReviewsPagination] = useState({
        page: 0,
        totalPages: 1,
        totalElements: 0,
        batch: 10
    });
    const [hasMoreReviews, setHasMoreReviews] = useState(false);

    const bookId = parseInt(location.state?.id || '0');

    // Функция для загрузки данных книги
    const loadBookData = async () => {
        if (!bookId) {
            setError('ID книги не указан');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Загружаем информацию о книге и отзывы параллельно
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
        } catch (err: any) {
            console.error('Error loading book:', err);
            setError(err.message || 'Ошибка загрузки информации о книге');
        } finally {
            setLoading(false);
        }
    };

    // Загрузка данных книги и отзывов
    useEffect(() => {
        loadBookData();
    }, [bookId]);

    // Загрузка дополнительных отзывов
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

    // Обновляем formData при загрузке bookDetail
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
        navigate(-1);
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sessionStorage.setItem('updatedBook', JSON.stringify({}));
        navigate(-1);
    }

    const confirmDelete = async () => {
        try {
            await bookAPI.deleteBook(bookId);
            // После успешного удаления перенаправляем на главную
            navigate('/');
        } catch (err: any) {
            console.error('Error deleting book:', err);
            setError(err.message || 'Ошибка при удалении книги');
        }
    };

    const handleAddToCollection = () => {
        setShowCollectionForm(true);
    }

    const handleMarkAsRead = () => {
        setShowReadingForm(true);
    }

    const handleDelete = () => {
        setShowDeleteDialog(true);
    }

    const handleEditBook = () => {
        setShowEditMenu(true);
    };

    const handleBookUpdated = async () => {
        // Перезагружаем данные книги после обновления
        await loadBookData();
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

    const getReadingStats = () => {
        if (!bookDetail) return null;

        const bookId = bookDetail.bookId.toString();
        const idHash = bookId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

        const totalPages = bookDetail.pageCnt;

        const pagesReadPercentage = 10 + (idHash % 85);
        const pagesRead = Math.floor((totalPages * pagesReadPercentage) / 100);

        const daysAgo = 1 + (idHash % 30);
        const lastReadDate = new Date();
        lastReadDate.setDate(lastReadDate.getDate() - daysAgo);

        const formatDate = (date: Date, daysAgo: number) => {
            const day = date.getDate();
            const month = date.toLocaleString('ru-RU', { month: 'long' });
            const year = date.getFullYear();

            let daysAgoStr = '';
            if (daysAgo === 1 || daysAgo === 21) {
                daysAgoStr = `${daysAgo} день`;
            } else if ((daysAgo >= 2 && daysAgo <= 4) || (daysAgo >= 22 && daysAgo <= 24)) {
                daysAgoStr = `${daysAgo} дня`;
            } else {
                daysAgoStr = `${daysAgo} дней`;
            }

            return `${daysAgoStr} назад (${day} ${month} ${year})`;
        };

        return {
            pagesRead,
            totalPages,
            percentage: Math.round((pagesRead / totalPages) * 100),
            lastRead: formatDate(lastReadDate, daysAgo)
        };
    };

    const readingStats = formData.isMine && isAuthenticated ? getReadingStats() : null;

    // Рендер состояний загрузки и ошибок
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

                        {formData.isMine && isAuthenticated && (
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
                                        <div className="rating-title">Ваша оценка:</div>
                                        <Stars
                                            count={userRating}
                                            onChange={setUserRating}
                                            size="large"
                                            showValue={true}
                                        />
                                        <PrimaryButton
                                            label="Сохранить оценку"
                                            onClick={handleSaveReview}
                                            fullWidth={true}
                                        />
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

                                {isAuthenticated && !formData.isMine && (
                                    <div className="book-action-buttons">
                                        <PrimaryButton label="Отметить прочитанное" onClick={handleMarkAsRead} type="button" />
                                        <SecondaryButton label="Добавить в коллекцию" onClick={handleAddToCollection} type="button" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {readingStats && (
                            <div className="book-reading-stats">
                                <h3>Статистика чтения</h3>
                                <div className="reading-stats-content">
                                    <div className="reading-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${readingStats.percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="progress-text">
                                            <span className="pages-read">{readingStats.pagesRead}</span>
                                            <span className="pages-separator"> из </span>
                                            <span className="pages-total">{readingStats.totalPages}</span>
                                            <span className="pages-label"> страниц</span>
                                            <span className="percentage"> ({readingStats.percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="last-read-info">
                                        <span className="last-read-label">Последний раз читалась:</span>
                                        <span className="last-read-date">{readingStats.lastRead}</span>
                                    </div>
                                </div>
                            </div>
                        )}

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

                            {reviews.length > 0 ? (
                                <>
                                    <div className="reviews-list">
                                        {reviews.map((review) => (
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
                                                    <Stars count={formatRating(review.score)} size="small" showValue={true} />
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

            <Modal open={showReadingForm} onClose={() => setShowReadingForm(false)}>
                <ReadingForm
                    bookTitle={formData.title}
                    bookId={bookId.toString()}
                    bookAuthor={formData.author}
                    bookRating={formData.rating}
                    bookImageUrl={formData.coverUrl || ''}
                    onSubmit={(readingData) => {
                        // Обработка формы чтения
                        setShowReadingForm(false);
                    }}
                />
            </Modal>

            <Modal open={showCollectionForm} onClose={() => setShowCollectionForm(false)}>
                <CollectionListModal
                    onCollectionSelected={(collectionIds) => {
                        console.log('Книга добавлена в коллекции:', collectionIds);
                        setShowCollectionForm(false);
                    }}
                />
            </Modal>

            {/* Модальное окно редактирования книги */}
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