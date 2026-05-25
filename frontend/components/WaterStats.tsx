"use client";

import { useMemo } from "react";
import { Wifi, WifiOff, TrendingUp, Activity } from "lucide-react";
import type { DistrictWater } from "@/lib/types";
import { getPhColor } from "@/lib/types";
import TrendChart from "./TrendChart";
import AnimatedNumber from "@/components/AnimatedNumber";

interface WaterStatsProps {
  districtStats: Map<string, DistrictWater>;
  history: { time: string; flow: number }[];
  connected: boolean;
  loading: boolean;
}

export default function WaterStats({
  districtStats,
  history: initialHistory,
  connected,
  loading,
}: WaterStatsProps) {
  const districts = Array.from(districtStats.values());

  const totalVolume = districts.reduce((s, d) => s + d.total_volume, 0);
  const avgFlow =
    districts.length > 0
      ? districts.reduce((s, d) => s + d.avg_flow, 0) / districts.length
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
        value: i === 0 ? (avgFlow || (match ? match.flow : 0)) : (match ? match.flow : 0),
        isLive: i === 0
      });
    }
    return timeline;
  }, [initialHistory, avgFlow]);

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="border border-gray-200 rounded-4xl p-4 bg-white/50 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2 px-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Analyse Débit Eau
        </h3>
        <TrendChart
          data={combinedHistory}
          color="#3b82f6"
          label="Débit"
          unit=" L/m"
        />
      </div>

      <div className=" border border-gray-200 rounded-4xl p-4 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 px-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Gestion par Quartier
          </h3>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        {!loading && districts.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-blue-50 p-3 rounded-4xl text-center border border-blue-100">
                <span className="block text-[10px] uppercase font-bold text-blue-600 mb-1">
                  Volume Total
                </span>
                <span className="text-xl font-black text-blue-800">
                  <AnimatedNumber value={totalVolume} decimals={1} suffix=" L" />
                </span>
              </div>
              <div className="bg-cyan-50 p-3 rounded-4xl text-center border border-cyan-100">
                <span className="block text-[10px] uppercase font-bold text-cyan-600 mb-1">
                  Débit Moyen
                </span>
                <span className="text-xl font-black text-cyan-800">
                  <AnimatedNumber value={avgFlow} decimals={1} />
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {districts
                .sort((a, b) => a.district.localeCompare(b.district))
                .map((d) => {
                  const phColor = getPhColor(d.avg_ph);
                  return (
                    <div
                      key={d.district}
                      className="flex items-center justify-between gap-2 p-3 px-5 rounded-4xl border-2 border-gray-100 transition-all"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-gray-700">
                          {d.district}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                          <Activity className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            <AnimatedNumber value={d.sensor_count} /> Sensors
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: phColor }}
                          />
                          <span className="text-base font-black text-gray-500">
                            <span className="text-sm">pH</span> <AnimatedNumber value={d.avg_ph} decimals={2} />
                          </span>
                        </div>
                        <span>|</span>
                        <span className="text-base font-black text-blue-600">
                          <AnimatedNumber value={d.avg_flow} decimals={2} />{" "}
                          <span className="text-[10px]">L/min</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-6 text-xs text-gray-400 animate-pulse">
            Analyse des flux d&apos;eau...
          </div>
        )}
      </div>
    </div>
  );
}
