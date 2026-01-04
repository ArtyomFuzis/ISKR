// /src/components/controls/book-edit-cover-modal/BookEditCoverModal.tsx
import { useState, useRef, ChangeEvent } from 'react';
import Modal from '../modal/Modal';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import './BookEditCoverModal.scss';
import bookAPI from '../../../api/bookService';
import type { BookDetail } from '../../../api/bookService';
import PlaceholderImage from '../../../assets/images/placeholder.jpg';

interface BookEditCoverModalProps {
  open: boolean;
  onClose: () => void;
  book: BookDetail;
  onBookUpdated: () => Promise<void>;
}

function BookEditCoverModal({ open, onClose, book, onBookUpdated }: BookEditCoverModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла. Допустимы: JPEG, PNG, GIF, WebP, BMP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Выберите файл для загрузки');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Загружаем изображение на сервер
      const uploadResponse = await bookAPI.uploadBookImage(selectedFile);
      
      const uploadResult = uploadResponse.data || uploadResponse;
      
      if (uploadResult.state === 'OK') {
        const imageId = uploadResult.key?.imglId;
        
        if (!imageId) {
          setError('Не удалось получить ID загруженного изображения');
          return;
        }
        
        // 2. Обновляем только обложку книги - отправляем просто число!
        const updateData = {
          photoLink: imageId
        };

        await bookAPI.updateBook(book.bookId, updateData);
        setSuccess('Обложка книги успешно изменена');
        
        // Ждем немного, чтобы показать сообщение об успехе, затем обновляем данные книги и закрываем
        setTimeout(async () => {
          try {
            await onBookUpdated();
          } finally {
            handleClose();
          }
        }, 1500);
      } else {
        setError(uploadResult.message || 'Ошибка при загрузке изображения');
      }
    } catch (err: any) {
      console.error('Error uploading book cover:', err);
      
      if (err.response?.data?.state === 'Fail_BadData') {
        setError(err.response.data.message || 'Неподдерживаемый формат файла');
      } else if (err.response?.data?.data?.details?.message) {
        setError(err.response.data.data.details.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка при загрузке обложки');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
    setUploading(false);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const currentCoverUrl = book.photoLink?.imageData?.uuid 
    ? `/images/${book.photoLink.imageData.uuid}.${book.photoLink.imageData.extension}`
    : PlaceholderImage;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="book-edit-cover-modal">
        <h2 className="modal-title">Смена обложки книги</h2>
        
        <div className="cover-preview-container">
          <div className="current-cover">
            <span className="preview-label">Текущая обложка:</span>
            <img src={currentCoverUrl} alt="Текущая обложка" className="preview-image" />
          </div>
          
          {previewUrl && (
            <div className="new-cover">
              <span className="preview-label">Новая обложка:</span>
              <img src={previewUrl} alt="Новая обложка" className="preview-image" />
            </div>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
          style={{ display: 'none' }}
        />
        
        <button 
          className="select-file-button"
          onClick={triggerFileInput}
          disabled={uploading}
        >
          Выбрать файл
        </button>
        
        {selectedFile && (
          <div className="file-info">
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
          </div>
        )}
        
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
            disabled={uploading}
          />
          <PrimaryButton 
            label={uploading ? "Загрузка..." : "Сохранить"} 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile}
          />
        </div>
      </div>
    </Modal>
  );
}

export default BookEditCoverModal;