// /src/components/controls/book-edit-menu/BookEditMenu.tsx
import { useState } from 'react';
import Modal from '../modal/Modal';
import BookEditModal from '../book-edit-modal/BookEditModal';
import BookEditCoverModal from '../book-edit-cover-modal/BookEditCoverModal';
import BookEditAuthorsModal from '../book-edit-authors-modal/BookEditAuthorsModal';
import BookEditGenresModal from '../book-edit-genres-modal/BookEditGenresModal';
import './BookEditMenu.scss';
import type { BookDetail } from '../../../api/bookService';

interface BookEditMenuProps {
  onClose: () => void;
  book: BookDetail;
  onBookUpdated: () => Promise<void>;
}

function BookEditMenu({ onClose, book, onBookUpdated }: BookEditMenuProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleOpenModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <div className="book-edit-menu">
        <h2 className="book-edit-title">Редактирование книги</h2>
        
        <div className="book-edit-options">
          <button 
            className="book-edit-option"
            onClick={() => handleOpenModal('details')}
          >
            <div className="option-content">
              <span className="option-title">Редактировать информацию</span>
              <span className="option-subtitle">Название, описание, ISBN, страницы</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          <button 
            className="book-edit-option"
            onClick={() => handleOpenModal('authors')}
          >
            <div className="option-content">
              <span className="option-title">Редактировать авторов</span>
              <span className="option-subtitle">Добавить или удалить авторов</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          <button 
            className="book-edit-option"
            onClick={() => handleOpenModal('genres')}
          >
            <div className="option-content">
              <span className="option-title">Редактировать жанры</span>
              <span className="option-subtitle">Добавить или удалить жанры</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          <button 
            className="book-edit-option"
            onClick={() => handleOpenModal('cover')}
          >
            <div className="option-content">
              <span className="option-title">Сменить обложку</span>
              <span className="option-subtitle">Загрузить новую обложку</span>
            </div>
            <div className="option-icon">→</div>
          </button>
        </div>

        <button className="book-edit-close" onClick={onClose}>
          Закрыть
        </button>
      </div>

      {/* Модальные окна для редактирования */}
      {activeModal === 'details' && (
        <BookEditModal
          open={true}
          onClose={handleCloseModal}
          book={book}
          onBookUpdated={onBookUpdated}
        />
      )}
      
      {activeModal === 'authors' && (
        <BookEditAuthorsModal
          open={true}
          onClose={handleCloseModal}
          book={book}
          onBookUpdated={onBookUpdated}
        />
      )}
      
      {activeModal === 'genres' && (
        <BookEditGenresModal
          open={true}
          onClose={handleCloseModal}
          book={book}
          onBookUpdated={onBookUpdated}
        />
      )}
      
      {activeModal === 'cover' && (
        <BookEditCoverModal
          open={true}
          onClose={handleCloseModal}
          book={book}
          onBookUpdated={onBookUpdated}
        />
      )}
    </>
  );
}

export default BookEditMenu;