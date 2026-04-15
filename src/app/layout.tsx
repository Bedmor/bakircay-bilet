import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

export const metadata: Metadata = {
  title: "Bakircay Bilet",
  description: "Bakircay geceleri ve etkinlikleri icin bilet platformu",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${geist.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
