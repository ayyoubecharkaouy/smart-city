"use client";

import { memo } from "react";
import { useSparkData } from "@/hooks/useSparkData";
import { Activity, AlertTriangle, Droplet } from "lucide-react";
import Image from "next/image";
import StateNotice from "./StateNotice";
import AnimatedNumber from "@/components/AnimatedNumber";

function formatTime(value?: string): string {
  if (!value) return "--:--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString("fr-FR", {
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

const SparkInsights = memo(() => {
  const { envData, waterData, trafficData, sparkErrors, sparkAlerts, connected, error } = useSparkData();

  if (envData.length === 0 && waterData.length === 0 && trafficData.length === 0 && sparkErrors.length === 0 && sparkAlerts.length === 0) {
    return (
      <div className="p-4 mt-4">
        {error ? (
          <StateNotice variant="error" message={error} />
        ) : !connected ? (
          <StateNotice
            variant="disconnected"
            message="Le backend temps réel est hors ligne. Les résultats Spark arriveront après reconnexion."
          />
        ) : (
          <StateNotice
            variant="empty"
            title="En attente de Spark Streaming"
            message="Connexion active, mais aucune fenêtre d'agrégation Spark n'a encore été reçue."
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-bold text-gray-800 flex flex-col items-start gap-2">
          <Image src="/images/logos/spark.png" alt="Apache Spark" width={96} height={48} className="h-12 w-auto" />
          <span>Analyses Apache Spark</span>
          <span className={`text-[9px] uppercase ${connected ? "text-emerald-500" : "text-gray-400"}`}>
            {connected ? "Connecté" : "Hors ligne"}
          </span>
        </h3>
      </div>
      
      <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-2">
        Moyennes glissantes (Temps Réel)
      </p>

      {/* Spark Alerts */}
      {sparkAlerts.length > 0 && (
        <div className="rounded-4xl p-3 border border-amber-100 bg-amber-50">
          <h4 className="font-bold text-amber-700 flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3" /> Alertes Spark
          </h4>
          <div className="space-y-2">
            {sparkAlerts.slice(0, 5).map((item, i) => (
              <div key={`${item.processed_at}-${i}`} className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-amber-900">
                    {item.type} / {item.alert_type}
                  </p>
                  <p className="truncate text-[10px] text-amber-700">
                    {item.district || item.route_id || item.sensor_id}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-black text-amber-800">
                  <AnimatedNumber value={item.value} decimals={1} /> {item.operator} <AnimatedNumber value={item.threshold} decimals={1} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spark JSON Errors */}
      {sparkErrors.length > 0 && (
        <div className="rounded-4xl p-3 border border-red-100 bg-red-50">
          <h4 className="font-bold text-red-700 flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3" /> Erreurs JSON Spark
          </h4>
          <div className="space-y-2">
            {sparkErrors.slice(0, 5).map((item, i) => (
              <div key={`${item.processed_at}-${i}`} className="border-b border-red-100 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase text-red-700">
                  <span>{item.stream}</span>
                  <span>{item.error_reason}</span>
                </div>
                <p className="mt-1 max-w-full truncate font-mono text-[10px] text-red-900" title={item.raw_value}>
                  {item.raw_value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traffic Insights */}
      {trafficData.length > 0 && (
        <div className="rounded-4xl p-3">
          <h4 className="font-bold text-gray-600 flex items-center gap-1 mb-2">
            <Activity className="w-3 h-3" /> Trafic
          </h4>
          {trafficData.map((t, i) => (
            <div key={i} className="flex flex-wrap justify-between items-center gap-2 py-1 border-b border-gray-100 last:border-0">
              <span className="truncate w-24 text-gray-700">{t.route_id}</span>
              <span className="font-semibold text-blue-600"><AnimatedNumber value={t.avg_speed || 0} decimals={1} suffix=" km/h" /></span>
              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                Congestion max: <AnimatedNumber value={t.max_congestion || 0} decimals={1} />
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                Véhicules moy.: <AnimatedNumber value={t.avg_vehicle_count || 0} />
              </span>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                Min: <AnimatedNumber value={t.min_speed || 0} decimals={1} suffix=" km/h" />
              </span>
              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                Spark: {formatTime(t.processed_at)}
              </span>
              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                Latence: {getLatencySeconds(t.processed_at, t.window?.end) === null ? "--" : <AnimatedNumber value={getLatencySeconds(t.processed_at, t.window?.end)} decimals={1} suffix="s" />}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Environment Insights */}
      {envData.length > 0 && (
        <div className="rounded-4xl p-3">
          <h4 className="font-bold text-gray-600 flex items-center gap-1 mb-2">
            <Activity className="w-3 h-3" /> Environnement
          </h4>
          {envData.map((e, i) => (
            <div key={i} className="flex flex-wrap justify-between items-center gap-2 py-1 border-b border-gray-100 last:border-0">
              <span className="truncate w-24 text-gray-700">{e.district}</span>
              <span className="font-semibold text-orange-500"><AnimatedNumber value={e.avg_temperature || 0} decimals={1} suffix="°C" /></span>
              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                AQI: <AnimatedNumber value={e.avg_air_quality || 0} />
              </span>
              <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                <AnimatedNumber value={e.min_temperature || 0} decimals={1} />-<AnimatedNumber value={e.max_temperature || 0} decimals={1} suffix="°C" />
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {e.temperature_trend || "stable"}
              </span>
              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                Spark: {formatTime(e.processed_at)}
              </span>
              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                Latence: {getLatencySeconds(e.processed_at, e.window?.end) === null ? "--" : <AnimatedNumber value={getLatencySeconds(e.processed_at, e.window?.end)} decimals={1} suffix="s" />}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Water Insights */}
      {waterData.length > 0 && (
        <div className="rounded-4xl p-3">
          <h4 className="font-bold text-gray-600 flex items-center gap-1 mb-2">
            <Droplet className="w-3 h-3" /> Eau
          </h4>
          {waterData.map((w, i) => (
            <div key={i} className="flex flex-wrap justify-between items-center gap-2 py-1 border-b border-gray-100 last:border-0">
              <span className="truncate w-24 text-gray-700">{w.district}</span>
              <span className="font-semibold text-blue-500"><AnimatedNumber value={w.avg_flow_rate || 0} decimals={1} suffix=" L/m" /></span>
              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                pH: <AnimatedNumber value={w.avg_ph || 0} decimals={1} />
              </span>
              <span className="text-[9px] bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded">
                Total: <AnimatedNumber value={w.total_flow_rate || 0} decimals={1} />
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.sudden_flow_drop ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                Score: <AnimatedNumber value={w.water_quality_score || 0} />
              </span>
              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                Spark: {formatTime(w.processed_at)}
              </span>
              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                Latence: {getLatencySeconds(w.processed_at, w.window?.end) === null ? "--" : <AnimatedNumber value={getLatencySeconds(w.processed_at, w.window?.end)} decimals={1} suffix="s" />}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

SparkInsights.displayName = "SparkInsights";

export default SparkInsights;
