"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getSocket } from "@/lib/socket";
import { API_ROUTES, BACKEND_URL, SOCKET_EVENTS } from "@/lib/constants";
import type { TrafficReading, RouteTrafficStats, TrafficStatus } from "@/lib/types";

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
    if (!r.route_id) return;
    const arr = byRoute.get(r.route_id) || [];
    arr.push(r);
    byRoute.set(r.route_id, arr);
  });

  const stats = new Map<string, RouteTrafficStats>();
  byRoute.forEach((items, routeId) => {
    const n = items.length;
    if (n === 0) return;

    stats.set(routeId, {
      route_id: routeId,
      avg_speed: items.reduce((s, r) => s + (Number(r.average_speed_kmh) || 0), 0) / n,
      avg_occupancy: items.reduce((s, r) => s + (Number(r.occupancy_rate) || 0), 0) / n,
      avg_congestion: items.reduce((s, r) => s + (Number(r.congestion_index) || 0), 0) / n,
      total_vehicles: items.reduce((s, r) => s + (Number(r.vehicle_count) || 0), 0),
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
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch(`${BACKEND_URL}${API_ROUTES.trafficLatest}`, { signal }),
        fetch(`${BACKEND_URL}${API_ROUTES.trafficHistory}`, { signal }),
      ]);

      if (!latestRes.ok || !historyRes.ok) {
        throw new Error("Erreur lors de la récupération des données trafic");
      }

      const rawData: TrafficReading[] = await latestRes.json();
      const historyData = await historyRes.json();
      if (signal?.aborted) return;

      setHistory(Array.isArray(historyData) ? historyData : []);

      // Keep latest per sensor
      const latestMap = new Map<string, TrafficReading>();
      const validRawData = Array.isArray(rawData)
        ? rawData.filter(
            (r) =>
              r?.sensor_id &&
              r?.route_id &&
              r?.timestamp &&
              Number.isFinite(Number(r.average_speed_kmh)) &&
              Number.isFinite(Number(r.congestion_index)),
          )
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
      console.error("[useTrafficData] Error:", msg);
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

    const handleTrafficNew = (payload: TrafficReading | TrafficReading[]) => {
      const readings = Array.isArray(payload) ? payload : [payload];
      const validReadings = readings.filter(
        (r) =>
          r?.sensor_id &&
          r?.route_id &&
          r?.timestamp &&
          Number.isFinite(Number(r.average_speed_kmh)) &&
          Number.isFinite(Number(r.congestion_index)),
      );
      if (validReadings.length === 0) return;

      setLatestReadings(prev => {
        const updated = [...prev];
        validReadings.forEach(r => {
          const idx = updated.findIndex(e => e.sensor_id === r.sensor_id);
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
    socket.on(SOCKET_EVENTS.trafficNew, handleTrafficNew);

    return () => {
      controller.abort();
      socket.off(SOCKET_EVENTS.trafficNew, handleTrafficNew);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      window.clearTimeout(fetchTimeout);
      window.clearTimeout(connectedTimeout);
    };
  }, [fetchInitialData, enabled]);

  const routeStats = useMemo(() => buildRouteStats(latestReadings), [latestReadings]);

  return { latestReadings, routeStats, history, connected, loading, error };
}
