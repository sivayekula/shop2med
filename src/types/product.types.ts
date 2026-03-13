export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  batchNumber: string;
  expiryDate: string;
  barcode?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  batchNumber: string;
  expiryDate: string;
  barcode?: string;
  sku?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ProductFilters {
  category?: string;
  status?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  search?: string;
  sortBy?: 'name' | 'price' | 'stock' | 'expiry';
  sortOrder?: 'asc' | 'desc';
}
