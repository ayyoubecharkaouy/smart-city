"use client";

import { useMemo, useState } from "react";
import { useSparkData } from "@/hooks/useSparkData";
import { useTemperatureData } from "@/hooks/useTemperatureData";
import AnimatedNumber from "@/components/AnimatedNumber";
import {
  PERIOD_OPTIONS,
  PERIOD_HOURS,
  SPARK_ALERT_LABELS,
  SPARK_DOMAIN_LABELS,
} from "@/lib/constants";
import type { SparkAlertData } from "@/lib/types";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Droplet,
  Factory,
  Filter,
  MapPin,
  RotateCcw,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";

type AlertDomain = "all" | "environment" | "traffic" | "water";
type PeriodFilter = "all" | keyof typeof PERIOD_HOURS;
type CriticalFilter = "all" | "critical";

const domainOptions: { value: AlertDomain; label: string }[] = [
  { value: "all", label: "All" },
  { value: "environment", label: "Pollution" },
  { value: "traffic", label: "Congestion" },
  { value: "water", label: "Water" },
];

function getSparkAlertLabel(alert: SparkAlertData): string {
  return SPARK_ALERT_LABELS[alert.alert_type] || alert.alert_type;
}

function getDomainIcon(type: string) {
  if (type === "water") return Droplet;
  if (type === "traffic") return Activity;
  return Factory;
}

function getDomainLabel(type: string): string {
  return SPARK_DOMAIN_LABELS[type] || type;
}

function formatDate(value?: string): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function isInPeriod(value: string | undefined, period: PeriodFilter): boolean {
  if (period === "all") return true;
  if (!value) return false;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;

  return Date.now() - time <= PERIOD_HOURS[period] * 60 * 60 * 1000;
}

function isCriticalSparkAlert(alert: SparkAlertData): boolean {
  return alert.severity === "critical" || alert.severity === "high";
}

