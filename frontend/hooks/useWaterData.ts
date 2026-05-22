"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getSocket } from "@/lib/socket";
import type { WaterReading, DistrictWater } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export function useWaterData(enabled: boolean = true) {
  const [latestReadings, setLatestReadings] = useState<WaterReading[]>([]);
  const [history, setHistory] = useState<{ time: string; flow: number }[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [latestRes, statsRes, historyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/water/latest`, { signal }),
        fetch(`${BACKEND_URL}/api/water/stats-by-district`, { signal }),
        fetch(`${BACKEND_URL}/api/water/history`, { signal }),
      ]);

      if (!latestRes.ok || !statsRes.ok || !historyRes.ok) {
        throw new Error("Erreur lors de la récupération des données eau");
      }

      const rawData: WaterReading[] = await latestRes.json();
      const historyData = await historyRes.json();
      if (signal?.aborted) return;

      setHistory(Array.isArray(historyData) ? historyData : []);
      
      const latestMap = new Map<string, WaterReading>();
      const validRawData = Array.isArray(rawData)
        ? rawData.filter((r) => r?.sensor_id && r?.district && r?.timestamp)
        : [];

      validRawData.forEach(r => {
        const existing = latestMap.get(r.sensor_id);
        if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
          latestMap.set(r.sensor_id, r);
        }
      });
      const latest = Array.from(latestMap.values());
      setLatestReadings(latest);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      console.error("[useWaterData] Error:", msg);
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

    const handleWaterNew = (payload: WaterReading | WaterReading[]) => {
      const readings = Array.isArray(payload) ? payload : [payload];
      const validReadings = readings.filter(
        (r) => r?.sensor_id && r?.district && r?.timestamp,
      );
      if (validReadings.length === 0) return;

      setLatestReadings(prev => {
        const updated = [...prev];
        validReadings.forEach(r => {
          const idx = updated.findIndex(existing => existing.sensor_id === r.sensor_id);
          if (idx >= 0) updated[idx] = r;
          else updated.unshift(r);
        });
        return updated;
      });
    };

    const connectedTimeout = window.setTimeout(() => {
      setConnected(socket.connected);
    }, 0);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("water:new", handleWaterNew);

    return () => {
      controller.abort();
      socket.off("water:new", handleWaterNew);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      window.clearTimeout(fetchTimeout);
      window.clearTimeout(connectedTimeout);
    };
  }, [fetchInitialData, enabled]);

  const districtStats = useMemo(() => {
    const statsMap = new Map<string, DistrictWater>();
    latestReadings.forEach((r) => {
      if (!r.district) return;
      const existing = statsMap.get(r.district);
      const flow = Number(r.water_flow?.flow_rate_l_min) || 0;
      const vol = Number(r.water_flow?.volume_l) || 0;
      const ph = Number(r.water_quality?.ph) || 7;
      const turbidity = Number(r.water_quality?.turbidity_ntu) || 0;

      if (existing) {
        const count = existing.sensor_count + 1;
        statsMap.set(r.district, {
          ...existing,
          avg_flow: (existing.avg_flow * existing.sensor_count + flow) / count,
          total_volume: existing.total_volume + vol,
          avg_ph: (existing.avg_ph * existing.sensor_count + ph) / count,
          avg_turbidity:
            (existing.avg_turbidity * existing.sensor_count + turbidity) /
            count,
          sensor_count: count,
          last_update:
            r.timestamp > existing.last_update
              ? r.timestamp
              : existing.last_update,
        });
      } else {
        statsMap.set(r.district, {
          district: r.district,
          avg_flow: flow,
          total_volume: vol,
          avg_ph: ph,
          avg_turbidity: turbidity,
          sensor_count: 1,
          last_update: r.timestamp,
        });
      }
    });
    return statsMap;
  }, [latestReadings]);

  return { latestReadings, districtStats, history, connected, loading, error };
}
