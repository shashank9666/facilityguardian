import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FMNexus – Facility Management Platform",
  description: "Enterprise Facility Management Platform – Assets, Work Orders, Maintenance, Vendors, Spaces, Incidents, Inventory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
