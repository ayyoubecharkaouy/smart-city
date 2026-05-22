"use client";

import {
  Thermometer,
  Droplets,
  Car,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTemperatureData } from "@/hooks/useTemperatureData";
import { useWaterData } from "@/hooks/useWaterData";
import { useTrafficData } from "@/hooks/useTrafficData";
import StateNotice from "@/components/StateNotice";

function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  colorClass,
}: {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  trend: number;
  colorClass: string;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClass} p-3 rounded-2xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {trend > 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-black text-gray-900">{value}</h3>
          <span className="text-sm font-bold text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  const {
    districtStats: envStats,
    history: envHistory,
    loading: envLoading,
    connected: envConnected,
    error: envError,
  } = useTemperatureData();
  const {
    districtStats: waterStats,
    history: waterHistory,
    loading: waterLoading,
    connected: waterConnected,
    error: waterError,
  } = useWaterData();
  const {
    routeStats: trafficStats,
    history: trafficHistory,
    loading: trafficLoading,
    connected: trafficConnected,
    error: trafficError,
  } = useTrafficData();

  const error = envError || waterError || trafficError;
  const hasAnyData =
    envStats.size > 0 || waterStats.size > 0 || trafficStats.size > 0;
  const backendDisconnected =
    !envConnected && !waterConnected && !trafficConnected && !hasAnyData;

  if (envLoading || waterLoading || trafficLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[80vh] px-8">
        <StateNotice
          variant="loading"
          title="Préparation de la vue d&apos;ensemble"
          message="Synchronisation avec les flux Big Data..."
          className="max-w-xl"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center h-[80vh] px-8">
        <StateNotice
          variant="error"
          message={`${error}. Vérifiez que le backend est lancé sur le bon port.`}
          className="max-w-xl"
        />
      </div>
    );
  }

  if (backendDisconnected) {
    return (
      <div className="flex-1 flex items-center justify-center h-[80vh] px-8">
        <StateNotice
          variant="disconnected"
          message="Aucune connexion Socket.IO active. Lancez le backend pour recevoir les flux temps réel."
          className="max-w-xl"
        />
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="flex-1 flex items-center justify-center h-[80vh] px-8">
        <StateNotice
          variant="empty"
          message="Les APIs répondent, mais aucun capteur n'a encore envoyé de mesure."
          className="max-w-xl"
        />
      </div>
    );
  }

  const calculateTrend = (
    current: number,
    history: Array<Record<string, number | string>>,
    key: string,
  ) => {
    if (history.length < 2) return 0;
    const previous = history[0][key];
    if (!previous) return 0;
    const previousValue = Number(previous);
    if (!previousValue) return 0;
    return parseFloat((((current - previousValue) / previousValue) * 100).toFixed(1));
  };

  // Calculate global averages
  const avgTemp =
    envStats.size > 0
      ? Array.from(envStats.values()).reduce(
          (s, d) => s + d.avg_temperature,
          0,
        ) / envStats.size
      : 0;

  const avgAqi =
    envStats.size > 0
      ? Array.from(envStats.values()).reduce(
          (s, d) => s + (d.avg_aqi || 0),
          0,
        ) / envStats.size
      : 0;

  const totalFlow = Array.from(waterStats.values()).reduce(
    (s, d) => s + d.avg_flow,
    0,
  );
  const totalVehicles = Array.from(trafficStats.values()).reduce(
    (s, d) => s + d.total_vehicles,
    0,
  );

  const tempTrend = calculateTrend(avgTemp, envHistory, "temperature");
  const aqiTrend = calculateTrend(avgAqi, envHistory, "aqi");
  const flowTrend = calculateTrend(totalFlow, waterHistory, "flow");
  const trafficTrend = calculateTrend(totalVehicles, trafficHistory, "total_vehicles");

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Vue d&apos;ensemble
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-10">
        <MetricCard
          title="Température Moy."
          value={avgTemp.toFixed(1)}
          unit="°C"
          icon={Thermometer}
          trend={tempTrend}
          colorClass="bg-orange-500"
        />
        <MetricCard
          title="Qualité de l'Air"
          value={Math.round(avgAqi)}
          unit="AQI"
          icon={Activity}
          trend={aqiTrend}
          colorClass="bg-blue-500"
        />
        <MetricCard
          title="Consommation Eau"
          value={totalFlow.toFixed(0)}
          unit="L/min"
          icon={Droplets}
          trend={flowTrend}
          colorClass="bg-emerald-500"
        />
        <MetricCard
          title="Trafic Actuel"
          value={totalVehicles.toLocaleString()}
          unit="véhicules"
          icon={Car}
          trend={trafficTrend}
          colorClass="bg-indigo-500"
        />
      </div>
    </div>
  );
}
