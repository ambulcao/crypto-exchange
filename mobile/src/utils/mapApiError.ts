import axios from 'axios';

export function mapApiError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const message =
    (error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined)?.message ??
    Object.values(
      (error.response?.data as { errors?: Record<string, string[]> } | undefined)?.errors ?? {}
    )[0]?.[0];

  return message ?? fallback;
}
