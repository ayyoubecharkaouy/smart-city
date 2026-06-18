"use client";

import { AlertTriangle, Wifi, WifiOff, TrendingUp } from "lucide-react";
import type { DistrictTemperature } from "@/lib/types";
import { getTemperatureLevel, getTemperatureLevelColor } from "@/lib/types";
import TrendChart from "./TrendChart";
import { useMemo } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";

interface TemperatureStatsProps {
  districtStats: Map<string, DistrictTemperature>;
  history: { time: string; temperature: number }[];
  connected: boolean;
  loading: boolean;
  error: string | null;
}

export default function TemperatureStats({
  districtStats,
  history: initialHistory,
  connected,
  loading,
  error,
}: TemperatureStatsProps) {
  const districts = Array.from(districtStats.values());

  const avgTemp =
    districts.length > 0
      ? districts.reduce((s, d) => s + d.avg_temperature, 0) / districts.length
      : 0;

  const combinedHistory = useMemo(() => {
    // 1. Generate the last 24 hours slots (H-23 to H-0)
    const now = new Date();
    const timeline = [];
    
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = d.getHours().toString().padStart(2, "0") + ":00";
      
      // Find matching point in history
      const match = initialHistory.find(h => {
        const hDate = new Date(h.time);
        return hDate.getHours() === d.getHours() && hDate.getDate() === d.getDate();
      });

      timeline.push({
        time: i === 0 ? "Direct" : hourStr,
        value: i === 0 ? (avgTemp || (match ? match.temperature : 0)) : (match ? match.temperature : 0),
        isLive: i === 0
      });
    }

    return timeline;
  }, [initialHistory, avgTemp]);

  const totalSensors = districts.reduce((s, d) => s + d.sensor_count, 0);
  const criticalZones = districts.filter(
    (d) => getTemperatureLevel(d.avg_temperature) >= 2,
  ).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            24h Trend
          </h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
            <AnimatedNumber value={combinedHistory.length} /> Points
          </span>
        </div>
        <TrendChart
          data={combinedHistory}
          color="#16a34a"
          label="Temperature"
          unit="°C"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Averages by District
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
          <div className="text-xs text-slate-500 text-center py-2">
            Loading data…
          </div>
        )}

        {error && (
          <div className="text-xs text-amber-600 bg-amber-50 rounded-4xl p-2 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!loading && !error && districts.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-slate-800 mb-4 px-4">
              <span className="font-medium text-slate-500">
                <AnimatedNumber value={totalSensors} /> active sensors
              </span>
              {criticalZones > 0 && (
                <span className="text-green-500 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <AnimatedNumber value={criticalZones} /> critical zone{criticalZones > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {districts
                .sort((a, b) => a.district.localeCompare(b.district))
                .map((d) => {
                  const level = getTemperatureLevel(d.avg_temperature);
                  return (
                    <div
                      key={d.district}
                      className="flex items-center justify-between py-2 border-b border-slate-100 transition-all"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-base font-semibold truncate">
                        {d.district}
                      </span>
                      <span className="text-xs text-slate-400"><AnimatedNumber value={d.sensor_count} /> sensors</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black" style={{ color: getTemperatureLevelColor(level) }}>
                          <AnimatedNumber value={d.avg_temperature} decimals={1} /> <span className="text-sm">°C</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
