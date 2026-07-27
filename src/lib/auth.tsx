"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    email: session?.user?.email,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signOut: async () => {
        // Handle next-auth signOut if necessary
    }
  };
}
