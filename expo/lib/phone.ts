// Ghana phone normalisation. Users type their number every which way —
// "024 123 4567", "+233 24 123 4567", "233241234567" — but it has to
// resolve to ONE canonical string, because that string is now a login
// identifier. Anything ambiguous is rejected rather than guessed at.
//
// Canonical form is E.164 without the '+': 233XXXXXXXXX (12 digits).

const GH_COUNTRY_CODE = '233';
// Ghana mobile subscriber numbers are 9 digits after the country code,
// and the national (0-prefixed) form is 10 digits.
const NATIONAL_LEN = 10;
const SUBSCRIBER_LEN = 9;

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;

  // 233XXXXXXXXX — already international
  if (digits.startsWith(GH_COUNTRY_CODE) && digits.length === GH_COUNTRY_CODE.length + SUBSCRIBER_LEN) {
    return digits;
  }
  // 0XXXXXXXXX — national form, drop the trunk 0
  if (digits.startsWith('0') && digits.length === NATIONAL_LEN) {
    return GH_COUNTRY_CODE + digits.slice(1);
  }
  // XXXXXXXXX — bare subscriber number
  if (digits.length === SUBSCRIBER_LEN) {
    return GH_COUNTRY_CODE + digits;
  }
  return null;
}

// Display form: +233 24 123 4567
export function formatPhone(canonical: string): string {
  if (!canonical.startsWith(GH_COUNTRY_CODE) || canonical.length !== 12) return canonical;
  const s = canonical.slice(GH_COUNTRY_CODE.length);
  return `+${GH_COUNTRY_CODE} ${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5)}`;
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

// Rejects PINs that are trivially guessable. A 6-digit PIN is only
// 1,000,000 combinations to begin with; letting people pick 000000 or
// 123456 collapses that to the handful an attacker tries first.
export function pinWeakness(pin: string): string | null {
  if (!isValidPin(pin)) return 'Your PIN must be exactly 6 digits.';
  if (/^(\d)\1{5}$/.test(pin)) return 'Please avoid a PIN that repeats one digit.';
  const asc = '01234567890';
  const desc = '09876543210';
  if (asc.includes(pin) || desc.includes(pin)) return 'Please avoid a sequential PIN like 123456.';
  return null;
}
