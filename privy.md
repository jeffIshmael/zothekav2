"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { isPrivyConfigured } from "@/lib/privy-config";

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { login, ready } = usePrivy();

  const goToApp = () => router.replace("/app");

  useEffect(() => {
    if (isAuthenticated) {
      goToApp();
    }
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative flex-[0.54] shrink-0 overflow-hidden bg-brand-green px-6 pb-8 pt-10 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 opacity-20">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-20 w-1.5 origin-bottom rounded-full bg-white"
              style={{ transform: `rotate(${(i - 6.5) * 9}deg)` }}
            />
          ))}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-2xl font-extrabold">
            Z
          </div>
        </div>

        <div className="relative mt-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Zotheka</h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-white/90">
            Netflix, Spotify &amp; more, paid with your mobile money.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Netflix", "Spotify", "Google Play"].map((brand) => (
              <span
                key={brand}
                className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-semibold"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-9 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[36px] bg-surface">
        <div className="flex flex-1 flex-col px-6 pt-8 pb-6">
          <h2 className="text-xl font-extrabold">Create your account</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Sign up in seconds. Track purchases and withdraw USD to MWK anytime.
          </p>

          {!isPrivyConfigured ? (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Add your Privy keys to <code className="font-mono">.env</code> to enable sign-in.
              Use a <strong>Web</strong> client ID from the Privy dashboard.
            </div>
          ) : null}

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={login}
              disabled={!isPrivyConfigured || !ready}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-[16px] font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              Get Started
            </button>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { MOBILE_MAX_WIDTH, MobileShell } from "@/components/app/MobileShell";
import { PrivyProvider } from "@/components/providers/PrivyProvider";
import { AuthProvider, useAuth } from "@/lib/auth";

import { AppDataProvider, useAppData } from "@/lib/app-data";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: HomeIcon },
  { href: "/app/manual-service", label: "Manually", icon: GavelIcon },
  { href: "/app/purchases", label: "My purchases", icon: BagIcon },
  { href: "/app/history", label: "History", icon: ClockIcon },
  { href: "/app/account", label: "Account", icon: UserIcon },
];

function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { kycVerified, pendingPurchasesCount } = useAppData();

  const isSignIn = pathname === "/app/sign-in";
  const isKyc = pathname === "/app/kyc";
  const isAbout = pathname === "/app/about";
  const isTerms = pathname === "/app/terms";
  const isPrivacy = pathname === "/app/privacy";
  const showNav = !isSignIn && !isKyc && !isAbout && !isTerms && !isPrivacy;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isSignIn) {
      router.replace("/app/sign-in");
    }
  }, [isAuthenticated, isLoading, isSignIn, router]);

  if (isLoading) {
    return (
      <MobileShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      </MobileShell>
    );
  }

  if (!isAuthenticated && !isSignIn) {
    return null;
  }

  return (
    <MobileShell>
      <div className="relative flex min-h-screen flex-col">
        <main className={`flex-1 ${showNav ? "pb-24" : ""}`}>{children}</main>

        {showNav && (
          <nav
            className="fixed bottom-0 left-1/2 z-40 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)]"
            style={{ width: "100%", maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
          >
            <div className="flex">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/app" ? pathname === "/app" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${
                      active ? "text-brand-green" : "text-muted"
                    }`}
                  >
                    <Icon 
                      active={active} 
                      showBadge={href === "/app/account" && kycVerified === false} 
                      badgeCount={href === "/app/purchases" ? pendingPurchasesCount : undefined}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </MobileShell>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider>
      <AuthProvider>
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      </AuthProvider>
    </PrivyProvider>
  );
}

function HomeIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );
}

function BagIcon({ active, badgeCount }: { active: boolean; showBadge?: boolean; badgeCount?: number }) {
  return (
    <div className="relative">
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M6 7h12l-1 14H7L6 7z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </svg>
      {!!badgeCount && badgeCount > 0 && (
        <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm border border-surface">
          {badgeCount}
        </span>
      )}
    </div>
  );
}

function ClockIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function UserIcon({ active, showBadge }: { active: boolean; showBadge?: boolean }) {
  return (
    <div className="relative">
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      {showBadge && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-yellow border border-surface" />
      )}
    </div>
  );
}

function PlusIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function GavelIcon({ active }: { active: boolean; showBadge?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  );
}


"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { ReactNode } from "react";
import { base } from "viem/chains";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "@/lib/privy-config";

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <BasePrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        defaultChain: base,
        supportedChains: [base],
        loginMethods: ["email", "google"],
        appearance: {
          theme: "light",
          accentColor: "#007A33",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <SmartWalletsProvider>
        {children}
      </SmartWalletsProvider>
    </BasePrivyProvider>
  );
}

