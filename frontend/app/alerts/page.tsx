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
  { value: "all", label: "Toutes" },
  { value: "environment", label: "Pollution" },
  { value: "traffic", label: "Congestion" },
  { value: "water", label: "Eau" },
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
  return date.toLocaleString("fr-FR", {
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
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Centre d&apos;Alertes
          </h2>
          <p className="text-gray-500 font-medium">
            Alertes Spark temps reel, seuils critiques et incidents capteurs
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${connected ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>
          {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {connected ? (
            <>
              Socket connecte · <AnimatedNumber value={eventCount} /> evenements · {lastEvent || "--"}
            </>
          ) : reconnecting ? (
            <>Reconnexion <AnimatedNumber value={reconnectAttempt} /></>
          ) : "Socket hors ligne"}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Alertes Spark
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                {domainOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setDomainFilter(option.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition-colors ${domainFilter === option.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    {option.label} (<AnimatedNumber value={domainCounts[option.value]} />)
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase text-gray-500">
                  <Filter className="h-4 w-4" />
                  Filtres
                </h4>
                <button
                  onClick={resetFilters}
                  className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reinitialiser
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-400">District</span>
                  <select
                    value={districtFilter}
                    onChange={event => setDistrictFilter(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-gray-900"
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
                    onChange={event => setRouteFilter(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-gray-900"
                  >
                    <option value="all">Toutes les routes</option>
                    {routeOptions.map(route => (
                      <option key={route} value={route}>{route}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-400">Type d&apos;alerte</span>
                  <select
                    value={alertTypeFilter}
                    onChange={event => setAlertTypeFilter(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-gray-900"
                  >
                    <option value="all">Tous les types</option>
                    {alertTypeOptions.map(alertType => (
                      <option key={alertType} value={alertType}>{alertType}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-400">Periode</span>
                  <select
                    value={periodFilter}
                    onChange={event => setPeriodFilter(event.target.value as PeriodFilter)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-gray-900"
                  >
                    {PERIOD_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-400">Criticite</span>
                  <select
                    value={criticalFilter}
                    onChange={event => setCriticalFilter(event.target.value as CriticalFilter)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-gray-900"
                  >
                    <option value="all">Toutes les alertes</option>
                    <option value="critical">Critiques seulement</option>
                  </select>
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            {filteredSparkAlerts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Aucune alerte Spark
                </h4>
                <p className="text-gray-500">
                  Les alertes pollution, congestion et eau apparaitront ici des que Spark detecte un depassement.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSparkAlerts.map((alert, index) => {
                  const Icon = getDomainIcon(alert.type);
                  const location = alert.district || alert.route_id || alert.sensor_id || "Source inconnue";
                  return (
                    <div
                      key={`${alert.processed_at}-${alert.type}-${index}`}
                      className="bg-white p-5 rounded-3xl border border-amber-100"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-2xl bg-amber-50">
                            <Icon className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-bold text-gray-900">
                                {getSparkAlertLabel(alert)}
                              </h4>
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-600">
                                {getDomainLabel(alert.type)}
                              </span>
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700">
                                {alert.severity}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium">
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
                        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
                          <p className="text-[10px] font-black uppercase text-amber-600">
                            Valeur / seuil
                          </p>
                          <p className="text-lg font-black text-amber-900">
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
            <h3 className="text-lg font-bold text-gray-900">
              Alertes Temperature
            </h3>

            {filteredTemperatureAlerts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-gray-900">Aucune alerte temperature</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemperatureAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-white p-5 rounded-3xl border transition-all ${alert.acknowledged ? "border-gray-100 opacity-60" : "border-rose-100"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-2xl ${alert.acknowledged ? "bg-gray-100" : "bg-rose-50"}`}>
                          <ShieldAlert className={`w-6 h-6 ${alert.acknowledged ? "text-gray-400" : "text-rose-600"}`} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            Temperature critique : <AnimatedNumber value={alert.temperature} decimals={1} suffix="°C" />
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400 font-medium">
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
                          className="bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-rose-700 transition-colors"
                        >
                          Acquitter
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
          <div className="bg-gray-900 rounded-3xl p-8 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Resume Spark
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400">Total</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.all} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400">Pollution</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.environment} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400">Congestion</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.traffic} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400">Eau</span>
                <span className="text-xl font-black"><AnimatedNumber value={domainCounts.water} /></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Severite
            </h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Les alertes Spark sont generees depuis les seuils configures dans le pipeline de streaming et sont mises a jour en temps reel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
