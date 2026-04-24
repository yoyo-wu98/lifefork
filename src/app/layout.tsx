import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeFork / 人生岔路",
  description: "与那些你尚未选择的人生交谈。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
