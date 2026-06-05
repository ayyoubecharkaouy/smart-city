import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart City — El Jadida | Tableau de bord IoT",
  description:
    "Tableau de bord interactif Smart City pour El Jadida : capteurs IoT, énergie, eau, mobilité, qualité de l'air et données urbaines en temps réel.",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full">
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
