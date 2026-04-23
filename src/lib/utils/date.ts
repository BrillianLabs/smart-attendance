import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

// Ambil timezone dari environment variable, default ke Asia/Jakarta (WIB)
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Jakarta';

/**
 * Memformat tanggal secara eksplisit sesuai timezone aplikasi untuk memastikan
 * konsistensi antara rendering Server dan Client.
 * @param date String tanggal (ISO) atau objek Date
 * @param formatStr String format date-fns
 * @returns String tanggal yang sudah diformat
 */
export function formatInTZ(date: string | Date | null | undefined, formatStr: string): string {
  if (!date) return '--:--';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateObj, APP_TIMEZONE, formatStr, { locale: idLocale });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '--:--';
  }
}

// Alias untuk kompatibilitas dengan kode yang sudah ada
export const formatWIB = formatInTZ;

/**
 * Mendapatkan singkatan timezone (WIB, WITA, WIT) berdasarkan offset
 */
export function getTimezoneAbbreviation(): string {
  switch (APP_TIMEZONE) {
    case 'Asia/Jakarta':
    case 'Asia/Pontianak':
      return 'WIB';
    case 'Asia/Makassar':
    case 'Asia/Denpasar':
      return 'WITA';
    case 'Asia/Jayapura':
      return 'WIT';
    default:
      return 'WIB';
  }
}
