import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";
import StyledComponentsRegistry from "./components/StyledComponentsRegistry";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Study Tracker",
  description: "Stay on track for your exams",
  appleWebApp: {
    capable: true,
    title: "Study Tracker",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  // Stops iOS from zooming in when you tap a small input (pinch-zoom still works on iOS)
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#09090b] min-h-screen`}>
        <StyledComponentsRegistry>
          <Providers>{children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
