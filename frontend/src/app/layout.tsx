import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { ClientCopyright } from "@/components/client-copyright";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriChain - Blockchain for Agriculture",
  description: "A blockchain application for agricultural supply chain management",
};

export default function RootLayout({
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
            <Navigation />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="py-6 border-t border-[#a259ff]/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mt-4 text-center relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent opacity-40 blur-sm"></div>
                  
                  <p className="text-sm text-[#a259ff]">
                    &copy; <ClientCopyright /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff]">AgriChain</span>. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
