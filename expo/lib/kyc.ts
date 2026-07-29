import type { UserProfile } from '@/types/car';

// Client-side mirror of the server's kyc_cleared() — fully verified, or
// waived by an admin. Kept in one place so the booking and listing gates
// can't drift apart from each other or from the database.
export function isKycCleared(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.verificationStatus === 'approved' || user.kycExempt;
}

// A new/edited listing goes to admin review, and only goes live once the
// owner is also KYC-cleared — so there are two different reasons it might
// not be visible yet and the owner should be told which apply to them.
export function listingResultMessage(kycCleared: boolean, isEditing: boolean): string {
  const base = isEditing
    ? 'Your changes were saved and sent back to an admin for review.'
    : 'Your listing was submitted and is awaiting admin review.';
  return kycCleared
    ? `${base} It goes live once approved.`
    : `${base} It goes live once approved and your identity verification is complete.`;
}
