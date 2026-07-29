import type { UserProfile } from '@/types/car';

// Client-side mirror of the server's kyc_cleared() — fully verified, or
// waived by an admin. Kept in one place so the booking and listing gates
// can't drift apart from each other or from the database.
export function isKycCleared(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.verificationStatus === 'approved' || user.kycExempt;
}
