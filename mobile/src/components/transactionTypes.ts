export type TransactionRow = {
  id: number;
  type: 'buy' | 'sell';
  amount_brl: string;
  amount_btc: string;
  btc_price: string;
  executed_at: string;
};
