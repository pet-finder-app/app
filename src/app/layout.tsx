import { NavigationProgress } from "@/components/navigation-progress";
import { SplashGate } from "@/components/splash-gate";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Modak } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Fonte da marca "PETFINDER." — só tem o peso 400, ver `font-brand` em globals.css. */
const modak = Modak({
  weight: "400",
  variable: "--font-modak",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Petfinder",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${modak.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SplashGate>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </SplashGate>
      </body>
    </html>
  );
}
