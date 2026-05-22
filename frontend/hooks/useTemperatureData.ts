"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getSocket } from "@/lib/socket";
import type {
  TemperatureReading,
  DistrictTemperature,
  TemperatureAlert,
} from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export interface UseTemperatureDataReturn {
  /** Latest readings per sensor */
  latestReadings: TemperatureReading[];
  /** Aggregated stats per district */
  districtStats: Map<string, DistrictTemperature>;
  /** Alerts (temp >= 35°C) */
  alerts: TemperatureAlert[];
  /** Whether the Socket.IO connection is live */
  connected: boolean;
  /** Loading state for initial fetch */
  loading: boolean;
  /** Any error message */
  error: string | null;
  /** Historical data for the last 24h */
  history: { time: string; temperature: number; aqi: number }[];
  /** Dismiss an alert */
  acknowledgeAlert: (id: string) => void;
}

export function useTemperatureData(enabled: boolean = true): UseTemperatureDataReturn {
  const [latestReadings, setLatestReadings] = useState<TemperatureReading[]>([]);
  const [alerts, setAlerts] = useState<TemperatureAlert[]>([]);
  const [history, setHistory] = useState<{ time: string; temperature: number; aqi: number }[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(enabled); // Only loading if enabled
  const [error, setError] = useState<string | null>(null);
  const alertIdCounter = useRef(0);

  const fetchInitialData = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [latestRes, avgRes, historyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/temperatures/latest`, { signal }),
        fetch(`${BACKEND_URL}/api/temperatures/avg-by-district`, { signal }),
        fetch(`${BACKEND_URL}/api/temperatures/history`, { signal }),
      ]);

      if (!latestRes.ok || !avgRes.ok || !historyRes.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const rawData: TemperatureReading[] = await latestRes.json();
      const historyData = await historyRes.json();
      if (signal?.aborted) return;

      setHistory(Array.isArray(historyData) ? historyData : []);
      
      const latestDataMap = new Map<string, TemperatureReading>();
      const validRawData = Array.isArray(rawData)
        ? rawData.filter(
            (r) =>
              r?.sensor_id &&
              r?.district &&
              Number.isFinite(Number(r.temperature)) &&
              r?.timestamp,
          )
        : [];

      validRawData.forEach(r => {
        const existing = latestDataMap.get(r.sensor_id);
        if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
          latestDataMap.set(r.sensor_id, r);
        }
      });
      const latestData = Array.from(latestDataMap.values());
      setLatestReadings(latestData);

      const initialAlerts: TemperatureAlert[] = latestData
        .filter((r) => r.temperature >= 35)
        .map((r) => ({
          id: `initial-${alertIdCounter.current++}`,
          sensor_id: r.sensor_id,
          district: r.district,
          temperature: r.temperature,
          timestamp: r.timestamp,
          acknowledged: false,
        }));
      setAlerts(initialAlerts);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      console.error("[useTemperatureData] Fetch error:", msg);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const fetchTimeout = window.setTimeout(() => {
      void fetchInitialData(controller.signal);
    }, 0);
    const socket = getSocket();
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleTemperatureNew = (payload: TemperatureReading | TemperatureReading[]) => {
      const readings = Array.isArray(payload) ? payload : [payload];
      const validReadings = readings.filter(
        (r) =>
          r?.sensor_id &&
          r?.district &&
          Number.isFinite(Number(r.temperature)) &&
          r?.timestamp,
      );
      if (validReadings.length === 0) return;

      setLatestReadings((prev) => {
        const updatedReadings = [...prev];
        validReadings.forEach(reading => {
          const idx = updatedReadings.findIndex((r) => r.sensor_id === reading.sensor_id);
          if (idx >= 0) updatedReadings[idx] = reading;
          else updatedReadings.unshift(reading);
        });
        return updatedReadings;
      });

      const newAlerts: TemperatureAlert[] = [];
      validReadings.forEach(reading => {
        const temp = Number(reading.temperature);
        if (temp >= 35) {
          newAlerts.push({
            id: `rt-${alertIdCounter.current++}`,
            sensor_id: reading.sensor_id,
            district: reading.district,
            temperature: temp,
            timestamp: reading.timestamp,
            acknowledged: false,
          });
        }
      });
      if (newAlerts.length > 0) setAlerts((prev) => [...newAlerts, ...prev].slice(0, 100));
    };

    const handleTemperatureAlert = (alertData: Omit<TemperatureAlert, "id" | "acknowledged">) => {
      if (
        !alertData?.sensor_id ||
        !alertData?.district ||
        !Number.isFinite(Number(alertData.temperature))
      ) {
        return;
      }

      const newAlert: TemperatureAlert = {
        ...alertData,
        id: `be-${alertIdCounter.current++}`,
        acknowledged: false,
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 100));
    };

    const connectedTimeout = window.setTimeout(() => {
      setConnected(socket.connected);
    }, 0);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("temperature:new", handleTemperatureNew);
    socket.on("temperature:alert", handleTemperatureAlert);

    return () => {
      controller.abort();
      socket.off("temperature:new", handleTemperatureNew);
      socket.off("temperature:alert", handleTemperatureAlert);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      window.clearTimeout(fetchTimeout);
      window.clearTimeout(connectedTimeout);
    };
  }, [fetchInitialData, enabled]);

  const districtStats = useMemo(() => {
    const statsMap = new Map<string, DistrictTemperature>();
    latestReadings.forEach((r) => {
      if (!r.district) return;
      const existing = statsMap.get(r.district);
      const rTemp = Number(r.temperature);
      const rawAqi = Number(r.air_quality?.aqi);
      const rAqi = Number.isFinite(rawAqi) ? rawAqi : undefined;

      if (existing) {
        const nextCount = existing.sensor_count + 1;
        const nextAqi =
          rAqi !== undefined
            ? ((existing.avg_aqi || 0) * existing.sensor_count + rAqi) /
              nextCount
            : existing.avg_aqi;

        statsMap.set(r.district, {
          ...existing,
          avg_temperature:
            (existing.avg_temperature * existing.sensor_count + rTemp) /
            nextCount,
          min_temperature: Math.min(existing.min_temperature, rTemp),
          max_temperature: Math.max(existing.max_temperature, rTemp),
          avg_aqi: nextAqi,
          sensor_count: nextCount,
          last_update:
            r.timestamp > existing.last_update
              ? r.timestamp
              : existing.last_update,
        });
      } else {
        statsMap.set(r.district, {
          district: r.district,
          avg_temperature: rTemp,
          min_temperature: rTemp,
          max_temperature: rTemp,
          avg_aqi: rAqi,
          sensor_count: 1,
          last_update: r.timestamp,
        });
      }
    });
    return statsMap;
  }, [latestReadings]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }, []);

  return { latestReadings, districtStats, alerts, connected, loading, error, history, acknowledgeAlert };
}
