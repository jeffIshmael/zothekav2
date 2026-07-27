import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const GA_MEASUREMENT_ID = "G-7HZMM7K4JZ";

export const metadata: Metadata = {
  title: "ZothekaV2 | Share Spotify in MWK",
  description:
    "Share Spotify accounts with friends and family using Malawian Kwacha.",
  openGraph: {
    title: "ZothekaV2 | Share Spotify in MWK",
    description: "Share Spotify accounts with friends and family using Malawian Kwacha.",
    type: "website",
  },
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  );
}
