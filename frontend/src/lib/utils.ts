import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indonesian Rupiah
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted string in Rupiah
 */
export function formatRupiah(amount: number | undefined | null, options: {
  withSymbol?: boolean;
  decimalDigits?: number;
  compact?: boolean;
} = {}): string {
  if (amount === undefined || amount === null) {
    return 'Rp 0';
  }
  
  const {
    withSymbol = true,
    decimalDigits = 0,
    compact = false
  } = options;
  
  try {
    // Format using Intl.NumberFormat
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
      notation: compact ? 'compact' : 'standard',
      compactDisplay: 'short'
    });
    
    let formatted = formatter.format(amount);
    
    // Hapus simbol Rp jika withSymbol = false
    if (!withSymbol) {
      formatted = formatted.replace(/^Rp\s?/, '');
    }
    
    return formatted;
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback format jika ada error
    return withSymbol ? `Rp ${amount.toFixed(decimalDigits)}` : amount.toFixed(decimalDigits);
  }
}
