import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { auth } from "@/auth";


export const metadata: Metadata = {
  title: "IELTS Vocab - Học từ vựng IELTS",
  description: "Ứng dụng học từ vựng IELTS với hệ thống ôn tập thông minh",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vocab",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f6cbd",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
