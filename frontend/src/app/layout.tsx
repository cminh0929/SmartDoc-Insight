"use client"

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/context/auth-context";
import { usePathname } from "next/navigation";
import AiAssistantPanel from "@/components/ai/AiAssistantPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-sans bg-background text-foreground`}
      >
        <AuthProvider>
          {isAuthPage ? (
            children
          ) : (
            <div className="flex h-full overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                  {children}
                </main>
              </div>
              <AiAssistantPanel />
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
