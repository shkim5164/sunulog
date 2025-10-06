import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "나만의 블로그",
  description: "전자책처럼 읽는 블로그",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Navbar />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
