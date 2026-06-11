import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type {
  PaymentHistoryItem,
  PaymentNext,
  PaymentScheduleItem,
  PaymentsData,
} from './types';

type RawPaymentIndex = {
  payment: {
    amount_next: number | null;
    pay_date_start: string | null;
    purpose_of_payment: string | null;
    payer_full_name: string | null;
    amount_debt: number | null;
  } | null;
};

type RawScheduleItem = {
  id: number;
  description: string;
  price: number;
  payment_date: string;
  status: number;
};

type RawHistoryItem = {
  date: string;
  amount: number;
  description: string;
};

function toNext(raw: RawPaymentIndex): PaymentNext | null {
  const p = raw.payment;
  if (!p) return null;
  return {
    amount: p.amount_next,
    date: p.pay_date_start,
    purpose: p.purpose_of_payment,
    payerName: p.payer_full_name,
    debt: p.amount_debt,
  };
}

// Три запроса параллельно: следующий платёж, график, история.
export async function fetchPayments(): Promise<PaymentsData> {
  const [index, schedule, history] = await Promise.all([
    apiRequest<RawPaymentIndex>(endpoints.payment.index),
    apiRequest<RawScheduleItem[]>(endpoints.payment.schedule),
    apiRequest<RawHistoryItem[]>(endpoints.payment.history),
  ]);

  const scheduleItems: PaymentScheduleItem[] = schedule.map((r) => ({
    id: r.id,
    description: r.description,
    price: r.price,
    date: r.payment_date,
    status: r.status,
  }));
  const historyItems: PaymentHistoryItem[] = history
    .map((r) => ({ date: r.date, amount: r.amount, description: r.description }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return { next: toNext(index), schedule: scheduleItems, history: historyItems };
}
