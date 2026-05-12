"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart as BarIcon,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Table as TableIcon,
  Zap,
  Clock,
  Thermometer,
  Wind,
  Droplets,
  Car,
  Settings2,
  Maximize2,
  Gauge as GaugeIcon,
} from "lucide-react";
import { useTemperatureData } from "@/hooks/useTemperatureData";
import { useWaterData } from "@/hooks/useWaterData";
import { useTrafficData } from "@/hooks/useTrafficData";
import AnalyticsChart, { ChartType } from "@/components/AnalyticsChart";

type MetricType = "temperature" | "aqi" | "water" | "traffic";

export default function AnalyticsPage() {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [metric, setMetric] = useState<MetricType>("temperature");
  const [isRealtime, setIsRealtime] = useState(false);

  // Data Hooks
  const {
    latestReadings: envReadings,
    districtStats: envStats,
    history: envHistory,
    loading: envLoading,
  } = useTemperatureData();
  const {
    latestReadings: waterReadings,
    districtStats: waterStats,
    history: waterHistory,
    loading: waterLoading,
  } = useWaterData();
  const {
    latestReadings: trafficReadings,
    routeStats: trafficStats,
    history: trafficHistory,
    loading: trafficLoading,
  } = useTrafficData();

  const loading = envLoading || waterLoading || trafficLoading;
  const [time, setTime] = useState<string | null>(null);

  const chartConfig = useMemo(() => {
    let rawData: any[] = [];
    let xAxis = "time";
    let yAxis = "value";
    let color = "#3b82f6";
    let label = "Valeur";
    let unit = "";

    switch (metric) {
      case "temperature":
        color = "#f97316";
        label = "Température";
        unit = "°C";
        if (isRealtime) {
          rawData = Array.from(envStats.values()).map((d) => ({
            name: d.district,
            value: d.avg_temperature.toFixed(2),
          }));
          xAxis = "name";
        } else {
          rawData = envHistory.map((h) => ({
            time: new Date(h.time).getHours() + "h",
            value: h.temperature.toFixed(2),
          }));
        }
        break;
      case "aqi":
        color = "#10b981";
        label = "Qualité Air (AQI)";
        if (isRealtime) {
          rawData = Array.from(envStats.values()).map((d) => ({
            name: d.district,
            value: (d.avg_aqi || 0).toFixed(2),
          }));
          xAxis = "name";
        } else {
          rawData = envHistory.map((h) => ({
            time: new Date(h.time).getHours() + "h",
            value: h.aqi.toFixed(2),
          }));
        }
        break;
      case "water":
        color = "#3b82f6";
        label = "Débit d'Eau";
        unit = "L/min";
        if (isRealtime) {
          rawData = Array.from(waterStats.values()).map((d) => ({
            name: d.district,
            value: d.avg_flow.toFixed(2),
          }));
          xAxis = "name";
        } else {
          rawData = waterHistory.map((h) => ({
            time: new Date(h.time).getHours() + "h",
            value: h.flow.toFixed(2),
          }));
        }
        break;
      case "traffic":
        color = "#8b5cf6";
        label = "Congestion";
        unit = "%";
        if (isRealtime) {
          rawData = Array.from(trafficStats.values()).map((r) => ({
            name: r.route_id,
            value: r.avg_congestion.toFixed(2),
          }));
          xAxis = "name";
        } else {
          rawData = trafficHistory.map((h) => ({
            time: new Date(h.time).getHours() + "h",
            value: h.avg_congestion.toFixed(2),
          }));
        }
        break;
    }

    return { data: rawData, xAxis, yAxis, color, label, unit };
  }, [
    metric,
    isRealtime,
    envStats,
    envHistory,
    waterStats,
    waterHistory,
    trafficStats,
    trafficHistory,
  ]);

  const chartTypes: { id: ChartType; icon: any; label: string }[] = [
    { id: "line", icon: <LineIcon />, label: "Lignes" },
    { id: "column", icon: <BarIcon />, label: "Colonnes" },
    { id: "pie", icon: <PieIcon />, label: "Secteurs" },
    {
      id: "nightingale",
      icon: <PieIcon className="rotate-45" />,
      label: "Nightingale",
    },
    { id: "gauge", icon: <GaugeIcon />, label: "Jauge" },
    { id: "table", icon: <TableIcon />, label: "Tableau" },
  ];

  const metrics: { id: MetricType; icon: any; label: string; color: string }[] =
    [
      {
        id: "temperature",
        icon: <Thermometer />,
        label: "Température",
        color: "bg-orange-500",
      },
      {
        id: "aqi",
        icon: <Wind />,
        label: "Qualité Air",
        color: "bg-emerald-500",
      },
      {
        id: "water",
        icon: <Droplets />,
        label: "Eau Potable",
        color: "bg-blue-500",
      },
      {
        id: "traffic",
        icon: <Car />,
        label: "Trafic Routier",
        color: "bg-violet-500",
      },
    ];

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <div className="flex h-[calc(100vh-2rem)] overflow-hidden">
      {/* Configuration Sidebar */}
      <aside className="w-80 border-r border-gray-100 flex flex-col p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <Settings2 className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
            Explorateur
          </h2>
        </div>

        {/* Metric Selection */}
        <section className="mb-8">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">
            Source de Données
          </label>
          <div className="grid grid-cols-1 gap-2">
            {metrics.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`flex items-center justify-between py-1 px-1 rounded-4xl border transition-all ${
                  metric === m.id
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${metric === m.id ? "bg-white/10" : "bg-gray-50 text-gray-400"}`}
                  >
                    {m.icon}
                  </div>
                  <span className="font-bold text-sm">{m.label}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Mode Toggle */}
        <section className="mb-8">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">
            Fenêtre Temporelle
          </label>
          <div className="flex p-1 bg-gray-50 rounded-2xl gap-1">
            <button
              onClick={() => setIsRealtime(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-sm font-bold transition-all ${
                isRealtime ? "bg-white text-gray-900" : "text-gray-400"
              }`}
            >
              <Zap
                className={`w-4 h-4 ${isRealtime ? "text-yellow-500" : ""}`}
              />
              Temps Réel
            </button>
            <button
              onClick={() => setIsRealtime(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                !isRealtime ? "bg-white text-gray-900" : "text-gray-400"
              }`}
            >
              <Clock className="w-4 h-4 text-blue-500" />
              Historique
            </button>
          </div>
        </section>

        {/* Chart Type Selection */}
        <section className="mb-8">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">
            Visualisation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {chartTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setChartType(t.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-4xl border-2 transition-all gap-2 ${
                  chartType === t.id
                    ? "bg-blue-50 border-blue-200 text-blue-600 shadow-xs"
                    : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
                }`}
              >
                <div
                  className={`${chartType === t.id ? "text-blue-600" : "text-gray-600"}`}
                >
                  {t.icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-tighter">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-2 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-10 rounded-full ${metrics.find((m) => m.id === metric)?.color}`}
            />
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
                {metrics.find((m) => m.id === metric)?.label}
                <span className="text-gray-400 ml-2 font-medium">
                  —{" "}
                  {isRealtime
                    ? "Flux de données Live"
                    : "Analyse Historique (24h)"}
                </span>
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Exploration granulaire des métriques urbaines via Apache Spark
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Chart Card */}
        <div className="flex-1 p-2 flex flex-col relative overflow-hidden">
          <div className="relative flex-1">
            <AnalyticsChart
              type={chartType}
              data={chartConfig.data}
              loading={loading}
              color={chartConfig.color}
              label={chartConfig.label}
              unit={chartConfig.unit}
              xAxisKey={chartConfig.xAxis}
              yAxisKey={chartConfig.yAxis}
            />
          </div>

          <footer className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  Métrique Active
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {chartConfig.label}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  Total Points
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {chartConfig.data.length} enregistrements
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  Dernière Sync
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {time ?? "--:--:--"}
                </span>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
