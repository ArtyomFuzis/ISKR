// Базовые URL для API
export const OAPI_BASE_URL = '/oapi'; // Проксируется через Vite

// Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/v1/accounts/login',
  REGISTER: '/v1/accounts/register',
  LOGOUT: '/v1/accounts/logout',
  GET_CURRENT_USER: '/v1/accounts/user', // Изменили с /me на /user
  GET_USER_PROFILE: '/v1/accounts/profile',
} as const;

// Ключи для localStorage
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  IS_AUTHENTICATED: 'isAuthenticated',
} as const;

// Типы ошибок
export const ERROR_TYPES = {
  AUTHENTICATION_EXCEPTION: 'AuthenticationException',
} as const;

// Статусы ошибок
export const ERROR_STATUSES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Типы статусов пользователя
export const USER_STATUSES = {
  NOT_BANNED: 'notBanned',
  BANNED: 'banned',
} as const;