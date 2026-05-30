"use client";

import { useMemo } from "react";
import { Wifi, WifiOff, TrendingUp } from "lucide-react";
import type { DistrictTemperature } from "@/lib/types";
import TrendChart from "./TrendChart";
import AnimatedNumber from "@/components/AnimatedNumber";

interface AirQualityStatsProps {
  districtStats: Map<string, DistrictTemperature>;
  history: { time: string; aqi: number }[];
  connected: boolean;
  loading: boolean;
  error: string | null;
}

const getAqiLabel = (aqi: number) => {
  if (aqi <= 50) return { label: "Bon", color: "#22c55e" };
  if (aqi <= 100) return { label: "Moyen", color: "#4ade80" };
  if (aqi <= 150) return { label: "Sensible", color: "#16a34a" };
  if (aqi <= 200) return { label: "Mauvais", color: "#15803d" };
  return { label: "Critique", color: "#14532d" };
};

export default function AirQualityStats({
  districtStats,
  history: initialHistory,
  connected,
  loading,
  error,
}: AirQualityStatsProps) {
  const districts = Array.from(districtStats.values());

  const avgAqi =
    districts.length > 0
      ? districts.reduce((s, d) => s + (d.avg_aqi || 0), 0) / districts.length
      : 0;

  const combinedHistory = useMemo(() => {
    const now = new Date();
    const timeline = [];
    
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = d.getHours().toString().padStart(2, "0") + ":00";
      
      const match = initialHistory.find(h => {
        const hDate = new Date(h.time);
        return hDate.getHours() === d.getHours() && hDate.getDate() === d.getDate();
      });

      timeline.push({
        time: i === 0 ? "Direct" : hourStr,
        value: i === 0 ? (avgAqi || (match ? match.aqi : 0)) : (match ? match.aqi : 0),
        isLive: i === 0
      });
    }
    return timeline;
  }, [initialHistory, avgAqi]);

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="border border-gray-200 rounded-4xl p-4/50 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 px-2 mb-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Analyse Qualité Air
        </h3>
        <TrendChart
          data={combinedHistory}
          color="#22c55e"
          label="AQI"
          unit=""
        />
      </div>

      <div className=" border border-gray-200 rounded-4xl p-4/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2 px-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Indices par Quartier
          </h3>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-green-600" />
            )}
          </div>
        </div>

        {loading && (
          <div className="text-xs text-gray-500 text-center py-4">
            Analyse de l&apos;air en cours...
          </div>
        )}

        {!loading && !error && districts.length > 0 && (
          <div className="space-y-2">
            {districts
              .sort((a, b) => a.district.localeCompare(b.district))
              .map((d) => {
                const aqi = d.avg_aqi || 0;
                const { label, color } = getAqiLabel(aqi);
                return (
                  <div
                    key={d.district}
                    className="flex items-center justify-between px-4 py-3/80 rounded-full border-2 border-gray-100 transition-all"
                  >
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {d.district}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-gray-900">
                        <AnimatedNumber value={aqi} />
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{
                          backgroundColor: color + "15",
                          color: color,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
