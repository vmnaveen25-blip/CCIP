/**
 * Centralized Indian Localization Formatters for CCIP (Astraea Enclave)
 */

/**
 * Format numerical amounts in Indian Rupee (INR / ₹) with standard Indian numbering system (lakhs, crores).
 * Example: 185000 -> ₹1,85,000, 10000000 -> ₹1,00,00,000
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format numbers using Indian numbering system (e.g. 1,00,000).
 */
export function formatIndianNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Validates whether a given string is a valid Indian mobile number.
 * Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9 (optionally prefixed with +91 or 91 or 0).
 */
export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)\.]/g, '');
  // +91XXXXXXXXXX or 91XXXXXXXXXX or 0XXXXXXXXXX or XXXXXXXXXX
  const regex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return regex.test(clean);
}

/**
 * Normalizes Indian mobile number to E.164 format: +91XXXXXXXXXX
 */
export function normalizeIndianPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return `+91${digits.slice(1)}`;
  }
  return phone.trim();
}

/**
 * Format Indian mobile number for display: +91 98765 43210
 */
export function formatIndianPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    const raw = clean.slice(2);
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  }
  return phone;
}

/**
 * Format dates in Indian format (DD/MM/YYYY or readable date) in IST timezone.
 */
export function formatIndianDate(
  dateInput: string | Date | null | undefined,
  includeTime: boolean = false
): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }
        : {})
    };

    const formatted = new Intl.DateTimeFormat('en-IN', options).format(date);
    return includeTime ? `${formatted} IST` : formatted;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format Indian PIN Code (6 digits)
 */
export function isValidPinCode(pin: string): boolean {
  if (!pin) return false;
  const clean = pin.trim();
  return /^[1-9][0-9]{5}$/.test(clean);
}
