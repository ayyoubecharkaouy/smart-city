"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getSocket } from "@/lib/socket";
import type { TrafficReading, RouteTrafficStats, TrafficStatus } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function dominantStatus(statuses: TrafficStatus[]): TrafficStatus {
  const order: TrafficStatus[] = ["forte_congestion", "congestion", "dense", "fluide"];
  const counts = new Map<TrafficStatus, number>();
  statuses.forEach(s => counts.set(s, (counts.get(s) || 0) + 1));
  let best: TrafficStatus = "fluide";
  let bestCount = 0;
  for (const status of order) {
    const c = counts.get(status) || 0;
    if (c > bestCount) { best = status; bestCount = c; }
  }
  return best;
}

function buildRouteStats(readings: TrafficReading[]): Map<string, RouteTrafficStats> {
  const byRoute = new Map<string, TrafficReading[]>();
  readings.forEach(r => {
    const arr = byRoute.get(r.route_id) || [];
    arr.push(r);
    byRoute.set(r.route_id, arr);
  });

  const stats = new Map<string, RouteTrafficStats>();
  byRoute.forEach((items, routeId) => {
    const n = items.length;
    stats.set(routeId, {
      route_id: routeId,
      avg_speed: items.reduce((s, r) => s + r.average_speed_kmh, 0) / n,
      avg_occupancy: items.reduce((s, r) => s + r.occupancy_rate, 0) / n,
      avg_congestion: items.reduce((s, r) => s + r.congestion_index, 0) / n,
      total_vehicles: items.reduce((s, r) => s + r.vehicle_count, 0),
      sensor_count: n,
      last_update: items.reduce((latest, r) =>
        new Date(r.timestamp) > new Date(latest) ? r.timestamp : latest, items[0].timestamp),
      dominant_status: dominantStatus(items.map(r => r.traffic_status)),
    });
  });
  return stats;
}

export function useTrafficData(enabled: boolean = true) {
  const [latestReadings, setLatestReadings] = useState<TrafficReading[]>([]);
  const [history, setHistory] = useState<{ time: string; avg_speed: number; avg_congestion: number; total_vehicles: number }[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(enabled);

  const fetchInitialData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/traffic/latest`),
        fetch(`${BACKEND_URL}/api/traffic/history`),
      ]);

      if (!latestRes.ok || !historyRes.ok) throw new Error("Fetch error");

      const rawData: TrafficReading[] = await latestRes.json();
      const historyData = await historyRes.json();
      setHistory(historyData);

      // Keep latest per sensor
      const latestMap = new Map<string, TrafficReading>();
      rawData.forEach(r => {
        const existing = latestMap.get(r.sensor_id);
        if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
          latestMap.set(r.sensor_id, r);
        }
      });
      const latest = Array.from(latestMap.values());
      setLatestReadings(latest);
    } catch (err) {
      console.error("[useTrafficData] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    fetchInitialData();
    const socket = getSocket();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("traffic:new", (payload: TrafficReading | TrafficReading[]) => {
      const readings = Array.isArray(payload) ? payload : [payload];
      setLatestReadings(prev => {
        const updated = [...prev];
        readings.forEach(r => {
          const idx = updated.findIndex(e => e.sensor_id === r.sensor_id);
          if (idx >= 0) updated[idx] = r;
          else updated.unshift(r);
        });
        return updated;
      });
    });

    return () => {
      socket.off("traffic:new");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [fetchInitialData, enabled]);

  const routeStats = useMemo(() => buildRouteStats(latestReadings), [latestReadings]);

  return { latestReadings, routeStats, history, connected, loading };
}
