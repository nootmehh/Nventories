import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import AppWrapper from "@/components/AppWrapper";

const mplusrounded1c = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saleskuy! Inventory Management",
  description: "Inventory Management System for Saleskuy!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${mplusrounded1c.className} antialiased bg-white-2`}
        suppressHydrationWarning={true}
      ><UserProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
