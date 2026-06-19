"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSparkData } from "@/hooks/useSparkData";
import AnimatedNumber from "@/components/AnimatedNumber";
import type {
  SparkAlertData,
  SparkEnvironmentData,
  SparkErrorData,
  SparkTrafficData,
  SparkWaterData,
} from "@/lib/types";
import {
  PERIOD_OPTIONS,
  PERIOD_HOURS,
  SPARK_THRESHOLDS,
} from "@/lib/constants";
import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  Database,
  Droplet,
  Factory,
  Filter,
  Gauge,
  RotateCcw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SparkTab = "environment" | "water" | "traffic" | "alerts" | "errors";
type PeriodFilter = "all" | keyof typeof PERIOD_HOURS;
type CriticalFilter = "all" | "critical";

const tabs: { key: SparkTab; label: string; icon: typeof Activity }[] = [
  { key: "environment", label: "Environment", icon: Factory },
  { key: "water", label: "Water", icon: Droplet },
  { key: "traffic", label: "Traffic", icon: Activity },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "errors", label: "Errors", icon: AlertTriangle },
];

function formatTime(value?: string): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getLatencySeconds(processedAt?: string, sourceAt?: string): number | null {
  if (!processedAt || !sourceAt) return null;
  const processedTime = new Date(processedAt).getTime();
  const sourceTime = new Date(sourceAt).getTime();
  if (Number.isNaN(processedTime) || Number.isNaN(sourceTime)) return null;
  return Math.max(0, (processedTime - sourceTime) / 1000);
}

