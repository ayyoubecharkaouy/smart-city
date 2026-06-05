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
import AnimatedNumber from "@/components/AnimatedNumber";

function MetricCard({
  title,
  value,
  unit,
  decimals = 0,
  icon: Icon,
  trend,
  colorClass,
}: {
  title: string;
  value: string | number;
  unit: string;
  decimals?: number;
  icon: LucideIcon;
  trend: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClass} p-3 rounded-2xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div
            className="flex items-center gap-1 text-sm font-bold text-green-600"
          >
            {trend > 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <AnimatedNumber value={trend} decimals={1} suffix="%" />
          </div>
        )}
      </div>
      <div>
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-slate-400">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-black">
            <AnimatedNumber value={value} decimals={decimals} />
          </h3>
          <span className="text-sm font-bold text-slate-400">{unit}</span>
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
    <div className="mx-auto min-h-screen w-full max-w-7xl bg-black p-4 text-slate-100 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-black">
          Vue d&apos;ensemble
        </h2>
        <p className="text-sm font-medium text-slate-400">
          Synthèse temps réel des principaux indicateurs urbains
        </p>
      </header>

      <div className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Température Moy."
          value={avgTemp}
          decimals={1}
          unit="°C"
          icon={Thermometer}
          trend={tempTrend}
          colorClass="bg-green-500"
        />
        <MetricCard
          title="Qualité de l'Air"
          value={avgAqi}
          unit="AQI"
          icon={Activity}
          trend={aqiTrend}
          colorClass="bg-green-500"
        />
        <MetricCard
          title="Consommation Eau"
          value={totalFlow}
          unit="L/min"
          icon={Droplets}
          trend={flowTrend}
          colorClass="bg-green-500"
        />
        <MetricCard
          title="Trafic Actuel"
          value={totalVehicles}
          unit="véhicules"
          icon={Car}
          trend={trafficTrend}
          colorClass="bg-green-500"
        />
      </div>
    </div>
  );
}
