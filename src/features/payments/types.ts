// Оплата обучения (/payment/operations/*).

export type PaymentNext = {
  amount: number | null; // amount_next
  date: string | null; // pay_date_start
  purpose: string | null; // purpose_of_payment («За 3 Год»)
  payerName: string | null;
  debt: number | null; // amount_debt
};

export type PaymentScheduleItem = {
  id: number;
  description: string;
  price: number;
  date: string; // payment_date
  status: number; // семантика не подтверждена (в HAR только 0)
};

export type PaymentHistoryItem = {
  date: string;
  amount: number;
  description: string;
};

export type PaymentsData = {
  next: PaymentNext | null;
  schedule: PaymentScheduleItem[];
  history: PaymentHistoryItem[];
};

// «158 015 ₽» — без Intl, чтобы не зависеть от ICU на устройстве.
export function formatRub(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.abs(Math.round(amount)));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped} ₽`;
}
