"use client";

import { Loader } from "lucide-react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse">
        <Loader className="mx-auto mb-3 h-6 w-6 animate-spin text-green-600" />
        <h2 className="text-xl font-bold text-slate-800">
          Smart City Map
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Initializing Leaflet engine…
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
