"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
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

export function useSparkData() {
  const [envData, setEnvData] = useState<SparkEnvironmentData[]>([]);
  const [waterData, setWaterData] = useState<SparkWaterData[]>([]);
  const [trafficData, setTrafficData] = useState<SparkTrafficData[]>([]);
  const [sparkErrors, setSparkErrors] = useState<SparkErrorData[]>([]);
  const [sparkAlerts, setSparkAlerts] = useState<SparkAlertData[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setConnected(true);
      setError(null);
    };
    const handleDisconnect = () => setConnected(false);
    const handleConnectError = () => {
      setConnected(false);
      setError("Impossible de joindre le backend Socket.IO");
    };

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

    const connectedTimeout = window.setTimeout(() => {
      setConnected(socket.connected);
    }, 0);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("spark:environment", handleEnvironment);
    socket.on("spark:water", handleWater);
    socket.on("spark:traffic", handleTraffic);
    socket.on("spark:error", handleError);
    socket.on("spark:alert", handleAlert);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("spark:environment", handleEnvironment);
      socket.off("spark:water", handleWater);
      socket.off("spark:traffic", handleTraffic);
      socket.off("spark:error", handleError);
      socket.off("spark:alert", handleAlert);
      window.clearTimeout(connectedTimeout);
    };
  }, []);

  return {
    envData,
    waterData,
    trafficData,
    sparkErrors,
    sparkAlerts,
    connected,
    error,
  };
}
