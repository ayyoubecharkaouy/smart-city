"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useSocketStatus } from "@/hooks/useSocketStatus";
import { API_ROUTES, BACKEND_URL, SOCKET_EVENTS } from "@/lib/constants";
import type {
  SparkAlertData,
  SparkEnvironmentData,
  SparkErrorData,
  SparkTrafficData,
  SparkWaterData,
} from "@/lib/types";

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

function latestByKey<T>(items: T[], getKey: (item: T) => string | undefined): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  items.forEach(item => {
    const key = getKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });

  return result;
}

export function useSparkData() {
  const [envData, setEnvData] = useState<SparkEnvironmentData[]>([]);
  const [waterData, setWaterData] = useState<SparkWaterData[]>([]);
  const [trafficData, setTrafficData] = useState<SparkTrafficData[]>([]);
  const [sparkErrors, setSparkErrors] = useState<SparkErrorData[]>([]);
  const [sparkAlerts, setSparkAlerts] = useState<SparkAlertData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketStatus = useSocketStatus();

  const fetchInitialData = useCallback(async (signal?: AbortSignal) => {
    setError(null);

    try {
      const [aggregationsRes, alertsRes] = await Promise.all([
        fetch(`${BACKEND_URL}${API_ROUTES.sparkAggregations}?limit=150`, { signal }),
        fetch(`${BACKEND_URL}${API_ROUTES.sparkAlerts}?limit=100`, { signal }),
      ]);

      if (!aggregationsRes.ok || !alertsRes.ok) {
        throw new Error("Erreur lors de la recuperation de l'historique Spark");
      }

      const aggregations = await aggregationsRes.json();
      const alerts = await alertsRes.json();
      if (signal?.aborted) return;

      const items = Array.isArray(aggregations) ? aggregations : [];
      setEnvData(latestByKey(
        items.filter((item): item is SparkEnvironmentData => item?.type === "environment"),
        item => item.district,
      ));
      setWaterData(latestByKey(
        items.filter((item): item is SparkWaterData => item?.type === "water"),
        item => item.district,
      ));
      setTrafficData(latestByKey(
        items.filter((item): item is SparkTrafficData => item?.type === "traffic"),
        item => item.route_id,
      ));
      setSparkAlerts(Array.isArray(alerts) ? alerts : []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      console.error("[useSparkData] Fetch error:", msg);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTimeout = window.setTimeout(() => {
      void fetchInitialData(controller.signal);
    }, 0);
    const socket = getSocket();

    const handleEnvironment = (payload: unknown) => {
      const data = parseSparkPayload<SparkEnvironmentData>(payload);
      if (!data) return;
      setEnvData(prev => {
        const newData = [...prev];
        const idx = newData.findIndex(d => d.district === data.district);
        if (idx >= 0) newData[idx] = data;
        else newData.push(data);
        return newData;
      });
    };

    const handleWater = (payload: unknown) => {
      const data = parseSparkPayload<SparkWaterData>(payload);
      if (!data) return;
      setWaterData(prev => {
        const newData = [...prev];
        const idx = newData.findIndex(d => d.district === data.district);
        if (idx >= 0) newData[idx] = data;
        else newData.push(data);
        return newData;
      });
    };

    const handleTraffic = (payload: unknown) => {
      const data = parseSparkPayload<SparkTrafficData>(payload);
      if (!data) return;
      setTrafficData(prev => {
        const newData = [...prev];
        const idx = newData.findIndex(d => d.route_id === data.route_id);
        if (idx >= 0) newData[idx] = data;
        else newData.push(data);
        return newData;
      });
    };

    const handleError = (payload: unknown) => {
      const data = parseSparkPayload<SparkErrorData>(payload);
      if (!data) return;
      setSparkErrors(prev => [data, ...prev].slice(0, 50));
    };

    const handleAlert = (payload: unknown) => {
      const data = parseSparkPayload<SparkAlertData>(payload);
      if (!data) return;
      setSparkAlerts(prev => [data, ...prev].slice(0, 100));
    };

    socket.on(SOCKET_EVENTS.sparkEnvironment, handleEnvironment);
    socket.on(SOCKET_EVENTS.sparkWater, handleWater);
    socket.on(SOCKET_EVENTS.sparkTraffic, handleTraffic);
    socket.on(SOCKET_EVENTS.sparkError, handleError);
    socket.on(SOCKET_EVENTS.sparkAlert, handleAlert);

    return () => {
      controller.abort();
      socket.off(SOCKET_EVENTS.sparkEnvironment, handleEnvironment);
      socket.off(SOCKET_EVENTS.sparkWater, handleWater);
      socket.off(SOCKET_EVENTS.sparkTraffic, handleTraffic);
      socket.off(SOCKET_EVENTS.sparkError, handleError);
      socket.off(SOCKET_EVENTS.sparkAlert, handleAlert);
      window.clearTimeout(fetchTimeout);
    };
  }, [fetchInitialData]);

  return {
    envData,
    waterData,
    trafficData,
    sparkErrors,
    sparkAlerts,
    connected: socketStatus.connected,
    reconnecting: socketStatus.reconnecting,
    reconnectAttempt: socketStatus.reconnectAttempt,
    lastEvent: socketStatus.lastEvent,
    eventCount: socketStatus.eventCount,
    socketError: socketStatus.error,
    error: error ?? socketStatus.error,
  };
}
