"use client";

import { useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
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
  Filter,
  RotateCcw,
} from "lucide-react";
import { useTemperatureData } from "@/hooks/useTemperatureData";
import { useWaterData } from "@/hooks/useWaterData";
import { useTrafficData } from "@/hooks/useTrafficData";
import AnalyticsChart, { ChartType } from "@/components/AnalyticsChart";
import StateNotice from "@/components/StateNotice";
import AnimatedNumber from "@/components/AnimatedNumber";
import {
  ANALYTICS_DEFAULT_PERIOD,
  ANALYTICS_METRICS,
  PERIOD_OPTIONS,
  PERIOD_HOURS,
  SPARK_THRESHOLDS,
} from "@/lib/constants";

type MetricType = keyof typeof ANALYTICS_METRICS;
type PeriodFilter = "all" | keyof typeof PERIOD_HOURS;
type CriticalFilter = "all" | "critical";

function formatMetricValue(value: unknown): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
}

function isInPeriod(value: string | undefined, period: PeriodFilter): boolean {
  if (period === "all") return true;
  if (!value) return false;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;

  return Date.now() - time <= PERIOD_HOURS[period] * 60 * 60 * 1000;
}

function isCriticalMetric(metric: MetricType, value: unknown): boolean {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return false;

  if (metric === "temperature") return numericValue >= SPARK_THRESHOLDS.criticalTemperature;
  if (metric === "aqi") return numericValue >= SPARK_THRESHOLDS.criticalAqi;
  if (metric === "water") return numericValue <= SPARK_THRESHOLDS.criticalLowFlow;
  return numericValue >= SPARK_THRESHOLDS.criticalCongestion;
}

