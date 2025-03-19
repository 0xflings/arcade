import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "../components/NavbarWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARCADE - Create Games with AI",
  description: "Create and share AI-generated arcade games in seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}>
        <NavbarWrapper />
        <div className="min-h-screen">
          {children}
        </div>
        <footer className="py-6 px-4 bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} ARCADE Platform. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
