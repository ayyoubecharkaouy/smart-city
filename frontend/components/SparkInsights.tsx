"use client";

import { memo, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Activity, Droplet } from "lucide-react";
import Image from "next/image";
import StateNotice from "./StateNotice";

interface SparkEnvironmentData {
  district: string;
  avg_temperature: number;
  avg_air_quality: number;
  window: { start: string; end: string };
}

interface SparkWaterData {
  district: string;
  avg_flow_rate: number;
  avg_ph: number;
  avg_turbidity: number;
  window: { start: string; end: string };
}

interface SparkTrafficData {
  route_id: string;
  avg_speed: number;
  max_congestion: number;
  window: { start: string; end: string };
}

function parseSparkPayload<T>(payload: unknown): T | null {
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  }
  return payload as T;
}

const SparkInsights = memo(() => {
  const [envData, setEnvData] = useState<SparkEnvironmentData[]>([]);
  const [waterData, setWaterData] = useState<SparkWaterData[]>([]);
  const [trafficData, setTrafficData] = useState<SparkTrafficData[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Impossible de joindre le backend Socket.IO");
    });

    socket.on("spark:environment", (payload: unknown) => {
      const data = parseSparkPayload<SparkEnvironmentData>(payload);
      if (!data) return;
      setEnvData(prev => {
        const newData = [...prev];
        const idx = newData.findIndex(d => d.district === data.district);
        if (idx >= 0) newData[idx] = data;
        else newData.push(data);
        return newData;
      });
    });

    socket.on("spark:water", (payload: unknown) => {
      const data = parseSparkPayload<SparkWaterData>(payload);
      if (!data) return;
      setWaterData(prev => {
        const newData = [...prev];
        const idx = newData.findIndex(d => d.district === data.district);
        if (idx >= 0) newData[idx] = data;
        else newData.push(data);
        return newData;
      });
    });

    socket.on("spark:traffic", (payload: unknown) => {
      const data = parseSparkPayload<SparkTrafficData>(payload);
      if (!data) return;
      setTrafficData(prev => {
        const newData = [...prev];
        const idx = newData.findIndex(d => d.route_id === data.route_id);
        if (idx >= 0) newData[idx] = data;
        else newData.push(data);
        return newData;
      });
    });

    return () => {
      socket.off("spark:environment");
      socket.off("spark:water");
      socket.off("spark:traffic");
      socket.off("connect_error");
    };
  }, []);

  if (envData.length === 0 && waterData.length === 0 && trafficData.length === 0) {
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

      {/* Traffic Insights */}
      {trafficData.length > 0 && (
        <div className="rounded-4xl p-3">
          <h4 className="font-bold text-gray-600 flex items-center gap-1 mb-2">
            <Activity className="w-3 h-3" /> Trafic
          </h4>
          {trafficData.map((t, i) => (
            <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
              <span className="truncate w-24 text-gray-700">{t.route_id}</span>
              <span className="font-semibold text-blue-600">{t.avg_speed ? t.avg_speed.toFixed(1) : 0} km/h</span>
              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                Congestion max: {t.max_congestion ? t.max_congestion.toFixed(1) : 0}
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
            <div key={i} className="flex justify-between items-center  py-1 border-b border-gray-100 last:border-0">
              <span className="truncate w-24 text-gray-700">{e.district}</span>
              <span className="font-semibold text-orange-500">{e.avg_temperature ? e.avg_temperature.toFixed(1) : 0}°C</span>
              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                AQI: {e.avg_air_quality ? e.avg_air_quality.toFixed(0) : 0}
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
            <div key={i} className="flex justify-between items-center  py-1 border-b border-gray-100 last:border-0">
              <span className="truncate w-24 text-gray-700">{w.district}</span>
              <span className="font-semibold text-blue-500">{w.avg_flow_rate ? w.avg_flow_rate.toFixed(1) : 0} L/m</span>
              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                pH: {w.avg_ph ? w.avg_ph.toFixed(1) : 0}
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
