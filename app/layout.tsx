import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import type { Theme } from "@/lib/theme";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Secure login",
  description: "SouthEast Bank secure login",
};

const theme: Theme = "default";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme={theme}
      className={figtree.variable}
    >
      <body>{children}</body>
    </html>
  );
}
