import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

// Mêmes polices que la page vitrine : Inter pour le texte, Plus Jakarta Sans
// pour les titres. Ainsi toute l'app partage la typographie de la landing.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.jang.sn"),
  title: "Jàng — La plateforme scolaire des écoles du Sénégal",
  description:
    "Notes, bulletins, emploi du temps, devoirs, absences et messagerie : toute la vie scolaire de votre établissement, accessible sur mobile.",
  applicationName: "Jàng",
  openGraph: {
    title: "Jàng — La plateforme scolaire",
    description:
      "Toute la vie scolaire de votre établissement, sur mobile : notes, bulletins, emploi du temps, devoirs, absences, messagerie.",
    url: "https://www.jang.sn",
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
      className={`${inter.variable} ${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
