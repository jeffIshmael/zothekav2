"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LayoutGrid, Users, Link2, Music2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-4">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background px-4 py-4">
        <Link
          href="/app/account"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ArrowLeft className="h-5 w-5 text-brand-black" />
        </Link>
        <h1 className="text-xl font-extrabold text-brand-black">About Zotheka</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-surface p-6 text-sm text-brand-black/80">

          {/* Logo */}
          <div className="flex justify-center pb-6 border-b border-border">
            <div className="flex h-20 w-20 items-center justify-center rounded-md">
              <Image
                src="/images/icon.png"
                alt="Zotheka Logo"
                width={56}
                height={56}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Mission */}
          <section className="pt-6">
            <h2 className="mb-3 text-lg font-bold text-brand-black">Spotify, split fairly</h2>
            <p className="leading-relaxed text-muted">
              At Zotheka, our mission is simple: help Malawians pay for Spotify Premium using the
              mobile money they already have, and make splitting a Duo or Family plan with other
              people effortless.
            </p>
          </section>

          {/* Features */}
          <section className="mt-6 pt-6 border-t border-border">
            <p className="mb-5 text-xs font-bold uppercase tracking-wider text-muted">
              With your Zotheka account, you can
            </p>

            <div className="divide-y divide-border">
              <div className="flex gap-3 pb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1">Choose Your Package</h3>
                  <p className="leading-relaxed text-muted">
                    Pick Solo, Student, Duo, or Family. Duo and Family plans can be paid in full
                    by you, or split with peers.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1">Split the Cost Automatically</h3>
                  <p className="leading-relaxed text-muted">
                    Choose how many people are sharing a Duo or Family package and Zotheka divides
                    the cost for you. Pay your own share via mobile money — nothing more.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1">Share a Link With Your Peers</h3>
                  <p className="leading-relaxed text-muted">
                    Once you've paid your share, get a link to send to the rest of your group.
                    Each peer opens it, pays their own part, and joins the same plan.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <Music2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-black mb-1">Get Added to the Plan</h3>
                  <p className="leading-relaxed text-muted">
                    After paying their share, each peer submits their own Spotify account email.
                    Zotheka adds it to the plan — everyone keeps their own account, streaming
                    under one shared package.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 pt-6 text-center border-t border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}