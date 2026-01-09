
/**
 * Format number as Indian Rupee currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number as Indian Rupee without symbol
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  const hours12 = d.getHours() % 12 || 12;

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY hh:mm A':
      return `${day}/${month}/${year} ${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date);
};

/**
 * Calculate days until expiry
 */
export const getDaysUntilExpiry = (expiryDate: string | Date): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if product is expiring soon (within 30 days)
 */
export const isExpiringSoon = (expiryDate: string | Date): boolean => {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
};

/**
 * Check if product is expired
 */
export const isExpired = (expiryDate: string | Date): boolean => {
  return getDaysUntilExpiry(expiryDate) <= 0;
};

/**
 * Format stock status
 */
export const getStockStatus = (stock: number, minStock: number = 10): string => {
  if (stock === 0) return 'Out of Stock';
  if (stock <= minStock) return 'Low Stock';
  return 'In Stock';
};

/**
 * Get stock status color
 */
export const getStockStatusColor = (stock: number, minStock: number = 10): string => {
  if (stock === 0) return '#F44336'; // Red
  if (stock <= minStock) return '#FF9800'; // Orange
  return '#4CAF50'; // Green
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format large numbers (e.g., 1000 -> 1K)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (mrp: number, sellingPrice: number): number => {
  if (mrp === 0) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

/**
 * Format order number
 */
export const formatOrderNumber = (id: string | number): string => {
  return `ORD${String(id).padStart(6, '0')}`;
};

/**
 * Calculate GST
 */
export const calculateGST = (amount: number, rate: number = 18): number => {
  return (amount * rate) / 100;
};

/**
 * Calculate total with GST
 */
export const calculateTotalWithGST = (amount: number, rate: number = 18): number => {
  const gst = calculateGST(amount, rate);
  return amount + gst;
};