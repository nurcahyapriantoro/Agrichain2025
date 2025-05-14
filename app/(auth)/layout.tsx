import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriChain - Authentication",
  description: "Login or register for the AgriChain blockchain platform",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-[#18122B] to-[#0f1722] min-h-screen`}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              {children}
            </div>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
} 