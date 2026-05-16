export enum TransactionType {
  IN = 'in',
  OUT = 'out',
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  category: string;
  userId: string;
  updatedAt: any;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  userId: string;
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  totalAmount: number;
  items: TransactionItem[];
  customerId?: string;
  userId: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'staff';
}
