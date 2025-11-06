export interface PaymentAccount {
  id: number;
  name: string;
}

export interface Payment {
  id: number;
  pricing_id: number;
  amount: number;
  mode: string | null;
  reference: string | null;
  status: 'pending' | 'success' | 'failed';
  transaction_type: 'purchase' | 'sale';
  transaction_date: string;
  transaction_date_formatted: string;
  notes: string | null;
  debit_credit: 'debit' | 'credit';
  beneficiary_name: string | null;
  beneficiary_phone: string | null;
  beneficiary_account: string | null;
  payee_id: number | null;
  bank_id: number | null;
  paid_through_account: PaymentAccount | null;
}

export interface AdvancePaymentRequest {
  transaction_date: string;
  amount: number;
  bank_id: number;
  beneficiary_name: string;
  beneficiary_phone: string;
  reference: string;
  is_advance: boolean;
  notes: string;
}
