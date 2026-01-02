import './Subscriptions.scss';
import CardElement from "../../controls/card-element/CardElement.tsx";
import Delete from "../../../assets/elements/delete.svg";
import {useLocation, useNavigate, Navigate} from "react-router-dom";
import {useState, useEffect, useCallback} from "react";
import {useSelector} from "react-redux";
import type {RootState} from "../../../redux/store.ts";
import Modal from "../../controls/modal/Modal.tsx";
import Login from "../../controls/login/Login.tsx";
import ConfirmDialog from "../../controls/confirm-dialog/ConfirmDialog.tsx";
import PrimaryButton from "../../controls/primary-button/PrimaryButton.tsx";
import AddIcon from "../../../assets/elements/add.svg";
import {russianLocalWordConverter} from "../../../utils/russianLocalWordConverter.ts";
import PlaceholderImage from '../../../assets/images/placeholder.jpg';
import profileAPI from '../../../api/profileService';
import type { UserSubscription } from '../../../types/profile';
import { getImageUrl } from '../../../api/popularService';
import SecondaryButton from "../../controls/secondary-button/SecondaryButton.tsx";

function Subscriptions() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Получаем userId и isMine из state
  const userId = location.state?.userId;
  const isMine = location.state?.isMine || false;
  
  // Если userId нет - редирект на главную
  if (!userId) {
    return <Navigate to="/" replace />;
  }

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Состояния для данных
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для модалки отписки
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);

  // Состояния для подписки/отписки на пользователей (для режима !isMine)
  const [subscriptionStates, setSubscriptionStates] = useState<Record<number, boolean>>({});
  const [subscriptionCounts, setSubscriptionCounts] = useState<Record<number, number>>({});

  // Загрузка подписок - загружаем всех сразу (большой batch)
  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем все подписки сразу (1000 - большое число чтобы охватить всех)
      const subscriptionsData = await profileAPI.getUserSubscriptions(userId, 1000, 0);
      setSubscriptions(subscriptionsData);

      // Если это не мой профиль и я авторизован, проверяем свои подписки на этих пользователей
      if (isAuthenticated && currentUser && !isMine) {
        const subscriptionPromises = subscriptionsData.map(async (subscription) => {
          try {
            const isSubscribed = await profileAPI.checkSubscription(subscription.userId);
            return { userId: subscription.userId, isSubscribed };
          } catch (err) {
            console.error(`Error checking subscription for user ${subscription.userId}:`, err);
            return { userId: subscription.userId, isSubscribed: false };
          }
        });

        const results = await Promise.all(subscriptionPromises);
        
        const newStates: Record<number, boolean> = {};
        const newCounts: Record<number, number> = {};
        
        results.forEach(result => {
          newStates[result.userId] = result.isSubscribed;
        });

        subscriptionsData.forEach(subscription => {
          newCounts[subscription.userId] = subscription.subscribersCount || 0;
        });

        setSubscriptionStates(newStates);
        setSubscriptionCounts(newCounts);
      }
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      setError(err.message || 'Ошибка загрузки подписок');
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, currentUser, isMine]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Загрузка профиля для получения username (для заголовка)
  const [profile, setProfile] = useState<{ displayName: string } | null>(null);
  
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await profileAPI.getUserProfile(userId);
        setProfile({
          displayName: profileData.nickname || profileData.username || 'Пользователь'
        });
      } catch (err) {
        console.error('Error loading profile for title:', err);
      }
    };
    
    loadProfile();
  }, [userId]);

  const handleUserClick = (subscription: UserSubscription) => {
    navigate('/profile', {
      state: {
        userId: subscription.userId
      }
    });
  };

  const handleUnsubscribe = (subscriptionId: number) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    setSelectedSubscriptionId(subscriptionId);
    setShowUnsubscribeModal(true);
  };

  const confirmUnsubscribe = async () => {
    if (selectedSubscriptionId === null) return;

    setUnsubscribeLoading(true);
    try {
      // Вызываем метод отписки из profileService
      const response = await profileAPI.unsubscribeFromUser(selectedSubscriptionId);
      
      if (response.data?.state === 'OK') {
        // Успешно отписались - удаляем из списка
        setSubscriptions(prev => prev.filter(sub => sub.userId !== selectedSubscriptionId));
      } else {
        // Обработка ошибки от бэкенда
        console.error('Unsubscribe error:', response.data?.message);
      }
    } catch (err: any) {
      console.error('Error unsubscribing:', err);
      // Обрабатываем специфичные ошибки
      if (err.response?.data?.data?.details?.state === 'Fail_NotFound') {
        console.error('Subscription not found - removing from list anyway');
        // Если подписка не найдена, всё равно удаляем из списка
        setSubscriptions(prev => prev.filter(sub => sub.userId !== selectedSubscriptionId));
      }
    } finally {
      setUnsubscribeLoading(false);
      setShowUnsubscribeModal(false);
      setSelectedSubscriptionId(null);
    }
  };

  // Обработчик подписки/отписки для режима !isMine
  const handleUserFollow = async (subscription: UserSubscription) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    const userIdToFollow = subscription.userId;
    const isCurrentlySubscribed = subscriptionStates[userIdToFollow] || false;

    try {
      if (isCurrentlySubscribed) {
        // Отписываемся
        const response = await profileAPI.unsubscribeFromUser(userIdToFollow);
        
        if (response.data?.state === 'OK') {
          // Обновляем состояние подписки
          setSubscriptionStates(prev => ({
            ...prev,
            [userIdToFollow]: false
          }));
          
          // Уменьшаем счетчик подписчиков
          setSubscriptionCounts(prev => ({
            ...prev,
            [userIdToFollow]: (prev[userIdToFollow] || subscription.subscribersCount || 0) - 1
          }));
        }
      } else {
        // Подписываемся
        const response = await profileAPI.subscribeToUser(userIdToFollow);
        
        if (response.data?.state === 'OK') {
          // Обновляем состояние подписки
          setSubscriptionStates(prev => ({
            ...prev,
            [userIdToFollow]: true
          }));
          
          // Увеличиваем счетчик подписчиков
          setSubscriptionCounts(prev => ({
            ...prev,
            [userIdToFollow]: (prev[userIdToFollow] || subscription.subscribersCount || 0) + 1
          }));
        }
      }
    } catch (err: any) {
      console.error('Error following/unfollowing user:', err);
      // Обрабатываем ошибки
      if (err.response?.data?.data?.details?.state === 'Fail_Conflict') {
        console.error('Already subscribed to this user');
      } else if (err.response?.data?.data?.details?.state === 'Fail_NotFound') {
        console.error('Subscription not found');
      }
    }
  };

  const getFollowerCount = (subscription: UserSubscription): string => {
    if (isMine) {
      // В режиме isMine показываем реальное количество подписчиков
      const count = subscription.subscribersCount || 0;
      const formattedCount = count.toLocaleString('ru-RU');
      
      return `${formattedCount} ${russianLocalWordConverter(
        count,
        'подписчик',
        'подписчика',
        'подписчиков',
        'подписчиков'
      )}`;
    } else {
      // В режиме !isMine используем обновленные счетчики
      const count = subscriptionCounts[subscription.userId] || subscription.subscribersCount || 0;
      const formattedCount = count.toLocaleString('ru-RU');
      
      return `${formattedCount} ${russianLocalWordConverter(
        count,
        'подписчик',
        'подписчика',
        'подписчиков',
        'подписчиков'
      )}`;
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  // Рендер состояний загрузки и ошибок
  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Загрузка подписок...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="error-state">
      <p>Ошибка: {error}</p>
      <SecondaryButton 
        label="Вернуться назад" 
        onClick={handleBackClick}
      />
    </div>
  );

  const getTitle = (): string => {
    if (isMine) return 'Мои подписки';
    return `Подписки ${profile?.displayName || 'пользователя'}`;
  };

  const getEmptyMessage = (): string => {
    if (isMine) return 'У вас пока нет подписок.';
    return `У ${profile?.displayName || 'пользователя'} пока нет подписок.`;
  };

  return (
    <main>
      <div className="top-container">
        <div className="container-title-with-button">
          <h2>{getTitle()}</h2>
          <PrimaryButton label="Вернуться назад" onClick={handleBackClick} />
        </div>

        <div className="subscriptions-container container">
          {loading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : subscriptions.length > 0 ? (
            <div className="subscriptions-list">
              {subscriptions.map((subscription) => {
                const displayName = subscription.nickname || subscription.username || 'Пользователь';
                
                return isMine ? (
                  <CardElement
                    key={subscription.userId}
                    title={displayName}
                    description={getFollowerCount(subscription)}
                    imageUrl={getImageUrl(subscription.profileImage) || PlaceholderImage}
                    button={true}
                    buttonLabel="Отписаться"
                    buttonIconUrl={Delete}
                    onClick={() => handleUserClick(subscription)}
                    isAuthenticated={isAuthenticated}
                    onUnauthorized={() => setShowLoginModal(true)}
                    onButtonClick={() => handleUnsubscribe(subscription.userId)}
                  />
                ) : (
                  <CardElement
                    key={subscription.userId}
                    title={displayName}
                    description={getFollowerCount(subscription)}
                    imageUrl={getImageUrl(subscription.profileImage) || PlaceholderImage}
                    button={true}
                    buttonLabel={subscriptionStates[subscription.userId] ? "Отписаться" : "Подписаться"}
                    buttonIconUrl={subscriptionStates[subscription.userId] ? Delete : AddIcon}
                    onClick={() => handleUserClick(subscription)}
                    onButtonClick={() => handleUserFollow(subscription)}
                    isAuthenticated={isAuthenticated}
                    onUnauthorized={() => setShowLoginModal(true)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="no-subscriptions-message">
              {getEmptyMessage()}
            </p>
          )}
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

      <Modal open={showUnsubscribeModal} onClose={() => setShowUnsubscribeModal(false)}>
        <ConfirmDialog
          title="Подтверждение отписки"
          message="Вы уверены, что хотите отписаться от этого пользователя?"
          onConfirm={confirmUnsubscribe}
          onCancel={() => {
            setShowUnsubscribeModal(false);
            setSelectedSubscriptionId(null);
          }}
          confirmLoading={unsubscribeLoading}
          confirmText={unsubscribeLoading ? "Отписка..." : "Да, отписаться"}
        />
      </Modal>
    </main>
  );
}

export default Subscriptions;