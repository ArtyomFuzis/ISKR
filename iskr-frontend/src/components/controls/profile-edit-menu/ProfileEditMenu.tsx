import './ProfileEditMenu.scss';
import { useState } from 'react';
import ChangeUsernameModal from '../change-user-modal/ChangeUsernameModal';
import ChangeProfilePhotoModal from '../change-profile-photo-modal/ChangeProfilePhotoModal';
import ChangeDescriptionModal from '../change-description-modal/ChangeDescriptionModal';
import ChangeNicknameModal from '../change-nickname-modal/ChangeNicknameModal';
import ChangeEmailModal from '../change-email-modal/ChangeEmailModal';
import ChangePasswordModal from '../change-password-modal/ChangePasswordModal'; // ← Добавить импорт

interface ProfileEditMenuProps {
  onClose: () => void;
  currentUsername: string;
  currentImageUrl: string;
  currentDescription: string | null;
  currentNickname: string | null;
  currentEmail: string | null;
  onUsernameChanged: (newUsername: string) => void;
  onProfilePhotoChanged: () => void;
  onDescriptionChanged: (newDescription: string) => void;
  onNicknameChanged: (newNickname: string) => void;
}

function ProfileEditMenu({ 
  onClose, 
  currentUsername, 
  currentImageUrl, 
  currentDescription,
  currentNickname,
  currentEmail,
  onUsernameChanged, 
  onProfilePhotoChanged,
  onDescriptionChanged,
  onNicknameChanged
}: ProfileEditMenuProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleOpenModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleUsernameSuccess = (newUsername: string) => {
    onUsernameChanged(newUsername);
    handleCloseModal();
  };

  const handleProfilePhotoSuccess = () => {
    onProfilePhotoChanged();
    handleCloseModal();
  };

  const handleDescriptionSuccess = (newDescription: string) => {
    onDescriptionChanged(newDescription);
    handleCloseModal();
  };

  const handleNicknameSuccess = (newNickname: string) => {
    onNicknameChanged(newNickname);
    handleCloseModal();
  };

  return (
    <>
      <div className="profile-edit-menu">
        <h2 className="profile-edit-title">Редактирование профиля</h2>
        
        <div className="profile-edit-options">
          <button 
            className="profile-edit-option"
            onClick={() => handleOpenModal('username')}
          >
            <div className="option-content">
              <span className="option-title">Сменить имя пользователя</span>
              <span className="option-subtitle">Текущее: {currentUsername}</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          <button 
            className="profile-edit-option"
            onClick={() => handleOpenModal('photo')}
          >
            <div className="option-content">
              <span className="option-title">Сменить фото профиля</span>
              <span className="option-subtitle">Загрузить новое изображение</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          <button 
            className="profile-edit-option"
            onClick={() => handleOpenModal('description')}
          >
            <div className="option-content">
              <span className="option-title">Редактировать описание</span>
              <span className="option-subtitle">Изменить информацию о себе</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          <button 
            className="profile-edit-option"
            onClick={() => handleOpenModal('nickname')}
          >
            <div className="option-content">
              <span className="option-title">Сменить никнейм</span>
              <span className="option-subtitle">Изменить отображаемое имя</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          <button 
            className="profile-edit-option"
            onClick={() => handleOpenModal('email')}
          >
            <div className="option-content">
              <span className="option-title">Сменить email</span>
              <span className="option-subtitle">Изменить адрес электронной почты</span>
            </div>
            <div className="option-icon">→</div>
          </button>

          {/* ← Добавить кнопку для смены пароля */}
          <button 
            className="profile-edit-option"
            onClick={() => handleOpenModal('password')}
          >
            <div className="option-content">
              <span className="option-title">Сменить пароль</span>
              <span className="option-subtitle">Установить новый пароль</span>
            </div>
            <div className="option-icon">→</div>
          </button>
        </div>

        <button className="profile-edit-close" onClick={onClose}>
          Закрыть
        </button>
      </div>

      {/* Модальные окна */}
      {activeModal === 'username' && (
        <ChangeUsernameModal
          open={true}
          onClose={handleCloseModal}
          currentUsername={currentUsername}
          onSuccess={handleUsernameSuccess}
        />
      )}
      
      {activeModal === 'photo' && (
        <ChangeProfilePhotoModal
          open={true}
          onClose={handleCloseModal}
          currentImageUrl={currentImageUrl}
          onSuccess={handleProfilePhotoSuccess}
        />
      )}
      
      {activeModal === 'description' && (
        <ChangeDescriptionModal
          open={true}
          onClose={handleCloseModal}
          currentDescription={currentDescription}
          onSuccess={handleDescriptionSuccess}
        />
      )}
      
      {activeModal === 'nickname' && (
        <ChangeNicknameModal
          open={true}
          onClose={handleCloseModal}
          currentNickname={currentNickname}
          onSuccess={handleNicknameSuccess}
        />
      )}
      
      {activeModal === 'email' && (
        <ChangeEmailModal
          open={true}
          onClose={handleCloseModal}
          currentEmail={currentEmail}
        />
      )}

      {/* ← Добавить модальное окно для смены пароля */}
      {activeModal === 'password' && (
        <ChangePasswordModal
          open={true}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

export default ProfileEditMenu;