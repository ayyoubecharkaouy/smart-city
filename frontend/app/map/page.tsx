"use client";

import { Loader } from "lucide-react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center animate-pulse">
        <Loader className="w-5 h-5 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-gray-800">
          Carte Smart City
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Initialisation du moteur Leaflet…
        </p>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <main className="flex-1 h-screen relative overflow-hidden">
      <Map />
    </main>
  );
}
