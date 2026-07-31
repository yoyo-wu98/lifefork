import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
