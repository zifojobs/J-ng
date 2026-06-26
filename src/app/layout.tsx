import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jang-theta.vercel.app"),
  title: "Jàng — La plateforme scolaire des écoles du Sénégal",
  description:
    "Notes, bulletins, emploi du temps, devoirs, absences et messagerie : toute la vie scolaire de votre établissement, accessible sur mobile.",
  applicationName: "Jàng",
  openGraph: {
    title: "Jàng — La plateforme scolaire",
    description:
      "Toute la vie scolaire de votre établissement, sur mobile : notes, bulletins, emploi du temps, devoirs, absences, messagerie.",
    url: "https://jang-theta.vercel.app",
    siteName: "Jàng",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jàng — La plateforme scolaire",
    description: "Toute la vie scolaire de votre établissement, sur mobile.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
