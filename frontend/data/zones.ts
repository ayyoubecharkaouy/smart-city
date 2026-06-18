import zonesGeoJSONJson from "./json/zones.json";

export interface ZoneProperties {
  id: string;
  name: string;
  nameAr: string;
  energy: number;
  water: number;
  vehicles: number;
  temperature: number;
  humidity: number;
  aqi: number;
  noise: number;
  wasteFill: number;
  parkingOccupancy: number;
  sensorCount: number;
}

export type MetricKey = keyof Pick<
  ZoneProperties,
  "energy" | "water" | "vehicles" | "aqi" | "noise" | "temperature"
>;

export interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  icon: string;
  colors: string[];
  thresholds: { label: string; color: string }[];
}

export const METRICS: MetricConfig[] = [
  {
    key: "energy",
    label: "Energy",
    unit: "kWh",
    icon: "⚡",
    colors: ["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#15803d", "#14532d"],
    thresholds: [
      { label: "Low", color: "#bbf7d0" },
      { label: "High", color: "#14532d" },
    ],
  },
  {
    key: "water",
    label: "Water",
    unit: "m³",
    icon: "💧",
    colors: ["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"],
    thresholds: [
      { label: "Low", color: "#bbf7d0" },
      { label: "High", color: "#15803d" },
    ],
  },
  {
    key: "vehicles",
    label: "Vehicles",
    unit: "",
    icon: "🚗",
    colors: ["#bbf7d0", "#86efac", "#22c55e", "#22c55e", "#16a34a", "#14532d"],
    thresholds: [
      { label: "Low", color: "#bbf7d0" },
      { label: "Dense", color: "#14532d" },
    ],
  },
  {
    key: "aqi",
    label: "Air Quality",
    unit: "AQI",
    icon: "🌬️",
    colors: ["#bbf7d0", "#a7f3d0", "#86efac", "#4ade80", "#15803d", "#14532d"],
    thresholds: [
      { label: "Good", color: "#bbf7d0" },
      { label: "Hazardous", color: "#14532d" },
    ],
  },
  {
    key: "noise",
    label: "Noise",
    unit: "dB",
    icon: "🔊",
    colors: ["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#15803d", "#14532d"],
    thresholds: [
      { label: "Quiet", color: "#bbf7d0" },
      { label: "Loud", color: "#14532d" },
    ],
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: "🌡️",
    colors: ["#bbf7d0", "#86efac", "#86efac", "#4ade80", "#15803d", "#15803d"],
    thresholds: [
      { label: "Cold", color: "#bbf7d0" },
      { label: "Hot", color: "#15803d" },
    ],
  },
];


export const zonesGeoJSON = zonesGeoJSONJson;

export interface Landmark {
  id: string;
  name: string;
  position: [number, number];
  icon: string;
  type: string;
}
