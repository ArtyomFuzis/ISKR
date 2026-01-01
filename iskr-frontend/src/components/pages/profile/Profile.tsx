import PrimaryButton from "../../controls/primary-button/PrimaryButton.tsx";
import CardElement from "../../controls/card-element/CardElement.tsx";
import AddIcon from "../../../assets/elements/add.svg";
import {useLocation, useNavigate, Navigate} from "react-router-dom";
import VerticalAccordion from "../../controls/vertical-accordion/VerticalAccordion.tsx";
import Delete from "../../../assets/elements/delete.svg";
import {useState, useEffect} from "react";
import type {RootState} from "../../../redux/store.ts";
import {useSelector} from "react-redux";
import Login from "../../controls/login/Login.tsx";
import Modal from "../../controls/modal/Modal.tsx";
import './Profile.scss';
import {russianLocalWordConverter} from "../../../utils/russianLocalWordConverter.ts";
import SecondaryButton from "../../controls/secondary-button/SecondaryButton.tsx";
import PlaceholderImage from '../../../assets/images/placeholder.jpg';
import profileAPI from '../../../api/profileService';
import type { ProfileUser, ProfileCollection, UserSubscription } from '../../../types/profile';
import { getImageUrl, getCollectionImageUrl } from '../../../api/popularService';

