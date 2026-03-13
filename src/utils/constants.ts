export const API_BASE_URL = 'https://your-api-url.com/api';

export const COLORS = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  accent: '#FF9800',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
};

export const PRODUCT_CATEGORIES = [
  'Tablets',
  'Capsules',
  'Syrups',
  'Injections',
  'Ointments',
  'Drops',
  'Inhalers',
  'Supplements',
  'First Aid',
  'Medical Devices',
  'Personal Care',
  'Baby Care',
  'Other',
];

export const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Credit', value: 'credit' },
];

export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY hh:mm A',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
};

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PHONE_LENGTH: 10,
  MIN_STOCK: 0,
  MIN_PRICE: 0,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};