import type { Metadata } from "next";
import { Sora } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Aïcha — Blue Soft VoiceDesk",
    template: "%s | Blue Soft VoiceDesk",
  },
  description:
    "Parlez naturellement à Aïcha, l’assistante vocale de Blue Soft. " +
    "Une conversation fluide en français ou en anglais.",
  applicationName: "Blue Soft VoiceDesk",
  openGraph: {
    title: "Aïcha — Blue Soft VoiceDesk",
    description:
      "Découvrez une nouvelle façon de dialoguer avec Blue Soft, en français et en anglais.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
