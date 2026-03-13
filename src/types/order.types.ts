export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  paymentStatus: 'pending' | 'completed' | 'failed';
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  batchNumber?: string;
}

export interface OrderFormData {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItemInput[];
  discount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  notes?: string;
}

export interface OrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}