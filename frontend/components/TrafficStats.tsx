"use client";

import { useMemo } from "react";
import {
  Car,
  Gauge,
  Activity,
  Wifi,
  WifiOff,
  TrendingUp,
} from "lucide-react";
import type { RouteTrafficStats } from "@/lib/types";
import { getTrafficStatusColor, getTrafficStatusLabel } from "@/lib/types";
import TrendChart from "./TrendChart";
import AnimatedNumber from "@/components/AnimatedNumber";

interface TrafficStatsProps {
  routeStats: Map<string, RouteTrafficStats>;
  history: {
    time: string;
    avg_speed: number;
    avg_congestion: number;
    total_vehicles: number;
  }[];
  connected: boolean;
  loading: boolean;
}

export default function TrafficStats({
  routeStats,
  history: initialHistory,
  connected,
  loading,
}: TrafficStatsProps) {
  const routes = Array.from(routeStats.values());

  const globalAvgSpeed =
    routes.length > 0
      ? routes.reduce((s, r) => s + r.avg_speed, 0) / routes.length
      : 0;

  const totalVehicles = routes.reduce((s, r) => s + r.total_vehicles, 0);
  const congestionRoutes = routes.filter(
    (r) =>
      r.dominant_status === "congestion" ||
      r.dominant_status === "forte_congestion",
  ).length;

  const speedHistory = useMemo(() => {
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
        value: i === 0 ? (globalAvgSpeed || (match ? match.avg_speed : 0)) : (match ? match.avg_speed : 0),
        isLive: i === 0
      });
    }

    return timeline;
  }, [initialHistory, globalAvgSpeed]);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Speed Trend Chart */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-green-50 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Vitesse Moyenne 24h
          </h3>
          <span className="text-[10px] font-bold text-green-300 bg-green-950/80 border border-green-800/60 px-2 py-0.5 rounded-full uppercase">
            <AnimatedNumber value={speedHistory.length} /> Points
          </span>
        </div>
        <TrendChart
          data={speedHistory}
          color="oklch(72.3% 0.219 149.579)"
          label="Vitesse"
          unit=" km/h"
        />
      </div>

      {/* Per-route stats */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-green-50 flex items-center gap-2">
            Trafic par Route
          </h3>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-300" />
            ) : (
              <WifiOff className="w-4 h-4 text-green-300" />
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-6 text-xs text-green-300 animate-pulse">
            Analyse du trafic en cours…
          </div>
        )}

        {!loading && routes.length > 0 && (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-green-950 p-3 rounded-2xl text-center border border-green-800/50">
                <span className="block text-[10px] uppercase font-bold text-green-300 mb-1">
                  Vitesse Moy.
                </span>
                <span className="text-xl font-black text-green-100">
                  <AnimatedNumber value={globalAvgSpeed} decimals={1} />
                </span>
                <span className="text-[10px] text-green-300 ml-1">km/h</span>
              </div>
              <div className="bg-green-950 p-3 rounded-2xl text-center border border-green-800/50">
                <span className="block text-[10px] uppercase font-bold text-green-300 mb-1">
                  Véhicules
                </span>
                <span className="text-xl font-black text-green-100">
                  <AnimatedNumber value={totalVehicles} />
                </span>
              </div>
              <div
                className={`p-3 rounded-2xl text-center border ${congestionRoutes > 0 ? "bg-green-950 border-green-800/50" : "bg-green-950/60 border-green-800/50"}`}
              >
                <span
                  className={`block text-[10px] uppercase font-bold mb-1 ${congestionRoutes > 0 ? "text-green-300" : "text-green-300"}`}
                >
                  Congestion
                </span>
                <span
                  className={`text-xl font-black ${congestionRoutes > 0 ? "text-green-100" : "text-green-100"}`}
                >
                  <AnimatedNumber value={congestionRoutes} />
                </span>
                <span
                  className={`text-[10px] ml-1 ${congestionRoutes > 0 ? "text-green-300" : "text-green-300"}`}
                >
                  routes
                </span>
              </div>
            </div>

            {/* Route cards */}
            <div className="space-y-1">
              {routes
                .sort((a, b) => b.avg_congestion - a.avg_congestion)
                .map((r) => {
                  const statusColor = getTrafficStatusColor(r.dominant_status);
                  const statusLabel = getTrafficStatusLabel(r.dominant_status);
                  return (
                    <div
                      key={r.route_id}
                      className="flex flex-col gap-2 py-2 border-b border-gray-900"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold uppercase text-green-50">
                            {r.route_id}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: statusColor + "20",
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-green-200/80">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            <AnimatedNumber value={r.avg_speed} decimals={1} suffix=" km/h" />
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            <AnimatedNumber value={r.total_vehicles} /> véh
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-950/60 rounded-full border border-green-800/50">
                          <Activity className="w-3 h-3 text-green-300" />
                          <span className="text-[10px] font-bold text-green-100 uppercase">
                            <AnimatedNumber value={r.sensor_count} /> capteurs
                          </span>
                        </div>
                      </div>
                      {/* Occupancy bar */}
                      <div className="w-full h-1.5 bg-green-950/70 rounded-full overflow-hidden border border-green-900/50">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(r.avg_occupancy * 100, 100)}%`,
                            backgroundColor: statusColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {!loading && routes.length === 0 && (
          <div className="text-center py-6 text-xs text-green-300">
            Aucune donnée de trafic disponible
          </div>
        )}
      </div>
    </div>
  );
}