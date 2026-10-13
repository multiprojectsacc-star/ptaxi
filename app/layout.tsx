import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Personal Taxi — Twój transfer z i na Kraków Airport",
  description: "Prywatny transfer z i na lotnisko Kraków Balice. Wybierz trasę i samochód, poznaj cenę i zarezerwuj przejazd online. Personal Taxi.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pl"><body>{children}</body></html>;
}
