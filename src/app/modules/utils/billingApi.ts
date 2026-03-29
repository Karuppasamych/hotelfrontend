import { apiClient, ApiResponse } from './apiClient';

export interface BillRequest {
  customerName: string;
  mobileNumber: string;
  orderType: 'dine-in' | 'parcel';
  tableNumber?: string;
  numberOfPersons?: string;
  orders: { name: string; price: number; quantity: number }[];
  paymentMethod: 'cash' | 'card' | 'upi';
  transactionId?: string;
  amountPaid: number;
}

export interface BillResponse {
  id: number;
  billNumber: string;
  totalAmount: number;
  changeReturned: number;
  message: string;
}

export interface Bill {
  id: number;
  bill_number: string;
  customer_name: string;
  mobile_number: string;
  order_type: string;
  table_number: string | null;
  number_of_persons: string | null;
  subtotal: number;
  service_charge: number;
  cgst: number;
  sgst: number;
  total_amount: number;
  payment_method: string;
  transaction_id: string | null;
  amount_paid: number;
  change_returned: number;
  status: string;
  created_at: string;
  items?: { id: number; item_name: string; quantity: number; unit_price: number; total_price: number }[];
}

export const billingApi = {
  create: (data: BillRequest): Promise<ApiResponse<BillResponse>> => {
    return apiClient.post<BillResponse>('/billing', data);
  },

  getAll: (): Promise<ApiResponse<Bill[]>> => {
    return apiClient.get<Bill[]>('/billing');
  },

  getById: (id: number): Promise<ApiResponse<Bill>> => {
    return apiClient.get<Bill>(`/billing/${id}`);
  },

  getByDate: (date: string): Promise<ApiResponse<Bill[]>> => {
    return apiClient.get<Bill[]>(`/billing/date/${date}`);
  },

  cancelItem: (data: { item_name: string; quantity: number; price: number; reason?: string; table_number?: string; order_type?: string }): Promise<ApiResponse<{ id: number }>> => {
    return apiClient.post('/billing/cancellations', data);
  },

  getCancellations: (): Promise<ApiResponse<any[]>> => {
    return apiClient.get('/billing/cancellations');
  },
};