export default function AlertsPage() {
  const [domainFilter, setDomainFilter] = useState<AlertDomain>("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [criticalFilter, setCriticalFilter] = useState<CriticalFilter>("all");
  const { alerts, acknowledgeAlert } = useTemperatureData();
  const { sparkAlerts, connected, reconnecting, reconnectAttempt, lastEvent, eventCount, error } = useSparkData();

  const districtOptions = useMemo(() => {
    const districts = [
      ...sparkAlerts.map(alert => alert.district),
      ...alerts.map(alert => alert.district),
    ].filter((district): district is string => Boolean(district));
    return Array.from(new Set(districts.sort()));
  }, [alerts, sparkAlerts]);

  const routeOptions = useMemo(() => {
    const routes = sparkAlerts
      .map(alert => alert.route_id)
      .filter((route): route is string => Boolean(route));
    return Array.from(new Set(routes.sort()));
  }, [sparkAlerts]);

  const alertTypeOptions = useMemo(() => {
    const alertTypes = sparkAlerts
      .map(alert => alert.alert_type)
      .filter(Boolean);
    return Array.from(new Set(alertTypes.sort()));
  }, [sparkAlerts]);

  const filteredSparkAlerts = useMemo(() => {
    return sparkAlerts.filter(alert => {
      if (domainFilter !== "all" && alert.type !== domainFilter) return false;
      if (districtFilter !== "all" && alert.district !== districtFilter) return false;
      if (routeFilter !== "all" && alert.route_id !== routeFilter) return false;
      if (alertTypeFilter !== "all" && alert.alert_type !== alertTypeFilter) return false;
      if (!isInPeriod(alert.timestamp || alert.processed_at, periodFilter)) return false;
      if (criticalFilter === "critical" && !isCriticalSparkAlert(alert)) return false;
      return true;
    });
  }, [alertTypeFilter, criticalFilter, districtFilter, domainFilter, periodFilter, routeFilter, sparkAlerts]);

  const filteredTemperatureAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (districtFilter !== "all" && alert.district !== districtFilter) return false;
      if (!isInPeriod(alert.timestamp, periodFilter)) return false;
      if (criticalFilter === "critical" && alert.acknowledged) return false;
      return true;
    });
  }, [alerts, criticalFilter, districtFilter, periodFilter]);

  const domainCounts = useMemo(() => {
    return sparkAlerts.reduce<Record<AlertDomain, number>>(
      (acc, alert) => {
        acc.all += 1;
        if (alert.type === "environment" || alert.type === "traffic" || alert.type === "water") {
          acc[alert.type] += 1;
        }
        return acc;
      },
      { all: 0, environment: 0, traffic: 0, water: 0 },
    );
  }, [sparkAlerts]);

  const resetFilters = () => {
    setDomainFilter("all");
    setDistrictFilter("all");
    setRouteFilter("all");
    setAlertTypeFilter("all");
    setPeriodFilter("all");
    setCriticalFilter("all");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 p-8 text-slate-800">
      <header className="flex flex-col gap-4 mb-10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">
            Alert Center
          </h2>
          <p className="text-slate-500 font-medium">
            Real-time Spark alerts, critical thresholds and sensor incidents
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-sm ${connected ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-500"}`}>
          {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {connected ? (
            <>
              Socket connected · <AnimatedNumber value={eventCount} /> events · {lastEvent || "--"}
            </>
          ) : reconnecting ? (
            <>Reconnecting <AnimatedNumber value={reconnectAttempt} /></>
          ) : "Socket offline"}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                Spark Alerts
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                {domainOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setDomainFilter(option.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition-colors shadow-sm ${domainFilter === option.value ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-600 hover:border-green-400 hover:bg-slate-50 hover:text-green-600"}`}
                  >
                    {option.label} (<AnimatedNumber value={domainCounts[option.value]} />)
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase text-slate-800">
                  <Filter className="h-4 w-4" />
                  Filtres
                </h4>
                <button
                  onClick={resetFilters}
                  className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition-colors shadow-sm hover:border-green-400 hover:text-green-600"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
                  >
                    <option value="all">All routes</option>
                    {routeOptions.map(route => (
                      <option key={route} value={route}>{route}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Alert Type</span>
                  <select
                    value={alertTypeFilter}
                    onChange={event => setAlertTypeFilter(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
                  >
                    <option value="all">All types</option>
                    {alertTypeOptions.map(alertType => (
                      <option key={alertType} value={alertType}>{alertType}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Period</span>
                  <select
                    value={periodFilter}
                    onChange={event => setPeriodFilter(event.target.value as PeriodFilter)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
                  >
                    {PERIOD_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Criticality</span>
                  <select
                    value={criticalFilter}
                    onChange={event => setCriticalFilter(event.target.value as CriticalFilter)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-green-400 focus:bg-white"
                  >
                    <option value="all">All alerts</option>
                    <option value="critical">Critical only</option>
                  </select>
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600 shadow-sm">
                {error}
              </div>
            )}

            {filteredSparkAlerts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">
                  No Spark alerts
                </h4>
                <p className="text-slate-500">
                  Pollution, congestion and water alerts will appear here as soon as Spark detects a threshold breach.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSparkAlerts.map((alert, index) => {
                  const Icon = getDomainIcon(alert.type);
                  const location = alert.district || alert.route_id || alert.sensor_id || "Unknown source";
                  return (
                    <div
                      key={`${alert.processed_at}-${alert.type}-${index}`}
                      className="rounded-3xl border border-slate-200 bg-white p-5 transition-colors shadow-sm hover:border-green-400"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-green-100 p-3">
                            <Icon className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-bold text-slate-800">
                                {getSparkAlertLabel(alert)}
                              </h4>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase text-slate-600">
                                {getDomainLabel(alert.type)}
                              </span>
                              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-black uppercase text-green-700">
                                {alert.severity}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(alert.timestamp || alert.processed_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bell className="w-4 h-4" />
                                Spark: {formatDate(alert.processed_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-right">
                          <p className="text-[10px] font-black uppercase text-green-700">
                            Value / Threshold
                          </p>
                          <p className="text-lg font-black text-green-700">
                            <AnimatedNumber value={alert.value} decimals={1} /> {alert.operator} <AnimatedNumber value={alert.threshold} decimals={1} />
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              Temperature Alerts
            </h3>

            {filteredTemperatureAlerts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="font-bold text-slate-800">No temperature alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemperatureAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-3xl bg-white p-5 border transition-all shadow-sm ${alert.acknowledged ? "border-slate-200 opacity-60" : "border-green-400 shadow-md"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-2xl ${alert.acknowledged ? "bg-slate-100" : "bg-green-100"}`}>
                          <ShieldAlert className={`w-6 h-6 ${alert.acknowledged ? "text-slate-400" : "text-green-600"}`} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800">
                            Critical temperature: <AnimatedNumber value={alert.temperature} decimals={1} suffix="°C" />
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {alert.district}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(alert.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-green-500 text-white shadow-sm font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-600 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              Spark Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.all} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Pollution</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.environment} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Congestion</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.traffic} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Water</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.water} /></span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-green-600" />
              Severity
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Spark alerts are generated from thresholds configured in the streaming pipeline and are updated in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}