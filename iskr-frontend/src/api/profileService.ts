import axios from 'axios';
import { OAPI_BASE_URL } from '../constants/api';
import type { ProfileUser, ProfileCollection, UserSubscription } from '../types/profile';
import type { ApiResponse } from '../types/popular';

// Создаем инстанс axios
const api = axios.create({
  baseURL: OAPI_BASE_URL,
  timeout: 10000,
});

export const profileAPI = {
  // Получение данных профиля пользователя
  getUserProfile: async (userId: number): Promise<ProfileUser> => {
    try {
      const response = await api.get<ApiResponse<ProfileUser>>(`/v1/user?userId=${userId}`);
      
      if (response.data.data.state === 'OK') {
        return response.data.data.key;
      }
      
      throw new Error(response.data.data.message || 'Failed to fetch user profile');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Получение подписчиков пользователя
  getUserSubscribers: async (
    userId: number, 
    batch: number = 4, 
    page: number = 0
  ): Promise<UserSubscription[]> => {
    try {
      const response = await api.get<ApiResponse<{
        subscribers: UserSubscription[];
        batch: number;
        totalPages: number;
        page: number;
        userId: number;
        totalElements: number;
      }>>(`/v1/user?userId=${userId}/subscribers&batch=${batch}&page=${page}`);
      
      if (response.data.data.state === 'OK') {
        return response.data.data.key.subscribers;
      }
      
      throw new Error(response.data.data.message || 'Failed to fetch subscribers');
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  },

  // Получение подписок пользователя
  getUserSubscriptions: async (
    userId: number, 
    batch: number = 4, 
    page: number = 0
  ): Promise<UserSubscription[]> => {
    try {
      const response = await api.get<ApiResponse<{
        subscriptions: UserSubscription[];
        batch: number;
        totalPages: number;
        page: number;
        userId: number;
        totalElements: number;
      }>>(`/v1/user?userId=${userId}/subscriptions&batch=${batch}&page=${page}`);
      
      if (response.data.data.state === 'OK') {
        return response.data.data.key.subscriptions;
      }
      
      throw new Error(response.data.data.message || 'Failed to fetch subscriptions');
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  },

  // Получение коллекций пользователя
  getUserCollections: async (
    userId: number, 
    batch: number = 4, 
    page: number = 0
  ): Promise<ProfileCollection[]> => {
    try {
      const response = await api.get<ApiResponse<{
        collections: ProfileCollection[];
        batch: number;
        totalPages: number;
        page: number;
        userId: number;
        totalElements: number;
      }>>(`/v1/user?userId=${userId}/collections&batch=${batch}&page=${page}`);
      
      if (response.data.data.state === 'OK') {
        return response.data.data.key.collections;
      }
      
      throw new Error(response.data.data.message || 'Failed to fetch collections');
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  },
};

export default profileAPI;