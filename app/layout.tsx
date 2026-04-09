import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INSAM FC | 축구 모임 관리",
  description: "인삼 FC 멤버들을 위한 포인트 및 회계 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 💡 진단용 스크립트: 브라우저에서 실행되면 알림창을 띄웁니다 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('Layout rendering...');
              // alert('인삼 FC 시스템 접속 성공!'); 
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}