function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Получаем userId из state или из location.state (для обратной совместимости)
  const userId = location.state?.userId || location.state?.id;
  
  // Если userId нет - редирект на главную
  if (!userId) {
    return <Navigate to="/" replace />;
  }

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Состояния для данных
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [subscribers, setSubscribers] = useState<UserSubscription[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [collections, setCollections] = useState<ProfileCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentSubscribersCount, setCurrentSubscribersCount] = useState(0);

  // Загрузка данных профиля
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загружаем все данные параллельно
        const [profileData, subscribersData, subscriptionsData, collectionsData] = await Promise.all([
          profileAPI.getUserProfile(userId),
          profileAPI.getUserSubscribers(userId, 4, 0),
          profileAPI.getUserSubscriptions(userId, 4, 0),
          profileAPI.getUserCollections(userId, 4, 0)
        ]);

        setProfile(profileData);
        setCurrentSubscribersCount(profileData.subscribersCount || 0);
        setSubscribers(subscribersData);
        setSubscriptions(subscriptionsData);
        setCollections(collectionsData);
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Ошибка загрузки профиля');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [userId]);

  // Обработчики
  const handleSubscribeProfile = () => {
    setIsSubscribed(!isSubscribed);
    setCurrentSubscribersCount(prev => isSubscribed ? prev - 1 : prev + 1);
  };

  const getFormattedSubscribersCount = (): string => {
    return currentSubscribersCount.toLocaleString('ru-RU').replace(/,/g, ' ');
  };

  const getSubscribersWord = (count: number): string => {
    return russianLocalWordConverter(count, 'подписчик', 'подписчика', 'подписчиков', 'подписчиков');
  };

  const handleFollowerClick = (follower: UserSubscription) => {
    navigate('/profile', {
      state: {
        userId: follower.userId
      }
    });
  };

  const handleSubscriberClick = () => {
    navigate('/followers', {
      state: {
        userId,
        isMine: false
      }
    });
  };

  const handleSubscriptionsClick = () => {
    navigate('/subscriptions', {
      state: {
        userId,
        isMine: false
      }
    });
  };

  const handleCollectionClick = (collection: ProfileCollection) => {
    navigate('/collection', {
      state: {
        id: collection.collectionId,
        name: collection.title,
        description: collection.description,
        isMine: false,
        coverUrl: getCollectionImageUrl(collection as any) || PlaceholderImage,
        owner: profile?.nickname || profile?.username || 'Пользователь',
        booksCount: collection.bookCount,
        likesCount: 0,
        books: []
      }
    });
  };

  // Получаем URL аватара
  const getAvatarUrl = (): string => {
    if (!profile) return PlaceholderImage;
    
    const imageUrl = profile.profileImage ? 
      getImageUrl(profile.profileImage) : 
      null;
    
    return imageUrl || PlaceholderImage;
  };

  // Получаем отображаемое имя
  const getDisplayName = (): string => {
    if (!profile) return 'Загрузка...';
    return profile.nickname || profile.username || 'Пользователь';
  };

  // Рендер состояний загрузки и ошибок
  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Загрузка профиля...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="error-state">
      <p>Ошибка: {error}</p>
      <SecondaryButton 
        label="Вернуться на главную" 
        onClick={() => navigate('/')}
      />
    </div>
  );

  if (loading) {
    return (
      <main>
        <div className="top-container">
          {renderLoadingState()}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="top-container">
          {renderErrorState()}
        </div>
      </main>
    );
  }

  if (!profile) {
    return <Navigate to="/" replace />;
  }

  return (
    <main>
      <div className="top-container">
        <div className="container-title-with-button">
          <h2>Профиль</h2>
          {isAuthenticated && (
            <div>
              {isSubscribed ? (
                <SecondaryButton label={"Отписаться"} onClick={handleSubscribeProfile}/>
              ) : (
                <PrimaryButton label={"Подписаться"} onClick={handleSubscribeProfile}/>
              )}
            </div>
          )}
        </div>

        <div className="profile-info container">
          <div className="profile-info-main">
            <div className="profile-info-panel">
              <span className="profile-info-name">{getDisplayName()}</span>
              <div className="profile-avatar-container">
                <img className="profile-avatar" alt="" src={getAvatarUrl()}/>
              </div>
              <div className="profile-info-additional-container">
                <div className="profile-info-additional clickable" onClick={handleSubscriberClick}>
                  <span className="profile-info-label">{getFormattedSubscribersCount()} </span>
                  <span className="profile-info-sublabel">{getSubscribersWord(currentSubscribersCount)}</span>
                </div>
                <div className="profile-info-additional clickable" onClick={handleSubscriptionsClick}>
                  <span className="profile-info-label">{(profile.subscriptionsCount || 0).toLocaleString('ru-RU')} </span>
                  <span className="profile-info-sublabel">подписок</span>
                </div>
                <div className="profile-info-additional">
                  <span className="profile-info-label">{(profile.collectionsCount || 0).toLocaleString('ru-RU')} </span>
                  <span className="profile-info-sublabel">коллекций</span>
                </div>
              </div>
            </div>

            <div className="profile-info-collections">
              <span className="profile-collections-title">Коллекции</span>
              {collections.length > 0 ? (
                <VerticalAccordion 
                  header={
                    <div className="profile-collections-header">
                      {collections.slice(0, 4).map((collection) => (
                        <div key={collection.collectionId}>
                          <CardElement
                            title={collection.title}
                            description={getDisplayName()}
                            infoDecoration={`${collection.bookCount} ${russianLocalWordConverter(
                              collection.bookCount,
                              'книга',
                              'книги',
                              'книг',
                              'книг'
                            )}`}
                            imageUrl={getCollectionImageUrl(collection as any) || PlaceholderImage}
                            button={true}
                            buttonLabel={"Добавить в избранное"}
                            onClick={() => handleCollectionClick(collection)}
                            buttonIconUrl={AddIcon}
                            buttonChanged={true}
                            buttonChangedIconUrl={Delete}
                            buttonChangedLabel={"Удалить из избранного"}
                            isAuthenticated={isAuthenticated}
                            onUnauthorized={() => setShowLoginModal(true)}
                          />
                        </div>
                      ))}
                    </div>
                  }
                  content={
                    collections.slice(4).length > 0 ? (
                      <div>
                        {collections.slice(4).map((collection) => (
                          <div key={collection.collectionId} onClick={() => handleCollectionClick(collection)}>
                            <CardElement
                              title={collection.title}
                              description={getDisplayName()}
                              infoDecoration={`${collection.bookCount} ${russianLocalWordConverter(
                                collection.bookCount,
                                'книга',
                                'книги',
                                'книг',
                                'книг'
                              )}`}
                              imageUrl={getCollectionImageUrl(collection as any) || PlaceholderImage}
                              button={true}
                              buttonLabel={"Добавить в избранное"}
                              buttonIconUrl={AddIcon}
                              buttonChanged={true}
                              buttonChangedIconUrl={Delete}
                              buttonChangedLabel={"Удалить из избранного"}
                              isAuthenticated={isAuthenticated}
                              onUnauthorized={() => setShowLoginModal(true)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null
                  }
                />
              ) : (
                <p className="no-books-message">У пользователя пока нет коллекций.</p>
              )}
            </div>
          </div>

          <div className="profile-info-followers">
            <div className="profile-section-header">
              <span className="profile-section-title">Подписчики</span>
              {subscribers.length > 0 && (
                <SecondaryButton
                  label="Перейти ко всем"
                  onClick={handleSubscriberClick}
                />
              )}
            </div>
            {subscribers.length > 0 ? (
              <div className="profile-followers-list">
                {subscribers.map((subscriber) => (
                  <CardElement
                    key={subscriber.userId}
                    title={subscriber.nickname || subscriber.username}
                    description={`${(profile.subscribersCount || 0).toLocaleString('ru-RU')} подписчиков`}
                    imageUrl={getImageUrl(subscriber.profileImage) || PlaceholderImage}
                    button={false}
                    onClick={() => handleFollowerClick(subscriber)}
                  />
                ))}
              </div>
            ) : (
              <p className="no-items-message">Нет подписчиков</p>
            )}
          </div>

          <div className="profile-info-subscriptions">
            <div className="profile-section-header">
              <span className="profile-section-title">Подписки</span>
              {subscriptions.length > 0 && (
                <SecondaryButton
                  label="Перейти ко всем"
                  onClick={handleSubscriptionsClick}
                />
              )}
            </div>
            {subscriptions.length > 0 ? (
              <div className="profile-subscriptions-list">
                {subscriptions.map((subscription) => (
                  <CardElement
                    key={subscription.userId}
                    title={subscription.nickname || subscription.username}
                    description={`${(profile.subscriptionsCount || 0).toLocaleString('ru-RU')} подписчиков`}
                    imageUrl={getImageUrl(subscription.profileImage) || PlaceholderImage}
                    button={false}
                    onClick={() => handleFollowerClick(subscription)}
                  />
                ))}
              </div>
            ) : (
              <p className="no-items-message">Нет подписок</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      >
        <Login
          type="login"
          onSubmit={() => setShowLoginModal(false)}
        />
      </Modal>
    </main>
  );
}

export default Profile;