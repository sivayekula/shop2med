export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff';
  storeId?: string;
  storeName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  settings: UserSettings;
  businessInfo: BusinessInfo;
}

export interface UserSettings {
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    lowStock: boolean;
    expiryAlerts: boolean;
  };
  preferences: {
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  security: {
    twoFactorAuth: boolean;
    biometricLogin: boolean;
  };
}

export interface BusinessInfo {
  storeName: string;
  gstNumber: string;
  licenseNumber: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  todayOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface ReportData {
  period: string;
  sales: SalesData[];
  topProducts: TopProduct[];
  revenue: RevenueData;
  inventory: InventoryData;
}

export interface SalesData {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  id: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface RevenueData {
  total: number;
  cash: number;
  card: number;
  upi: number;
  credit: number;
}

export interface InventoryData {
  totalProducts: number;
  lowStockItems: number;
  expiredItems: number;
  expiringItems: number;
}
