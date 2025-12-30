import axios from 'axios';
import type {
    PopularResponse,
    User,
    Book,
    Collection,
    PhotoLink
} from '../types/popular';
import { OAPI_BASE_URL, IMAGES_BASE_URL, API_ENDPOINTS } from '../constants/api';

// Создаем инстанс axios для OAPI
const api = axios.create({
  baseURL: OAPI_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для получения URL изображения
export const getImageUrl = (photoLink: PhotoLink | null | undefined): string | null => {
  if (!photoLink?.imageData?.uuid || !photoLink?.imageData?.extension) {
    return null;
  }
  return `${IMAGES_BASE_URL}/${photoLink.imageData.uuid}.${photoLink.imageData.extension}`;
};

// Функция для получения URL изображения пользователя
export const getUserImageUrl = (user: User): string | null => {
  if (!user.profileImage) {
    return null;
  }
  return getImageUrl(user.profileImage);
};

// Функция для получения URL изображения книги
export const getBookImageUrl = (book: Book): string | null => {
  if (!book.photoLink) {
    return null;
  }
  return getImageUrl(book.photoLink);
};

// Функция для получения URL изображения коллекции
export const getCollectionImageUrl = (collection: Collection): string | null => {
  if (!collection.photoLink) {
    return null;
  }
  return getImageUrl(collection.photoLink);
};

// Вспомогательная функция для форматирования рейтинга (из 10-балльной в 5-балльную)
export const formatRating = (rating: number | null): number => {
  if (rating === null) {
    return 0;
  }
  // Преобразуем из 10-балльной шкалы в 5-балльную
  return Math.round((rating / 2) * 10) / 10; // Округляем до 1 знака после запятой
};

export const popularAPI = {
  // Получение популярных пользователей (без изменений)
  getPopularUsers: async (limit: number = 12): Promise<User[]> => {
    try {
      const response = await api.get<PopularResponse<User>>(API_ENDPOINTS.POPULAR_USERS, {
        params: { limit }
      });
      
      if (response.data.data.state === 'OK' && response.data.data.key.users) {
        return response.data.data.key.users;
      }
      
      throw new Error(response.data.data.message || 'Failed to fetch popular users');
    } catch (error) {
      console.error('Error fetching popular users:', error);
      throw error;
    }
  },

  // Получение популярных книг
  getPopularBooks: async (limit: number = 12): Promise<Book[]> => {
    try {
      const response = await api.get<PopularResponse<Book>>(API_ENDPOINTS.POPULAR_BOOKS, {
        params: { limit }
      });
      
      if (response.data.data.state === 'OK' && response.data.data.key.books) {
        return response.data.data.key.books;
      }
      
      throw new Error(response.data.data.message || 'Failed to fetch popular books');
    } catch (error) {
      console.error('Error fetching popular books:', error);
      return [];
    }
  },

  // Получение популярных коллекций
  getPopularCollections: async (limit: number = 12): Promise<Collection[]> => {
    try {
      const response = await api.get<PopularResponse<Collection>>(API_ENDPOINTS.POPULAR_COLLECTIONS, {
        params: { limit }
      });
      
      if (response.data.data.state === 'OK' && response.data.data.key.collections) {
        return response.data.data.key.collections;
      }
      
      throw new Error(response.data.data.message || 'Failed to fetch popular collections');
    } catch (error) {
      console.error('Error fetching popular collections:', error);
      return [];
    }
  },
};

export default popularAPI;