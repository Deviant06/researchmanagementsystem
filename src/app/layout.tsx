import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} | Research Management System`,
  description:
    "Role-based research management system for senior high school teachers and students."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
