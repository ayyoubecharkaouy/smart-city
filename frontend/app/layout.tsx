import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart City — El Jadida | IoT Dashboard",
  description:
    "Interactive Smart City dashboard for El Jadida: IoT sensors, energy, water, mobility, air quality, and real-time urban data.",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-black text-white">
        <div className="flex h-full flex-col lg:flex-row">
          <Sidebar />
          <div className="min-w-0 flex-1 flex flex-col overflow-auto h-full bg-black pb-16 text-slate-100 lg:pb-0">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
