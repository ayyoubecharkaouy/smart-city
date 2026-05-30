import { UI_COLORS } from "@/lib/constants";

/**
 * Raw temperature reading from a sensor (via Kafka → Backend → Socket.IO)
 */
export interface AirQuality {
  aqi: number;
  status: string;
  main_pollutant: string;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  o3: number;
  units: {
    [key: string]: string;
  };
}

export interface TemperatureReading {
  sensor_id: string;
  city: string;
  district: string;
  temperature: number;
  unit: string;
  air_quality?: AirQuality;
  timestamp: string;
}

/**
 * Aggregated stats per district
 */
export interface DistrictTemperature {
  district: string;
  avg_temperature: number;
  min_temperature: number;
  max_temperature: number;
  avg_aqi?: number;
  sensor_count: number;
  last_update: string;
}

/**
 * Temperature alert (triggered when temperature >= 35°C)
 */
export interface TemperatureAlert {
  id: string;
  sensor_id: string;
  district: string;
  temperature: number;
  timestamp: string;
  acknowledged: boolean;
}

/**
 * Temperature level classification
 */
export type TemperatureLevel = "normal" | "warm" | "critical";

export function getTemperatureLevel(temp: number): number {
  if (temp >= 32) return 2;
  if (temp >= 25) return 1;
  return 0;
}

export function getTemperatureLevelColor(level: number): string {
  switch (level) {
    case 0:
      return UI_COLORS.blue;
    case 1:
      return UI_COLORS.warning;
    case 2:
      return UI_COLORS.danger;
    default:
      return UI_COLORS.blue;
  }
}

export function getTemperatureLevelLabel(level: number): string {
  switch (level) {
    case 0:
      return "Normale";
    case 1:
      return "Chaude";
    case 2:
      return "Critique";
    default:
      return "Normale";
  }
}

/**
 * Interpolates between two hex colors based on a factor (0-1)
 */
function interpolateHex(color1: string, color2: string, factor: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function getTemperatureFillColor(temp: number): string {
  const stops = [
    { t: 10, c: "#bbf7d0" },
    { t: 15, c: "#86efac" },
    { t: 20, c: "#4ade80" },
    { t: 25, c: "#22c55e" },
    { t: 30, c: "#16a34a" },
    { t: 35, c: "#15803d" },
    { t: 40, c: "#14532d" },
  ];

  if (temp <= stops[0].t) return stops[0].c;
  if (temp >= stops[stops.length - 1].t) return stops[stops.length - 1].c;

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (temp >= s1.t && temp <= s2.t) {
      const factor = (temp - s1.t) / (s2.t - s1.t);
      return interpolateHex(s1.c, s2.c, factor);
    }
  }

  return stops[stops.length - 1].c;
}

export function getAqiFillColor(aqi: number): string {
  const stops = [
    { t: 0, c: UI_COLORS.success },
    { t: 50, c: UI_COLORS.lime },
    { t: 100, c: "#4ade80" },
    { t: 150, c: UI_COLORS.orange },
    { t: 200, c: UI_COLORS.danger },
    { t: 300, c: UI_COLORS.purple },
    { t: 400, c: UI_COLORS.darkDanger },
  ];

  if (aqi <= stops[0].t) return stops[0].c;
  if (aqi >= stops[stops.length - 1].t) return stops[stops.length - 1].c;

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (aqi >= s1.t && aqi <= s2.t) {
      const factor = (aqi - s1.t) / (s2.t - s1.t);
      return interpolateHex(s1.c, s2.c, factor);
    }
  }

  return stops[stops.length - 1].c;
}

export function getAqiLevel(aqi: number): number {
  if (aqi <= 50) return 0;
  if (aqi <= 100) return 1;
  if (aqi <= 150) return 2;
  if (aqi <= 200) return 3;
  if (aqi <= 300) return 4;
  return 5;
}

export function getAqiLevelColor(level: number): string {
  const colors = [UI_COLORS.success, UI_COLORS.lime, "#4ade80", UI_COLORS.orange, UI_COLORS.danger, UI_COLORS.darkDanger];
  return colors[level] || colors[0];
}

// ── WATER TYPES ──

export interface WaterFlow {
  pulses: number;
  flow_rate_l_min: number;
  volume_l: number;
  flow_unit: string;
  volume_unit: string;
  status: string;
}

export interface WaterQuality {
  ph: number;
  turbidity_ntu: number;
  tds_ppm: number;
  chlorine_mg_l: number;
  conductivity_us_cm: number;
  water_temperature_c: number;
  status: string;
  units: { [key: string]: string };
}

export interface WaterReading {
  sensor_id: string;
  city: string;
  district: string;
  type: string;
  water_flow: WaterFlow;
  water_quality: WaterQuality;
  timestamp: string;
}

export interface DistrictWater {
  district: string;
  avg_flow: number;
  total_volume: number;
  avg_ph: number;
  avg_turbidity: number;
  sensor_count: number;
  last_update: string;
}

