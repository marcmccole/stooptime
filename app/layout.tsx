import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Stoop — Meet your neighbors",
  description: "Host a block party and meet the people on your street.",
  openGraph: {
    title: "Stoop — Meet your neighbors",
    description: "Host a block party and meet the people on your street.",
    url: "https://stooptime.com",
    siteName: "Stoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stoop — Meet your neighbors",
    description: "Host a block party and meet the people on your street.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
