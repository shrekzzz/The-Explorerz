import { ClerkProvider, SignedIn, SignedOut, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { ReactNode } from 'react';

// ─── Clerk Provider Wrapper ─────────────

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
}

// ─── Custom Hook for Auth ───────────────

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useClerkAuth();

  return {
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: (user.publicMetadata?.role as string) || 'USER',
      avatarUrl: user.imageUrl || null,
      isEmailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
      phone: user.primaryPhoneNumber?.phoneNumber,
      createdAt: user.createdAt?.toISOString(),
    } : null,
    isAuthenticated: !!user,
    isLoading: !isLoaded,
    getToken, // Use this to get JWT for API calls
    logout: signOut,
    // Clerk handles login/register via UI components
  };
}

// ─── Export Clerk Components ────────────

export { SignedIn, SignedOut, useUser, useClerkAuth };

export default { AuthProvider, useAuth };