export function getPhColor(ph: number): string {
  if (ph < 6.5) return "#15803d";
  if (ph > 8.5) return "#4ade80";
  return "#22c55e";
}

export function getPhLevel(ph: number): number {
  if (ph < 6.5) return 0;
  if (ph > 8.5) return 2;
  return 1;
}

export function getPhLevelColor(level: number): string {
  switch (level) {
    case 0: return "#15803d";
    case 1: return "#22c55e";
    case 2: return "#4ade80";
    default: return "#22c55e";
  }
}

export function getWaterFlowColor(flow: number): string {
  const stops = [
    { t: 0, c: "#bbf7d0" },
    { t: 10, c: "#4ade80" },
    { t: 20, c: "#22c55e" },
    { t: 30, c: "#15803d" },
  ];
  
  if (flow <= stops[0].t) return stops[0].c;
  if (flow >= stops[stops.length - 1].t) return stops[stops.length - 1].c;

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (flow >= s1.t && flow <= s2.t) {
      const factor = (flow - s1.t) / (s2.t - s1.t);
      return interpolateHex(s1.c, s2.c, factor);
    }
  }
  return stops[stops.length - 1].c;
}

export function getWaterFlowLevel(flow: number): number {
  if (flow < 5) return 0;
  if (flow < 15) return 1;
  if (flow < 25) return 2;
  return 3;
}

export function getWaterFlowLevelColor(level: number): string {
  const colors = ["#bbf7d0", "#4ade80", "#22c55e", "#15803d"];
  return colors[level] || colors[0];
}

// ── TRAFFIC TYPES ──

export type TrafficStatus = "fluide" | "dense" | "congestion" | "forte_congestion";

export interface TrafficReading {
  sensor_id: string;
  route_id: string;
  city: string;
  sensor_type: string;
  observation_time_s: number;
  occupied_time_s: number;
  occupancy_rate: number;
  congestion_index: number;
  average_speed_kmh: number;
  vehicle_count: number;
  vehicle_detected: number;
  traffic_status: TrafficStatus;
  timestamp: string;
}

export interface RouteTrafficStats {
  route_id: string;
  avg_speed: number;
  avg_occupancy: number;
  avg_congestion: number;
  total_vehicles: number;
  sensor_count: number;
  last_update: string;
  dominant_status: TrafficStatus;
}

export function getTrafficStatusColor(status: TrafficStatus): string {
  const map: Record<TrafficStatus, string> = {
    fluide: UI_COLORS.success,
    dense: UI_COLORS.warning,
    congestion: UI_COLORS.orange,
    forte_congestion: UI_COLORS.danger,
  };
  return map[status] || UI_COLORS.success;
}

export function getTrafficStatusLabel(status: TrafficStatus): string {
  const map: Record<TrafficStatus, string> = {
    fluide: "Fluide",
    dense: "Dense",
    congestion: "Congestion",
    forte_congestion: "Forte Congestion",
  };
  return map[status] || "Inconnu";
}

export function getTrafficStatusLevel(status: TrafficStatus): number {
  const map: Record<TrafficStatus, number> = { fluide: 0, dense: 1, congestion: 2, forte_congestion: 3 };
  return map[status] ?? 0;
}

export function getTrafficStatusLevelColor(level: number): string {
  const colors = [UI_COLORS.success, UI_COLORS.warning, UI_COLORS.orange, UI_COLORS.danger];
  return colors[level] || colors[0];
}

// ── SPARK TYPES ──

export interface SparkWindow {
  start: string;
  end: string;
}

export interface SparkEnvironmentData {
  district: string;
  avg_temperature: number;
  min_temperature: number;
  max_temperature: number;
  avg_air_quality: number;
  max_air_quality: number;
  temperature_delta: number;
  temperature_trend: string;
  processed_at: string;
  window: SparkWindow;
}

export interface SparkWaterData {
  district: string;
  avg_flow_rate: number;
  total_flow_rate: number;
  avg_ph: number;
  avg_turbidity: number;
  flow_drop: number;
  sudden_flow_drop: boolean;
  water_quality_score: number;
  processed_at: string;
  window: SparkWindow;
}

export interface SparkTrafficData {
  route_id: string;
  avg_speed: number;
  min_speed: number;
  avg_vehicle_count: number;
  max_vehicle_count: number;
  max_congestion: number;
  congestion_level: string;
  is_congested_route: boolean;
  processed_at: string;
  window: SparkWindow;
}

export interface SparkErrorData {
  stream: string;
  error_reason: string;
  raw_value: string;
  processed_at: string;
}

export interface SparkAlertData {
  type: string;
  alert_type: string;
  severity: string;
  sensor_id?: string;
  district?: string;
  route_id?: string;
  value: number;
  operator: string;
  threshold: number;
  timestamp: string;
  processed_at: string;
}
