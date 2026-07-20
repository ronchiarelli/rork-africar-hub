-- New middle tier between 'pending' and full 'approved': at least one
-- identity document (Ghana Card or Passport) has been verified by an admin,
-- so the renter can be trusted enough to book, even though driver's
-- license/selfie are still outstanding. Split into its own migration since
-- a freshly-added enum value can't be referenced by other statements in the
-- same transaction as the ALTER TYPE.
alter type public.verification_status add value if not exists 'restricted' after 'pending';
