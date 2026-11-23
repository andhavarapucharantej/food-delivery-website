import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { CartProvider } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tastevio | Fastest Food Delivery Near You",
  description: "Order biryani, pizza, north Indian and south Indian meals from top restaurants with live tracking on Tastevio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#FAF9F6] text-[#1C1C1C] antialiased flex flex-col`}>
        <ToastProvider>
          <LocationProvider>
            <CartProvider>
              <Navbar />
              <div className="flex-1 pb-16 sm:pb-0">{children}</div>
              <CartDrawer />
            </CartProvider>
          </LocationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