function chartValue(value: unknown): number | null {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function isInPeriod(value: string | undefined, period: PeriodFilter): boolean {
  if (period === "all") return true;
  if (!value) return false;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;

  return Date.now() - time <= PERIOD_HOURS[period] * 60 * 60 * 1000;
}

function isCriticalEnvironment(item: SparkEnvironmentData): boolean {
  return Number(item.max_air_quality) >= SPARK_THRESHOLDS.criticalAqi || Number(item.max_temperature) >= SPARK_THRESHOLDS.criticalTemperature;
}

function isCriticalWater(item: SparkWaterData): boolean {
  return item.sudden_flow_drop
    || Number(item.water_quality_score) < SPARK_THRESHOLDS.criticalWaterScore
    || Number(item.avg_ph) < SPARK_THRESHOLDS.minSafePh
    || Number(item.avg_ph) > SPARK_THRESHOLDS.maxSafePh;
}

function isCriticalTraffic(item: SparkTrafficData): boolean {
  return Boolean(item.is_congested_route) || Number(item.max_congestion) >= SPARK_THRESHOLDS.criticalCongestion || item.congestion_level === "high";
}

function isCriticalAlert(item: SparkAlertData): boolean {
  return item.severity === "critical" || item.severity === "high";
}

function StatCard({
  icon: Icon,
  label,
  value,
  decimals,
  suffix,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: number | null;
  decimals?: number;
  suffix?: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black">
            {value === null ? "--" : <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <Database className="mx-auto mb-3 h-8 w-8 text-slate-500" />
      <p className="font-bold text-slate-600">{message}</p>
    </div>
  );
}

function SparkChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-black">{title}</h3>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

function SparkBarChart({
  data,
  xKey,
  yKey,
  color,
  unit = "",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color: string;
  unit?: string;
}) {
  if (data.length === 0) {
    return <EmptyState message="No data available for this chart." />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} unit={unit} />
        <Tooltip
          cursor={{ fill: "#f8fafc" }}
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#0f172a",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SparkLatencyChart({ data }: { data: { time: string; latency: number }[] }) {
  if (data.length === 0) {
    return <EmptyState message="No Spark latency data available." />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} unit="s" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#0f172a",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Line type="monotone" dataKey="latency" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EnvironmentTable({ data }: { data: SparkEnvironmentData[] }) {
  if (data.length === 0) return <EmptyState message="No environment window data available." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-[10px] uppercase text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="py-3 font-black">District</th>
            <th className="py-3 font-black">Avg. Temp.</th>
            <th className="py-3 font-black">Min / Max</th>
            <th className="py-3 font-black">Max AQI</th>
            <th className="py-3 font-black">Trend</th>
            <th className="py-3 font-black">Processed</th>
            <th className="py-3 font-black">Latency</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => {
            const latency = getLatencySeconds(item.processed_at, item.window?.end);
            return (
              <tr key={`${item.district}-${item.processed_at}`} className="border-b border-slate-200">
                <td className="py-3 font-bold">{item.district}</td>
                <td className="py-3 text-green-500 font-black"><AnimatedNumber value={item.avg_temperature} decimals={1} suffix="°C" /></td>
                <td className="py-3 text-slate-500">
                  <AnimatedNumber value={item.min_temperature} decimals={1} /> / <AnimatedNumber value={item.max_temperature} decimals={1} suffix="°C" />
                </td>
                <td className="py-3 text-slate-500"><AnimatedNumber value={item.max_air_quality} /></td>
                <td className="py-3 text-slate-500">{item.temperature_trend}</td>
                <td className="py-3 text-slate-600">{formatTime(item.processed_at)}</td>
                <td className="py-3 font-bold text-green-500">{latency === null ? "--" : <AnimatedNumber value={latency} decimals={1} suffix="s" />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WaterTable({ data }: { data: SparkWaterData[] }) {
  if (data.length === 0) return <EmptyState message="No water window data available." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-[10px] uppercase text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="py-3 font-black">District</th>
            <th className="py-3 font-black">Avg. Flow</th>
            <th className="py-3 font-black">Total Flow</th>
            <th className="py-3 font-black">pH</th>
            <th className="py-3 font-black">Score</th>
            <th className="py-3 font-black">Flow Drop</th>
            <th className="py-3 font-black">Latency</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => {
            const latency = getLatencySeconds(item.processed_at, item.window?.end);
            return (
              <tr key={`${item.district}-${item.processed_at}`} className="border-b border-slate-200">
                <td className="py-3 font-bold">{item.district}</td>
                <td className="py-3 text-green-500 font-black"><AnimatedNumber value={item.avg_flow_rate} decimals={1} suffix=" L/m" /></td>
                <td className="py-3 text-slate-500"><AnimatedNumber value={item.total_flow_rate} decimals={1} /></td>
                <td className="py-3 text-slate-500"><AnimatedNumber value={item.avg_ph} decimals={1} /></td>
                <td className="py-3 font-bold text-green-500"><AnimatedNumber value={item.water_quality_score} /></td>
                <td className="py-3 text-slate-400">{item.sudden_flow_drop ? "Yes" : "No"}</td>
                <td className="py-3 font-bold text-green-500">{latency === null ? "--" : <AnimatedNumber value={latency} decimals={1} suffix="s" />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TrafficTable({ data }: { data: SparkTrafficData[] }) {
  if (data.length === 0) return <EmptyState message="No traffic window data available." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-[10px] uppercase text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="py-3 font-black">Route</th>
            <th className="py-3 font-black">Avg. Speed</th>
            <th className="py-3 font-black">Min. Speed</th>
            <th className="py-3 font-black">Avg. Vehicles</th>
            <th className="py-3 font-black">Congestion</th>
            <th className="py-3 font-black">Level</th>
            <th className="py-3 font-black">Latency</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => {
            const latency = getLatencySeconds(item.processed_at, item.window?.end);
            return (
              <tr key={`${item.route_id}-${item.processed_at}`} className="border-b border-slate-200">
                <td className="py-3 font-bold">{item.route_id}</td>
                <td className="py-3 text-green-500 font-black"><AnimatedNumber value={item.avg_speed} decimals={1} suffix=" km/h" /></td>
                <td className="py-3 text-slate-500"><AnimatedNumber value={item.min_speed} decimals={1} suffix=" km/h" /></td>
                <td className="py-3 text-slate-500"><AnimatedNumber value={item.avg_vehicle_count} /></td>
                <td className="py-3 text-green-500 font-bold"><AnimatedNumber value={item.max_congestion} decimals={2} /></td>
                <td className="py-3 text-slate-500">{item.congestion_level}</td>
                <td className="py-3 font-bold text-green-500">{latency === null ? "--" : <AnimatedNumber value={latency} decimals={1} suffix="s" />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTable({ data }: { data: SparkAlertData[] }) {
  if (data.length === 0) return <EmptyState message="No Spark alerts available." />;

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={`${item.processed_at}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-slate-800">{item.type} / {item.alert_type}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {item.district || item.route_id || item.sensor_id || "Unknown source"} · {formatTime(item.timestamp || item.processed_at)}
              </p>
            </div>
            <p className="font-black text-slate-800">
              <AnimatedNumber value={item.value} decimals={1} /> {item.operator} <AnimatedNumber value={item.threshold} decimals={1} />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorsTable({ data }: { data: SparkErrorData[] }) {
  if (data.length === 0) return <EmptyState message="No Spark JSON errors available." />;

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={`${item.processed_at}-${index}`} className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-black text-red-800">{item.stream} / {item.error_reason}</p>
              <p className="mt-1 truncate font-mono text-xs text-red-600" title={item.raw_value}>{item.raw_value}</p>
            </div>
            <p className="shrink-0 text-sm font-bold text-red-500">{formatTime(item.processed_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SparkDataPage() {
  const [activeTab, setActiveTab] = useState<SparkTab>("environment");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [criticalFilter, setCriticalFilter] = useState<CriticalFilter>("all");
  const {
    envData,
    waterData,
    trafficData,
    sparkAlerts,
    sparkErrors,
    connected,
    reconnecting,
    reconnectAttempt,
    lastEvent,
    eventCount,
    socketError,
    error,
  } = useSparkData();

  const districtOptions = useMemo(() => {
    const districts = [...envData, ...waterData]
      .map(item => item.district)
      .filter(Boolean)
      .sort();
    return Array.from(new Set(districts));
  }, [envData, waterData]);

  const routeOptions = useMemo(() => {
    const routes = trafficData
      .map(item => item.route_id)
      .filter(Boolean)
      .sort();
    return Array.from(new Set(routes));
  }, [trafficData]);

  const alertTypeOptions = useMemo(() => {
    const alertTypes = sparkAlerts
      .map(item => item.alert_type)
      .filter(Boolean)
      .sort();
    return Array.from(new Set(alertTypes));
  }, [sparkAlerts]);

  const filteredEnvData = useMemo(() => {
    return envData.filter(item => {
      if (districtFilter !== "all" && item.district !== districtFilter) return false;
      if (!isInPeriod(item.processed_at || item.window?.end, periodFilter)) return false;
      if (criticalFilter === "critical" && !isCriticalEnvironment(item)) return false;
      return true;
    });
  }, [criticalFilter, districtFilter, envData, periodFilter]);

  const filteredWaterData = useMemo(() => {
    return waterData.filter(item => {
      if (districtFilter !== "all" && item.district !== districtFilter) return false;
      if (!isInPeriod(item.processed_at || item.window?.end, periodFilter)) return false;
      if (criticalFilter === "critical" && !isCriticalWater(item)) return false;
      return true;
    });
  }, [criticalFilter, districtFilter, periodFilter, waterData]);

  const filteredTrafficData = useMemo(() => {
    return trafficData.filter(item => {
      if (routeFilter !== "all" && item.route_id !== routeFilter) return false;
      if (!isInPeriod(item.processed_at || item.window?.end, periodFilter)) return false;
      if (criticalFilter === "critical" && !isCriticalTraffic(item)) return false;
      return true;
    });
  }, [criticalFilter, periodFilter, routeFilter, trafficData]);

  const filteredSparkAlerts = useMemo(() => {
    return sparkAlerts.filter(item => {
      if (alertTypeFilter !== "all" && item.alert_type !== alertTypeFilter) return false;
      if (districtFilter !== "all" && item.district && item.district !== districtFilter) return false;
      if (routeFilter !== "all" && item.route_id && item.route_id !== routeFilter) return false;
      if (!isInPeriod(item.timestamp || item.processed_at, periodFilter)) return false;
      if (criticalFilter === "critical" && !isCriticalAlert(item)) return false;
      return true;
    });
  }, [alertTypeFilter, criticalFilter, districtFilter, periodFilter, routeFilter, sparkAlerts]);

  const filteredSparkErrors = useMemo(() => {
    return sparkErrors.filter(item => isInPeriod(item.processed_at, periodFilter));
  }, [periodFilter, sparkErrors]);

  const allWindows = useMemo(
    () => [...filteredEnvData, ...filteredWaterData, ...filteredTrafficData],
    [filteredEnvData, filteredTrafficData, filteredWaterData],
  );

  const averageLatency = useMemo(() => {
    const values = allWindows
      .map(item => getLatencySeconds(item.processed_at, item.window?.end))
      .filter((value): value is number => value !== null);

    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [allWindows]);

  const latestProcessedAt = allWindows
    .map(item => item.processed_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  const tabCounts: Record<SparkTab, number> = {
    environment: filteredEnvData.length,
    water: filteredWaterData.length,
    traffic: filteredTrafficData.length,
    alerts: filteredSparkAlerts.length,
    errors: filteredSparkErrors.length,
  };

  const temperatureChartData = filteredEnvData.map(item => ({
    name: item.district,
    value: Number(item.avg_temperature) || 0,
  }));

  const aqiChartData = filteredEnvData
    .map(item => {
      const value = chartValue(item.max_air_quality);
      return value === null ? null : { name: item.district, value };
    })
    .filter((item): item is { name: string; value: number } => item !== null);

  const congestionChartData = filteredTrafficData.map(item => ({
    name: item.route_id,
    value: Number(item.max_congestion) || 0,
  }));

  const flowChartData = filteredWaterData.map(item => ({
    name: item.district,
    value: Number(item.avg_flow_rate) || 0,
  }));

  const waterScoreChartData = filteredWaterData
    .map(item => {
      const value = chartValue(item.water_quality_score);
      return value === null ? null : { name: item.district, value };
    })
    .filter((item): item is { name: string; value: number } => item !== null);

  const latencyChartData = allWindows
    .map(item => {
      const latency = getLatencySeconds(item.processed_at, item.window?.end);
      return latency === null
        ? null
        : {
            time: formatTime(item.processed_at),
            latency,
          };
    })
    .filter((item): item is { time: string; latency: number } => item !== null)
    .slice(-20);

  const resetFilters = () => {
    setDistrictFilter("all");
    setRouteFilter("all");
    setAlertTypeFilter("all");
    setPeriodFilter("all");
    setCriticalFilter("all");
  };

  return (
    <div className="mx-auto min-h-screen w-full bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/images/logos/spark.png" alt="Spark" width={120} height={120} className="h-20 w-auto" />
          <div>
            <h2 className="text-3xl font-black leading-tight">
              Spark Compute Engine
            </h2>
            <p className="text-slate-500 font-medium">
              Sliding windows, alerts and processing latency
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${connected ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-500 shadow-sm"}`}>
          {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {connected ? "Real-time backend connected" : reconnecting ? `Reconnecting ${reconnectAttempt}` : "Real-time backend offline"}
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Database} label="Loaded windows" value={allWindows.length} tone="bg-green-100 text-green-600" />
        <StatCard icon={Gauge} label="Average latency" value={averageLatency} decimals={1} suffix="s" tone="bg-green-100 text-green-600" />
        <StatCard icon={Bell} label="Spark Alerts" value={sparkAlerts.length} tone="bg-amber-100 text-amber-600" />
        <StatCard icon={AlertTriangle} label="JSON Errors" value={sparkErrors.length} tone="bg-red-100 text-red-600" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-slate-500">
            <Cpu className="h-4 w-4" /> Spark
          </h3>
          <p className="text-lg font-black">{allWindows.length > 0 ? "Active" : "Waiting"}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Last processing: {formatTime(latestProcessedAt)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-slate-500">
            <Server className="h-4 w-4" /> Backend
          </h3>
          <p className="text-lg font-black">{connected ? "Connected" : "Offline"}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {socketError ? `Error: ${socketError}` : "Socket.IO and history API"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-slate-500">
            <Wifi className="h-4 w-4" /> Kafka
          </h3>
          <p className="text-lg font-black">{allWindows.length + sparkAlerts.length + sparkErrors.length > 0 ? "Messages received" : "No messages"}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {eventCount} events, last: {lastEvent || "--"}
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase text-slate-500">
            <Filter className="h-4 w-4" />
            Filtres
          </h3>
          <button
            onClick={resetFilters}
            className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500">District</span>
            <select
              value={districtFilter}
              onChange={event => setDistrictFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
            >
              <option value="all">All districts</option>
              {districtOptions.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500">Route</span>
            <select
              value={routeFilter}
              onChange={event => setRouteFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
            >
              <option value="all">All routes</option>
              {routeOptions.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500">Type d&apos;alerte</span>
            <select
              value={alertTypeFilter}
              onChange={event => setAlertTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
            >
              <option value="all">All types</option>
              {alertTypeOptions.map(alertType => (
                <option key={alertType} value={alertType}>{alertType}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500">Periode</span>
            <select
              value={periodFilter}
              onChange={event => setPeriodFilter(event.target.value as PeriodFilter)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
            >
              {PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500">Criticite</span>
            <select
              value={criticalFilter}
              onChange={event => setCriticalFilter(event.target.value as CriticalFilter)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
            >
              <option value="all">All data</option>
              <option value="critical">Critical only</option>
            </select>
          </label>
        </div>
      </section>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black">Spark Charts</h3>
          <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase text-green-700 ring-1 ring-green-200">
            Recharts
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SparkChartCard title="Average temperature by district">
            <SparkBarChart data={temperatureChartData} xKey="name" yKey="value" color="#22c55e" unit="°C" />
          </SparkChartCard>
          <SparkChartCard title="Max AQI by district">
            <SparkBarChart data={aqiChartData} xKey="name" yKey="value" color="#22c55e" />
          </SparkChartCard>
          <SparkChartCard title="Max congestion by route">
            <SparkBarChart data={congestionChartData} xKey="name" yKey="value" color="#22c55e" />
          </SparkChartCard>
          <SparkChartCard title="Average flow by district">
            <SparkBarChart data={flowChartData} xKey="name" yKey="value" color="#22c55e" />
          </SparkChartCard>
          <SparkChartCard title="Water quality score">
            <SparkBarChart data={waterScoreChartData} xKey="name" yKey="value" color="#22c55e" />
          </SparkChartCard>
          <SparkChartCard title="Spark latency over time">
            <SparkLatencyChart data={latencyChartData} />
          </SparkChartCard>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-black transition-colors ${activeTab === tab.key ? "border-green-200 bg-green-50 text-green-700 shadow-sm" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab.key ? "bg-white text-green-700 border border-green-200 shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                    {tabCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {activeTab === "environment" && <EnvironmentTable data={filteredEnvData} />}
          {activeTab === "water" && <WaterTable data={filteredWaterData} />}
          {activeTab === "traffic" && <TrafficTable data={filteredTrafficData} />}
          {activeTab === "alerts" && <AlertsTable data={filteredSparkAlerts} />}
          {activeTab === "errors" && <ErrorsTable data={filteredSparkErrors} />}
        </div>
      </div>
    </div>
  );
}
