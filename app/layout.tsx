import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventShare SENATI",
  description: "Comparte tus mejores momentos de la inauguración de la nueva sede de SENATI.",
};

export const viewport: Viewport = { themeColor: "#0b4fb8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
