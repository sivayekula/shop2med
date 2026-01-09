import { VALIDATION } from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate login form
 */
export const validateLogin = (email: string, password: string): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email format';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate registration form
 */
export const validateRegister = (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name) {
    errors.name = 'Name is required';
  } else if (data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
  }

  if (!data.phone) {
    errors.phone = 'Phone number is required';
  } else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, ''))) {
    errors.phone = 'Invalid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate product form
 */
export const validateProduct = (data: {
  name: string;
  category: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  expiryDate: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name) errors.name = 'Product name is required';
  if (!data.category) errors.category = 'Category is required';
  
  if (!data.mrp || data.mrp <= 0) {
    errors.mrp = 'MRP must be greater than 0';
  }
  
  if (!data.sellingPrice || data.sellingPrice <= 0) {
    errors.sellingPrice = 'Selling price must be greater than 0';
  } else if (data.sellingPrice > data.mrp) {
    errors.sellingPrice = 'Selling price cannot exceed MRP';
  }
  
  if (data.stock < 0) {
    errors.stock = 'Stock cannot be negative';
  }
  
  if (!data.expiryDate) {
    errors.expiryDate = 'Expiry date is required';
  } else if (new Date(data.expiryDate) <= new Date()) {
    errors.expiryDate = 'Expiry date must be in the future';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate order form
 */
export const validateOrder = (data: {
  customerName: string;
  customerPhone: string;
  items: any[];
  paymentMethod: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.customerName) {
    errors.customerName = 'Customer name is required';
  }

  if (!data.customerPhone) {
    errors.customerPhone = 'Phone number is required';
  } else if (!/^[6-9]\d{9}$/.test(data.customerPhone.replace(/\D/g, ''))) {
    errors.customerPhone = 'Invalid phone number';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one item is required';
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = 'Payment method is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};