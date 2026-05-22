"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-gray-50">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
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
