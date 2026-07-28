"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

const SECTIONS = [
  {
    title: "Introduction",
    body: "Welcome to Zotheka. By accessing or using our application, you agree to be bound by these Terms and Conditions and our Privacy Policy.",
  },
  {
    title: "Services Provided",
    body: "Zotheka lets you pay for Spotify Premium packages (Solo, Student, Duo, and Family) using Malawian Kwacha via local mobile money providers (Airtel Money and TNM Mpamba). For Duo and Family packages, Zotheka lets you split the cost with other people and add their Spotify accounts to the plan once each person has paid their share.",
  },
  {
    title: "Account & KYC Registration",
    body: "To use Zotheka's services, you must complete our Know Your Customer (KYC) verification process. You agree to provide accurate, current, and complete information, including a valid phone number and government-issued ID.",
  },
  {
    title: "Splitting a Package",
    body: "If you start a Duo or Family package and choose to split it, you agree that the cost will be divided among the number of people you select. Each peer you invite is responsible for paying their own share and submitting a valid Spotify account email before they can be added to the plan. Zotheka is not responsible for delays caused by peers who have not yet paid their share.",
  },
  {
    title: "Transactions & Fees",
    body: "Package prices are set in Malawian Kwacha and are subject to change without notice. A minimum transaction amount may apply. Standard processing fees charged by your mobile money network are independent of Zotheka.",
  },
  {
    title: "User Conduct",
    body: "You agree not to use the service for any unlawful activities, money laundering, or fraud, and not to submit a Spotify account email that does not belong to you. We reserve the right to suspend or terminate accounts suspected of violating these terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-4">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background px-4 py-4">
        <Link
          href="/app/account"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-5 w-5 text-brand-black" />
        </Link>
        <h1 className="text-xl font-extrabold text-brand-black">Terms & Conditions</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-muted">
            The rules for using Zotheka to pay for and split Spotify, in six short sections.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 text-sm text-brand-black/80">
          <div className="divide-y divide-border">
            {SECTIONS.map((section, i) => (
              <section key={section.title} className={i === 0 ? "pb-6" : "py-6"}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-[11px] font-extrabold text-brand-green">
                    {i + 1}
                  </span>
                  <h2 className="text-base font-bold text-brand-black">{section.title}</h2>
                </div>
                <p className="leading-relaxed text-muted pl-8">{section.body}</p>
              </section>
            ))}
          </div>

          <p className="pt-6 mt-6 border-t border-border text-xs font-semibold text-muted">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}