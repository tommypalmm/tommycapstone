import type { Metadata, Viewport } from "next";
import { APP_NAME } from "@/lib/format";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Booking, reminders, and rebooking for independent dog trainers and groomers.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
