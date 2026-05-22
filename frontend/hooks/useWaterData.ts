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

  const fetchInitialData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [latestRes, statsRes, historyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/water/latest`),
        fetch(`${BACKEND_URL}/api/water/stats-by-district`),
        fetch(`${BACKEND_URL}/api/water/history`),
      ]);

      if (!latestRes.ok || !statsRes.ok || !historyRes.ok) {
        throw new Error("Erreur lors de la récupération des données eau");
      }

      const rawData: WaterReading[] = await latestRes.json();
      const historyData = await historyRes.json();
      setHistory(historyData);
      
      const latestMap = new Map<string, WaterReading>();
      rawData.forEach(r => {
        const existing = latestMap.get(r.sensor_id);
        if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
          latestMap.set(r.sensor_id, r);
        }
      });
      const latest = Array.from(latestMap.values());
      setLatestReadings(latest);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      console.error("[useWaterData] Error:", msg);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const fetchTimeout = window.setTimeout(() => {
      void fetchInitialData();
    }, 0);
    const socket = getSocket();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("water:new", (payload: WaterReading | WaterReading[]) => {
      const readings = Array.isArray(payload) ? payload : [payload];
      setLatestReadings(prev => {
        const updated = [...prev];
        readings.forEach(r => {
          const idx = updated.findIndex(existing => existing.sensor_id === r.sensor_id);
          if (idx >= 0) updated[idx] = r;
          else updated.unshift(r);
        });
        return updated;
      });
    });

    return () => {
      socket.off("water:new");
      socket.off("connect");
      socket.off("disconnect");
      window.clearTimeout(fetchTimeout);
    };
  }, [fetchInitialData, enabled]);

  const districtStats = useMemo(() => {
    const statsMap = new Map<string, DistrictWater>();
    latestReadings.forEach((r) => {
      if (!r.district) return;
      const existing = statsMap.get(r.district);
      const flow = r.water_flow?.flow_rate_l_min || 0;
      const vol = r.water_flow?.volume_l || 0;
      const ph = r.water_quality?.ph || 7;

      if (existing) {
        const count = existing.sensor_count + 1;
        statsMap.set(r.district, {
          ...existing,
          avg_flow: (existing.avg_flow * existing.sensor_count + flow) / count,
          total_volume: existing.total_volume + vol,
          avg_ph: (existing.avg_ph * existing.sensor_count + ph) / count,
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
          avg_turbidity: r.water_quality?.turbidity_ntu || 0,
          sensor_count: 1,
          last_update: r.timestamp,
        });
      }
    });
    return statsMap;
  }, [latestReadings]);

  return { latestReadings, districtStats, history, connected, loading, error };
}
