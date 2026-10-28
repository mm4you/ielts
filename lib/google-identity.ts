export function googleIdentityAllowed(profile: { email?: string; email_verified?: boolean; sub?: string }, subject: string, currentEmail?: string | null) {
  return profile.email_verified === true && !!profile.email && profile.sub === subject && (!currentEmail || currentEmail.toLowerCase() === profile.email.toLowerCase());
}
export function canRecoverGoogleOrphan(email: string, user: { password: string | null; role: string; accounts: unknown[]; _count: { progress: number; collections: number } }) {
  return email.endsWith('@gmail.com') && !user.password && user.role === 'user' && user.accounts.length === 0 && user._count.progress === 0 && user._count.collections === 0;
}
