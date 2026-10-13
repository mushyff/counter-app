import type { Metadata, Viewport } from "next";
import { Bebas_Neue, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const body = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COUNTER",
  description: "Never take the first number again.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-h-dvh flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
