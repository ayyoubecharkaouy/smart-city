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
  if (aqi <= 50) return { label: "Good", color: "#22c55e" };
  if (aqi <= 100) return { label: "Moderate", color: "#4ade80" };
  if (aqi <= 150) return { label: "Sensitive", color: "#16a34a" };
  if (aqi <= 200) return { label: "Poor", color: "#15803d" };
  return { label: "Critical", color: "#14532d" };
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
    <div className="flex flex-col gap-3 p-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-2 mb-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Air Quality Analysis
        </h3>
        <TrendChart
          data={combinedHistory}
          color="#22c55e"
          label="AQI"
          unit=""
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2 px-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            AQI by District
          </h3>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        {loading && (
          <div className="text-xs text-slate-500 text-center py-4">
            Air analysis in progress...
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
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:border-green-400"
                  >
                    <span className="text-sm font-semibold text-slate-600 truncate">
                      {d.district}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-800">
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
