import trafficRoutesJson from "./json/routes.json";
import { TRAFFIC_LEVEL_COLORS, TRAFFIC_LEVEL_LABELS } from "@/lib/constants";

export interface TrafficRoute {
  id: string;
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  positions: [number, number][];
  traffic: "low" | "medium" | "high" | "critical";
  flowPerHour: number;
}

export const trafficRoutes = trafficRoutesJson as TrafficRoute[];

export function getTrafficColor(traffic: TrafficRoute["traffic"]): string {
  return TRAFFIC_LEVEL_COLORS[traffic];
}

export function getTrafficWeight(traffic: TrafficRoute["traffic"]): number {
  const map = { low: 3, medium: 4, high: 6, critical: 8 };
  return map[traffic];
}

export function getTrafficLabel(traffic: TrafficRoute["traffic"]): string {
  return TRAFFIC_LEVEL_LABELS[traffic];
}
