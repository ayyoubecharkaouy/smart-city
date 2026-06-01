export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export const APP_ROUTES = {
  home: "/",
  analytics: "/analytics",
  map: "/map",
  spark: "/spark",
  alerts: "/alerts",
  settings: "/settings",
} as const;

export const API_ROUTES = {
  sparkAggregations: "/api/spark/aggregations",
  sparkAlerts: "/api/spark/alerts",
  temperaturesLatest: "/api/temperatures/latest",
  temperaturesAvgByDistrict: "/api/temperatures/avg-by-district",
  temperaturesHistory: "/api/temperatures/history",
  environmentLatest: "/api/environment/latest",
  environmentStatsByDistrict: "/api/environment/stats-by-district",
  environmentHistory: "/api/environment/history",
  waterLatest: "/api/water/latest",
  waterStatsByDistrict: "/api/water/stats-by-district",
  waterHistory: "/api/water/history",
  trafficLatest: "/api/traffic/latest",
  trafficHistory: "/api/traffic/history",
} as const;

export const SOCKET_EVENTS = {
  environmentNew: "environment:new",
  temperatureNew: "temperature:new",
  temperatureAlert: "temperature:alert",
  waterNew: "water:new",
  trafficNew: "traffic:new",
  sparkEnvironment: "spark:environment",
  sparkWater: "spark:water",
  sparkTraffic: "spark:traffic",
  sparkError: "spark:error",
  sparkAlert: "spark:alert",
} as const;

export const UI_COLORS = {
  success: "#22c55e",
  lime: "#84cc16",
  warning: "#eab308",
  orange: "#f97316",
  danger: "#ef4444",
  purple: "#a855f7",
  darkDanger: "#b91c1c",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  emerald: "#10b981",
} as const;

export const SPARK_THRESHOLDS = {
  criticalTemperature: 35,
  criticalAqi: 150,
  criticalWaterScore: 70,
  criticalLowFlow: 5,
  minSafePh: 6.5,
  maxSafePh: 8.5,
  criticalCongestion: 0.7,
} as const;

export const SPARK_ALERT_LABELS: Record<string, string> = {
  high_air_quality: "Pollution elevee",
  high_congestion: "Congestion elevee",
  abnormal_ph: "pH anormal",
  high_turbidity: "Turbidite elevee",
};

export const SPARK_DOMAIN_LABELS: Record<string, string> = {
  environment: "Pollution",
  traffic: "Congestion",
  water: "Eau",
};

export const TRAFFIC_LEVEL_COLORS = {
  low: UI_COLORS.success,
  medium: UI_COLORS.warning,
  high: UI_COLORS.danger,
  critical: UI_COLORS.darkDanger,
} as const;

export const TRAFFIC_LEVEL_LABELS = {
  low: "Fluide",
  medium: "Modéré",
  high: "Dense",
  critical: "Critique",
} as const;

export const SPARK_CHART_COLORS = {
  temperature: UI_COLORS.orange,
  aqi: UI_COLORS.success,
  congestion: UI_COLORS.danger,
  flow: UI_COLORS.success,
  waterScore: UI_COLORS.emerald,
  latency: UI_COLORS.success,
} as const;

export const PERIOD_HOURS = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 24 * 7,
} as const;

export const PERIOD_OPTIONS = [
  { value: "all", label: "Toute la periode" },
  { value: "1h", label: "Derniere heure" },
  { value: "6h", label: "6 dernieres heures" },
  { value: "24h", label: "24 dernieres heures" },
  { value: "7d", label: "7 derniers jours" },
] as const;

export const ANALYTICS_DEFAULT_PERIOD = "24h";

export const ANALYTICS_METRICS = {
  temperature: {
    label: "Température",
    chartLabel: "Température",
    color: SPARK_CHART_COLORS.temperature,
    accentClass: "bg-green-500",
    unit: "°C",
  },
  aqi: {
    label: "Qualité Air",
    chartLabel: "Qualité Air (AQI)",
    color: SPARK_CHART_COLORS.aqi,
    accentClass: "bg-emerald-500",
    unit: "",
  },
  water: {
    label: "Eau Potable",
    chartLabel: "Débit d'Eau",
    color: SPARK_CHART_COLORS.flow,
    accentClass: "bg-green-500",
    unit: "L/min",
  },
  traffic: {
    label: "Trafic Routier",
    chartLabel: "Congestion",
    color: SPARK_CHART_COLORS.congestion,
    accentClass: "bg-green-500",
    unit: "%",
  },
} as const;
