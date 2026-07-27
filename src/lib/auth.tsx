"use client";

import { usePrivy } from "@privy-io/react-auth";

export function useAuth() {
  const { ready, authenticated, user, logout } = usePrivy();
  return {
    email: user?.email?.address || user?.google?.email,
    isAuthenticated: ready && authenticated,
    isLoading: !ready,
    signOut: logout
  };
}
