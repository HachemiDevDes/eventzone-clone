import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata = {
  title: "Eventzone | Premium Event Platform",
  description: "A premium event organizer platform to design floor layouts and manage schedules.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.className} ${cairo.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
