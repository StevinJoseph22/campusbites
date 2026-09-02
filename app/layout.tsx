import type { Metadata } from "next";
import { Fraunces, Nunito, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CampusBites",
  description: "Order from multiple canteen vendors in one combined cart and skip lunch lines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${nunito.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem("campusbites_theme");
              if (t === "dark" || t === "light") {
                document.documentElement.setAttribute("data-theme", t);
              }
            } catch (e) {}`
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
