import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZoomHub 60 | Account Management",
  description: "Centralized dashboard for managing authorized Zoom account connections.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
