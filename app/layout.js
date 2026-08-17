import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata = {
  title: "Eventzone | Premium Event Platform",
  description: "A premium event organizer platform to design floor layouts and manage schedules.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.className}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister().then(function(unregistered) {
                      if (unregistered) {
                        console.log('Service worker unregistered successfully.');
                        window.location.reload();
                      }
                    });
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