export default function AnalyticsPage() {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [metric, setMetric] = useState<MetricType>("temperature");
  const [isRealtime, setIsRealtime] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(ANALYTICS_DEFAULT_PERIOD);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [criticalFilter, setCriticalFilter] = useState<CriticalFilter>("all");
  const [time, setTime] = useState<string | null>(null);

  // Data Hooks
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

  const loading = envLoading || waterLoading || trafficLoading;
  const activeError =
    metric === "water"
      ? waterError
      : metric === "traffic"
        ? trafficError
        : envError;
  const activeConnected =
    metric === "water"
      ? waterConnected
      : metric === "traffic"
        ? trafficConnected
        : envConnected;

  const districtOptions = useMemo(() => {
    const districts = [
      ...Array.from(envStats.values()).map((item) => item.district),
      ...Array.from(waterStats.values()).map((item) => item.district),
    ].filter(Boolean);
    return Array.from(new Set(districts.sort()));
  }, [envStats, waterStats]);

  const routeOptions = useMemo(() => {
    const routes = Array.from(trafficStats.values())
      .map((item) => item.route_id)
      .filter(Boolean)
      .sort();
    return Array.from(new Set(routes));
  }, [trafficStats]);

  const resetFilters = () => {
    setPeriodFilter(ANALYTICS_DEFAULT_PERIOD);
    setDistrictFilter("all");
    setRouteFilter("all");
    setCriticalFilter("all");
  };

  const selectedPeriodLabel =
    PERIOD_OPTIONS.find((option) => option.value === periodFilter)?.label || "24 dernieres heures";

  const chartConfig = useMemo(() => {
    let rawData: Record<string, string | number>[] = [];
    let xAxis = "time";
    const yAxis = "value";
    const metricConfig = ANALYTICS_METRICS[metric];
    const color = metricConfig.color;
    const label = metricConfig.chartLabel;
    const unit = metricConfig.unit;

    switch (metric) {
      case "temperature":
        if (isRealtime) {
          rawData = Array.from(envStats.values())
            .filter((d) => districtFilter === "all" || d.district === districtFilter)
            .map((d) => ({
              name: d.district,
              value: formatMetricValue(d.avg_temperature),
            }));
          xAxis = "name";
        } else {
          rawData = envHistory
            .filter((h) => isInPeriod(h.time, periodFilter))
            .map((h) => ({
              time: new Date(h.time).getHours() + "h",
              value: formatMetricValue(h.temperature),
            }));
        }
        break;
      case "aqi":
        if (isRealtime) {
          rawData = Array.from(envStats.values())
            .filter((d) => districtFilter === "all" || d.district === districtFilter)
            .map((d) => ({
              name: d.district,
              value: formatMetricValue(d.avg_aqi),
            }));
          xAxis = "name";
        } else {
          rawData = envHistory
            .filter((h) => isInPeriod(h.time, periodFilter))
            .map((h) => ({
              time: new Date(h.time).getHours() + "h",
              value: formatMetricValue(h.aqi),
            }));
        }
        break;
      case "water":
        if (isRealtime) {
          rawData = Array.from(waterStats.values())
            .filter((d) => districtFilter === "all" || d.district === districtFilter)
            .map((d) => ({
              name: d.district,
              value: formatMetricValue(d.avg_flow),
            }));
          xAxis = "name";
        } else {
          rawData = waterHistory
            .filter((h) => isInPeriod(h.time, periodFilter))
            .map((h) => ({
              time: new Date(h.time).getHours() + "h",
              value: formatMetricValue(h.flow),
            }));
        }
        break;
      case "traffic":
        if (isRealtime) {
          rawData = Array.from(trafficStats.values())
            .filter((r) => routeFilter === "all" || r.route_id === routeFilter)
            .map((r) => ({
              name: r.route_id,
              value: formatMetricValue(r.avg_congestion),
            }));
          xAxis = "name";
        } else {
          rawData = trafficHistory
            .filter((h) => isInPeriod(h.time, periodFilter))
            .map((h) => ({
              time: new Date(h.time).getHours() + "h",
              value: formatMetricValue(h.avg_congestion),
            }));
        }
        break;
    }

    if (criticalFilter === "critical") {
      rawData = rawData.filter((item) => isCriticalMetric(metric, item.value));
    }

    return { data: rawData, xAxis, yAxis, color, label, unit };
  }, [
    metric,
    isRealtime,
    periodFilter,
    districtFilter,
    routeFilter,
    criticalFilter,
    envStats,
    envHistory,
    waterStats,
    waterHistory,
    trafficStats,
    trafficHistory,
  ]);

  const chartTypes: { id: ChartType; icon: ReactNode; label: string }[] = [
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

  const metrics: { id: MetricType; icon: ReactNode; label: string; color: string }[] =
    [
      {
        id: "temperature",
        icon: <Thermometer />,
        label: ANALYTICS_METRICS.temperature.label,
        color: ANALYTICS_METRICS.temperature.accentClass,
      },
      {
        id: "aqi",
        icon: <Wind />,
        label: ANALYTICS_METRICS.aqi.label,
        color: ANALYTICS_METRICS.aqi.accentClass,
      },
      {
        id: "water",
        icon: <Droplets />,
        label: ANALYTICS_METRICS.water.label,
        color: ANALYTICS_METRICS.water.accentClass,
      },
      {
        id: "traffic",
        icon: <Car />,
        label: ANALYTICS_METRICS.traffic.label,
        color: ANALYTICS_METRICS.traffic.accentClass,
      },
    ];

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString());
    const timeout = window.setTimeout(updateTime, 0);
    const interval = window.setInterval(() => {
      updateTime();
    }, 1000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
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
          <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4 block">
            Type de Métrique
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
          <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4 block">
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
                className={`w-6 h-6 ${isRealtime ? "text-yellow-500" : ""}`}
              />
              Temps Réel
            </button>
            <button
              onClick={() => setIsRealtime(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                !isRealtime ? "bg-white text-gray-900" : "text-gray-400"
              }`}
            >
              <Clock className="w-6 h-6 text-blue-500" />
              Historique
            </button>
          </div>
        </section>

        {/* Chart Type Selection */}
        <section className="mb-8">
          <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4 block">
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
                    : `Analyse Historique (${selectedPeriodLabel})`}
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

        <section className="mb-4 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-900 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-gray-900">
                  Filtres globaux
                </h3>
                <p className="text-xs font-medium text-gray-500">
                  Période, zone et criticité appliquées au graphique
                </p>
              </div>
            </div>
            <button
              onClick={resetFilters}
              className="flex w-fit items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-xs font-black uppercase text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Période</span>
              <select
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}
                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-700 outline-none transition-colors focus:border-gray-900 focus:bg-white"
              >
                {PERIOD_OPTIONS.filter(option => option.value !== "all").map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">District</span>
              <select
                value={districtFilter}
                onChange={(event) => setDistrictFilter(event.target.value)}
                disabled={metric === "traffic"}
                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-700 outline-none transition-colors focus:border-gray-900 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="all">Tous les districts</option>
                {districtOptions.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Route</span>
              <select
                value={routeFilter}
                onChange={(event) => setRouteFilter(event.target.value)}
                disabled={metric !== "traffic"}
                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-700 outline-none transition-colors focus:border-gray-900 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="all">Toutes les routes</option>
                {routeOptions.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
            </label>

            <label className="flex h-full min-h-11 items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 xl:mt-4">
              <span className="text-xs font-black uppercase text-gray-600">
                Critiques
              </span>
              <input
                type="checkbox"
                checked={criticalFilter === "critical"}
                onChange={(event) => setCriticalFilter(event.target.checked ? "critical" : "all")}
                className="h-5 w-5 rounded border-gray-300 text-gray-900"
              />
            </label>
          </div>
        </section>

        {/* Main Chart Card */}
        <div className="flex-1 p-2 flex flex-col relative overflow-hidden">
          <div className="relative flex-1">
            {activeError ? (
              <div className="flex h-full items-center justify-center">
                <StateNotice
                  variant="error"
                  message={`${activeError}. Vérifiez la disponibilité de l'API backend.`}
                  className="max-w-xl"
                />
              </div>
            ) : !loading && !activeConnected && chartConfig.data.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <StateNotice
                  variant="disconnected"
                  message="Le backend temps réel n'est pas connecté et aucune donnée locale n'est disponible."
                  className="max-w-xl"
                />
              </div>
            ) : !loading && chartConfig.data.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <StateNotice
                  variant="empty"
                  message="Aucune mesure ne correspond à cette métrique et à cette fenêtre temporelle."
                  className="max-w-xl"
                />
              </div>
            ) : (
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
            )}
          </div>

          <footer className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
                  Métrique Active
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {chartConfig.label}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
                  Total Points
                </span>
                <span className="text-sm font-bold text-gray-700">
                  <AnimatedNumber value={chartConfig.data.length} /> enregistrements
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1">
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
