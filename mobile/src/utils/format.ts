import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

const btcFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

export function formatBrl(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) {
    return String(value);
  }
  return brlFormatter.format(n);
}

export function formatBtc(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) {
    return String(value);
  }
  return `${btcFormatter.format(n)} BTC`;
}

export function formatBtcPrice(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) {
    return String(value);
  }
  return brlFormatter.format(n);
}

export function formatTransactionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}
