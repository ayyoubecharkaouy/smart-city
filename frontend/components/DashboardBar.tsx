"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type {
  DistrictTemperature,
  DistrictWater,
  RouteTrafficStats,
} from "@/lib/types";
import {
  getTemperatureLevel,
  getTemperatureLevelColor,
  getAqiLevel,
  getAqiLevelColor,
  getPhLevel,
  getPhLevelColor,
  getWaterFlowLevel,
  getWaterFlowLevelColor,
  getTrafficStatusLevel,
  getTrafficStatusLevelColor,
} from "@/lib/types";
import {
  Thermometer,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wind,
  Droplets,
  FlaskConical,
  Car,
  Navigation,
  Gauge,
  Loader,
} from "lucide-react";

interface DashboardBarProps {
  mode: string;
  districtStats?: Map<string, DistrictTemperature>;
  waterStats?: Map<string, DistrictWater>;
  trafficStats?: Map<string, RouteTrafficStats>;
  connected: boolean;
  loading: boolean;
}

interface Kpi {
  icon: ReactNode;
  label: string;
  unit: string;
  color: string;
  key: string;
  value?: string | null;
}

const DashboardBar = memo(
  ({
    mode,
    districtStats,
    waterStats,
    trafficStats,
    connected,
    loading,
  }: DashboardBarProps) => {
    const [currentTime, setCurrentTime] = useState<string | null>(null);

    useEffect(() => {
      const updateTime = () => setCurrentTime(new Date().toLocaleTimeString("fr-FR"));
      const timeout = window.setTimeout(updateTime, 0);
      const interval = window.setInterval(() => {
        updateTime();
      }, 1000);
      return () => {
        window.clearTimeout(timeout);
        window.clearInterval(interval);
      };
    }, []);

    const stats = useMemo(() => {
      // Helper to handle empty data during loading
      const getKpis = () => {
        switch (mode) {
          case "temperature":
            return [
              {
                icon: <Thermometer />,
                label: "Moyenne",
                unit: "°C",
                color: "from-orange-400 to-red-500",
                key: "avg",
              },
              {
                icon: <TrendingDown />,
                label: "Minimum",
                unit: "°C",
                color: "from-blue-400 to-blue-600",
                key: "min",
              },
              {
                icon: <TrendingUp />,
                label: "Maximum",
                unit: "°C",
                color: "from-red-400 to-red-600",
                key: "max",
              },
              {
                icon: <Activity />,
                label: "Capteurs",
                unit: "actifs",
                color: "from-violet-400 to-purple-500",
                key: "total",
              },
              {
                icon: <AlertTriangle />,
                label: "Alertes",
                unit: "zones",
                color: "from-green-400 to-green-600",
                key: "critical",
              },
            ];
          case "air_quality":
            return [
              {
                icon: <Wind />,
                label: "AQI Moyen",
                unit: "",
                color: "from-green-400 to-emerald-600",
                key: "avg",
              },
              {
                icon: <AlertTriangle />,
                label: "AQI Max",
                unit: "",
                color: "from-orange-400 to-red-600",
                key: "max",
              },
              {
                icon: <Activity />,
                label: "Capteurs",
                unit: "actifs",
                color: "from-blue-400 to-cyan-500",
                key: "total",
              },
              {
                icon: <Navigation />,
                label: "Zones Critiques",
                unit: "alertes",
                color: "from-green-400 to-green-600",
                key: "critical",
              },
            ];
          case "water_consumption":
            return [
              {
                icon: <Droplets />,
                label: "Débit Total",
                unit: "L/min",
                color: "from-blue-400 to-indigo-600",
                key: "totalFlow",
              },
              {
                icon: <Gauge />,
                label: "Moyenne",
                unit: "L/min",
                color: "from-cyan-400 to-blue-500",
                key: "avg",
              },
              {
                icon: <Activity />,
                label: "Volume Cumulé",
                unit: "L",
                color: "from-blue-500 to-blue-700",
                key: "totalVolume",
              },
              {
                icon: <Navigation />,
                label: "Points d'accès",
                unit: "actifs",
                color: "from-teal-400 to-emerald-500",
                key: "sensors",
              },
            ];
          case "water_quality":
            return [
              {
                icon: <FlaskConical />,
                label: "pH Moyen",
                unit: "pH",
                color: "from-teal-400 to-green-600",
                key: "avgPh",
              },
              {
                icon: <Droplets />,
                label: "Turbidité",
                unit: "NTU",
                color: "from-amber-400 to-orange-500",
                key: "avgTurb",
              },
              {
                icon: <AlertTriangle />,
                label: "Hors Normes",
                unit: "zones",
                color: "from-green-400 to-green-600",
                key: "alerts",
              },
            ];
          case "traffic_congestion":
            return [
              {
                icon: <Gauge />,
                label: "Vitesse Moy.",
                unit: "km/h",
                color: "from-emerald-400 to-emerald-600",
                key: "avgSpeed",
              },
              {
                icon: <Car />,
                label: "Véhicules",
                unit: "détectés",
                color: "from-blue-400 to-blue-600",
                key: "totalVehicles",
              },
              {
                icon: <Activity />,
                label: "Capteurs",
                unit: "actifs",
                color: "from-violet-400 to-purple-500",
                key: "totalSensors",
              },
              {
                icon: <AlertTriangle />,
                label: "Congestion",
                unit: "routes",
                color: "from-green-500 to-green-700",
                key: "congested",
              },
            ];
          default:
            return [];
        }
      };

      const title =
        {
          temperature: "Température",
          air_quality: "Qualité de l'Air",
          water_consumption: "Consommation d'Eau",
          water_quality: "Qualité de l'Eau",
          traffic_congestion: "Trafic Routier",
        }[mode as never] || "Smart City";

      const baseKpis: Kpi[] = getKpis();

      if (loading) {
        return { title, kpis: baseKpis.map((k) => ({ ...k, value: null })) };
      }

      switch (mode) {
        case "temperature": {
          const districts = Array.from(districtStats?.values() || []);
          if (districts.length === 0)
            return {
              title,
              kpis: baseKpis.map((k) => ({ ...k, value: null })),
            };
          const avg =
            districts.reduce((s, d) => s + d.avg_temperature, 0) /
            districts.length;
          const min = Math.min(...districts.map((d) => d.min_temperature));
          const max = Math.max(...districts.map((d) => d.max_temperature));
          const total = districts.reduce((s, d) => s + d.sensor_count, 0);
          const critical = districts.filter(
            (d) => getTemperatureLevel(d.avg_temperature) >= 2,
          ).length;

          return {
            title,
            kpis: baseKpis.map((k) => {
              if (k.key === "avg") return { ...k, value: avg.toFixed(1) };
              if (k.key === "min") return { ...k, value: min.toFixed(1) };
              if (k.key === "max") return { ...k, value: max.toFixed(1) };
              if (k.key === "total") return { ...k, value: total.toString() };
              if (k.key === "critical")
                return {
                  ...k,
                  value: critical.toString(),
                  color: critical > 0 ? "from-red-500 to-red-700" : k.color,
                };
              return k;
            }),
            distribution: {
              levels: [0, 1, 2],
              getColor: getTemperatureLevelColor,
              getWeight: (level: number) =>
                districts.filter(
                  (d) => getTemperatureLevel(d.avg_temperature) === level,
                ).length,
            },
          };
        }
        case "air_quality": {
          const districts = Array.from(districtStats?.values() || []);
          if (districts.length === 0)
            return {
              title,
              kpis: baseKpis.map((k) => ({ ...k, value: null })),
            };
          const avg =
            districts.reduce((s, d) => s + (d.avg_aqi || 0), 0) /
            districts.length;
          const max = Math.max(...districts.map((d) => d.avg_aqi || 0));
          const total = districts.reduce((s, d) => s + d.sensor_count, 0);
          const critical = districts.filter(
            (d) => (d.avg_aqi || 0) > 150,
          ).length;

          return {
            title,
            kpis: baseKpis.map((k) => {
              if (k.key === "avg") return { ...k, value: avg.toFixed(0) };
              if (k.key === "max") return { ...k, value: max.toFixed(0) };
              if (k.key === "total") return { ...k, value: total.toString() };
              if (k.key === "critical")
                return {
                  ...k,
                  value: critical.toString(),
                  color: critical > 0 ? "from-red-500 to-red-700" : k.color,
                };
              return k;
            }),
            distribution: {
              levels: [0, 1, 2, 3, 4, 5],
              getColor: getAqiLevelColor,
              getWeight: (level: number) =>
                districts.filter((d) => getAqiLevel(d.avg_aqi || 0) === level)
                  .length,
            },
          };
        }
        case "water_consumption": {
          const districts = Array.from(waterStats?.values() || []);
          if (districts.length === 0)
            return {
              title,
              kpis: baseKpis.map((k) => ({ ...k, value: null })),
            };
          const totalFlow = districts.reduce((s, d) => s + d.avg_flow, 0);
          const totalVolume = districts.reduce((s, d) => s + d.total_volume, 0);
          const avg = totalFlow / districts.length;
          const sensors = districts.reduce((s, d) => s + d.sensor_count, 0);

          return {
            title,
            kpis: baseKpis.map((k) => {
              if (k.key === "totalFlow")
                return { ...k, value: totalFlow.toFixed(1) };
              if (k.key === "avg") return { ...k, value: avg.toFixed(1) };
              if (k.key === "totalVolume")
                return { ...k, value: totalVolume.toFixed(0) };
              if (k.key === "sensors")
                return { ...k, value: sensors.toString() };
              return k;
            }),
            distribution: {
              levels: [0, 1, 2, 3],
              getColor: getWaterFlowLevelColor,
              getWeight: (level: number) =>
                districts.filter((d) => getWaterFlowLevel(d.avg_flow) === level)
                  .length,
            },
          };
        }
        case "water_quality": {
          const districts = Array.from(waterStats?.values() || []);
          if (districts.length === 0)
            return {
              title,
              kpis: baseKpis.map((k) => ({ ...k, value: null })),
            };
          const avgPh =
            districts.reduce((s, d) => s + d.avg_ph, 0) / districts.length;
          const avgTurb =
            districts.reduce((s, d) => s + d.avg_turbidity, 0) /
            districts.length;
          const alerts = districts.filter(
            (d) => d.avg_ph < 6.5 || d.avg_ph > 8.5,
          ).length;

          return {
            title,
            kpis: baseKpis.map((k) => {
              if (k.key === "avgPh") return { ...k, value: avgPh.toFixed(1) };
              if (k.key === "avgTurb")
                return { ...k, value: avgTurb.toFixed(2) };
              if (k.key === "alerts")
                return {
                  ...k,
                  value: alerts.toString(),
                  color: alerts > 0 ? "from-red-500 to-red-700" : k.color,
                };
              return k;
            }),
            distribution: {
              levels: [0, 1, 2],
              getColor: getPhLevelColor,
              getWeight: (level: number) =>
                districts.filter((d) => getPhLevel(d.avg_ph) === level).length,
            },
          };
        }
        case "traffic_congestion": {
          const routes = Array.from(trafficStats?.values() || []);
          if (routes.length === 0)
            return {
              title,
              kpis: baseKpis.map((k) => ({ ...k, value: null })),
            };
          const avgSpeed =
            routes.reduce((s, r) => s + r.avg_speed, 0) / routes.length;
          const totalVehicles = routes.reduce(
            (s, r) => s + r.total_vehicles,
            0,
          );
          const totalSensors = routes.reduce((s, r) => s + r.sensor_count, 0);
          const congested = routes.filter(
            (r) =>
              r.dominant_status === "congestion" ||
              r.dominant_status === "forte_congestion",
          ).length;

          return {
            title,
            kpis: baseKpis.map((k) => {
              if (k.key === "avgSpeed")
                return { ...k, value: avgSpeed.toFixed(1) };
              if (k.key === "totalVehicles")
                return { ...k, value: totalVehicles.toLocaleString() };
              if (k.key === "totalSensors")
                return { ...k, value: totalSensors.toString() };
              if (k.key === "congested")
                return {
                  ...k,
                  value: congested.toString(),
                  color: congested > 0 ? "from-red-600 to-red-800" : k.color,
                };
              return k;
            }),
            distribution: {
              levels: [0, 1, 2, 3],
              getColor: getTrafficStatusLevelColor,
              getWeight: (level: number) =>
                routes.filter(
                  (r) => getTrafficStatusLevel(r.dominant_status) === level,
                ).length,
            },
          };
        }
        default:
          return null;
      }
    }, [mode, districtStats, waterStats, trafficStats, loading]);

    if (!stats) return null;

    return (
      <div className="absolute top-4 left-4 right-4 z-1000 flex flex-col items-center gap-2 pointer-events-none">
        {/* KPI Row */}
        <div className="w-full flex items-stretch justify-around flex-wrap gap-2">
          {stats.kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="flex-1 bg-white/70 backdrop-blur-xl border border-white/40 rounded-4xl p-4 pointer-events-auto transition-all hover:bg-white/90"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-14 min-w-14 h-14 rounded-4xl bg-linear-to-br ${kpi.color} flex items-center justify-center text-white [&>svg]:w-7 [&>svg]:h-7`}
                >
                  {kpi.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {kpi.label}
                  </p>
                  <div className="flex items-baseline gap-1">
                    {kpi.value === null || loading ? (
                      <Loader className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <span className="text-2xl font-black text-gray-900 tabular-nums">
                          {kpi.value}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {kpi.unit}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Distribution Statistics Bar */}
        {stats.distribution && (
          <div className="w-full max-w-max bg-white/70 backdrop-blur-xl border border-white/40 rounded-full px-6 py-3 pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-sm font-bold uppercase tracking-widest whitespace-nowrap">
                {stats.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {connected && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span className="text-sm font-black text-red-600 tracking-tighter uppercase">
                    {mode === "traffic_congestion" ? "TEMPS RÉEL" : "LIVE FEED"}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-500 tabular-nums border-b-2 border-red-600">
                {currentTime ?? "--:--:--"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  },
);

DashboardBar.displayName = "DashboardBar";

export default DashboardBar;
