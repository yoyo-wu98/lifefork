import type { Metadata, Viewport } from "next";
import { APP_METADATA_COPY } from "@/lib/copy";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://lifefork-public-beta.poremansovir.chatgpt.site",
  ),
  title: APP_METADATA_COPY.value.title,
  description: APP_METADATA_COPY.value.description,
  openGraph: {
    type: "website",
    url: "https://lifefork-public-beta.poremansovir.chatgpt.site",
    title: APP_METADATA_COPY.value.title,
    description: APP_METADATA_COPY.value.description,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_METADATA_COPY.value.title,
    description: APP_METADATA_COPY.value.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a2332" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
