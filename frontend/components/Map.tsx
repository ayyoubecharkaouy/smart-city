"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Tooltip,
  useMap,
  Pane,
} from "react-leaflet";
import { trafficRoutes } from "@/data/routes";
import type { DistrictTemperature, DistrictWater, RouteTrafficStats, TrafficStatus } from "@/lib/types";
import { getTrafficStatusColor, getTrafficStatusLabel } from "@/lib/types";
import { SMART_CITY_DOMAINS } from "@/data/domains";
import type { DomainId } from "@/data/domains";
import { useTemperatureData } from "@/hooks/useTemperatureData";
import { useWaterData } from "@/hooks/useWaterData";
import { useTrafficData } from "@/hooks/useTrafficData";

import DashboardBar from "./DashboardBar";
import TemperatureStats from "./TemperatureStats";
import AirQualityStats from "./AirQualityStats";
import TrafficStats from "./TrafficStats";
import WaterStats from "./WaterStats";
import TemperatureAlerts from "./TemperatureAlerts";
import GenericPlaceholderStats from "./GenericPlaceholderStats";
import StateNotice from "./StateNotice";

import "leaflet/dist/leaflet.css";

// Dynamic Imports for Heavy Leaflet Components (though Map itself is already dynamic)
const Controls = dynamic(() => import("./Controls"), { ssr: false });
const TemperatureMapLayer = dynamic(() => import("./TemperatureMapLayer"), {
  ssr: false,
});
const TemperatureSensorsLayer = dynamic(
  () => import("./TemperatureSensorsLayer"),
  { ssr: false },
);
const WaterMapLayer = dynamic(() => import("./WaterMapLayer"), { ssr: false });
const WaterSensorsLayer = dynamic(() => import("./WaterSensorsLayer"), {
  ssr: false,
});

/* ── Invalidate map size when dimensions change ── */
function MapResizer({ dimensions }: { dimensions: { rightWidth: number } }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map, dimensions]);
  return null;
}

/* ── Routes overlay with zoom-adaptive weight ── */
function RoutesOverlay({
  mode,
  trafficStats,
}: {
  mode: string;
  trafficStats: Map<string, RouteTrafficStats>;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => {
      map.off("zoomend", onZoom);
    };
  }, [map]);

  const scale = Math.pow(1.5, zoom - 13);
  const isTrafficMode = mode.startsWith("traffic");

  return (
    <>
      {trafficRoutes.map((r) => {
        const liveStats = trafficStats.get(r.id);
        let color: string;
        let weight: number;
        let opacity: number;
        let dashArray: string | undefined;

        if (isTrafficMode && liveStats) {
          color = getTrafficStatusColor(liveStats.dominant_status);
          const statusWeight: Record<TrafficStatus, number> = {
            fluide: 3,
            dense: 5,
            congestion: 7,
            forte_congestion: 9,
          };
          weight = Math.max(
            2,
            (statusWeight[liveStats.dominant_status] || 3) *
              scale *
              0.2,
          );
          opacity = 0.9;
          dashArray =
            liveStats.dominant_status === "forte_congestion"
              ? `${10 * scale} ${6 * scale}`
              : undefined;
        } else if (isTrafficMode) {
          color = "#005eff";
          weight = Math.max(2, 3 * scale);
          opacity = 0.5;
          dashArray = undefined;
        } else {
          color = "#ff0000";
          weight = 1.2;
          opacity = 0.15;
          dashArray = undefined;
        }

        return (
          <Polyline
            key={r.id}
            positions={r.positions}
            pathOptions={{ color, weight, opacity, dashArray }}
          >
            <Tooltip sticky>
              <div style={{ minWidth: 160 }}>
                <strong style={{ fontSize: 13 }}>
                  {r.fromLabel} → {r.toLabel}
                </strong>
                {isTrafficMode && liveStats ? (
                  <div style={{ marginTop: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: getTrafficStatusColor(
                            liveStats.dominant_status,
                          ),
                        }}
                      />
                      <span style={{ fontWeight: 700 }}>
                        {getTrafficStatusLabel(liveStats.dominant_status)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        lineHeight: 1.6,
                      }}
                    >
                      🚗 {liveStats.total_vehicles} véhicules
                      <br />⚡ {liveStats.avg_speed.toFixed(1)} km/h
                      <br />
                      📊 Congestion : {liveStats.avg_congestion.toFixed(2)}
                      <br />
                      📡 {liveStats.sensor_count} capteurs
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
                    Pas de données en temps réel
                  </div>
                )}
              </div>
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}

import Modal from "./Modal";
import { Menu } from "lucide-react";

export default function Map() {
  const [mode, setMode] = useState<DomainId>("temperature");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sidebar State
  const [rightWidth, setRightWidth] = useState(620);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const MIN_WIDTH = 250;
  const SNAP_THRESHOLD = 150;

  const activeDomain = useMemo(() => {
    for (const category of SMART_CITY_DOMAINS) {
      const found = category.items.find((item) => item.id === mode);
      if (found) return found;
    }
    return SMART_CITY_DOMAINS[0].items[0];
  }, [mode]);

  const isWaterMode = mode === "water_consumption" || mode === "water_quality";
  const isEnvMode = mode === "temperature" || mode === "air_quality";
  const isTrafficMode = mode === "traffic_congestion";

  // Data Hooks
  const {
    latestReadings: envReadings,
    districtStats: envStats,
    alerts: envAlerts,
    history: envHistory,
    connected: envConnected,
    loading: envLoading,
    error: envError,
    acknowledgeAlert: envAck,
  } = useTemperatureData(isEnvMode);

  const {
    latestReadings: waterReadings,
    districtStats: waterStats,
    history: waterHistory,
    connected: waterConnected,
    loading: waterLoading,
    error: waterError,
  } = useWaterData(isWaterMode);

  const {
    routeStats: trafficRouteStats,
    history: trafficHistory,
    connected: trafficConnected,
    loading: trafficLoading,
    error: trafficError,
  } = useTrafficData(isTrafficMode);

  const currentStats = isTrafficMode
    ? trafficRouteStats
    : isWaterMode
      ? waterStats
      : envStats;
  const currentConnected = isTrafficMode
    ? trafficConnected
    : isWaterMode
      ? waterConnected
      : envConnected;
  const currentLoading = isTrafficMode
    ? trafficLoading
    : isWaterMode
      ? waterLoading
      : envLoading;
  const currentError = isTrafficMode
    ? trafficError
    : isWaterMode
      ? waterError
      : envError;
  const currentHasData = currentStats.size > 0;

  const totalSensors = useMemo(() => {
    let count = 0;
    currentStats.forEach((d: DistrictTemperature | DistrictWater | RouteTrafficStats) => {
      count += d.sensor_count;
    });
    return count;
  }, [currentStats]);

  // Resizing Logic
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);
  const stopResizing = useCallback(() => {
    setIsResizingRight(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth < SNAP_THRESHOLD) setRightWidth(0);
        else if (newWidth < MIN_WIDTH) setRightWidth(MIN_WIDTH);
        else setRightWidth(newWidth);
      }
    },
    [isResizingRight],
  );

  useEffect(() => {
    if (isResizingRight) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizingRight, resize, stopResizing]);

  return (
    <div
      className={`flex h-full w-full bg-gray-50 overflow-hidden select-none ${isResizingRight ? "cursor-col-resize" : ""}`}
    >
      {/* Menu Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Controls
          mode={mode}
          onModeChange={(newMode) => {
            setMode(newMode);
            setIsModalOpen(false);
          }}
          kafkaConnected={currentConnected}
          districtCount={currentStats.size}
          sensorCount={totalSensors}
        />
      </Modal>

      {/* Map Area */}
      <div className="flex-1 relative h-full min-w-0">
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-6 left-6 z-1001 cursor-pointer bg-white p-4 rounded-4xl border-2 border-gray-500 flex items-center gap-3"
        >
          <Menu className="w-6 h-6 text-black" />
          <span className="font-black text-gray-900 pr-2">Changer Type de donnees</span>
        </button>

        <MapContainer
          center={[33.246, -8.506]}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
        >
          <MapResizer dimensions={{ rightWidth }} />
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Environmental Layers */}
          <TemperatureMapLayer
            districtStats={envStats}
            visible={isEnvMode}
            mode={mode as "temperature" | "air_quality"}
          />
          <Pane name="envSensorsPane" style={{ zIndex: 460 }}>
            <TemperatureSensorsLayer
              latestReadings={envReadings}
              visible={isEnvMode}
              mode={mode as "temperature" | "air_quality"}
            />
          </Pane>

          {/* Water Layers */}
          <WaterMapLayer
            districtStats={waterStats}
            visible={isWaterMode}
            mode={mode as "water_consumption" | "water_quality"}
          />
          <Pane name="waterSensorsPane" style={{ zIndex: 460 }}>
            <WaterSensorsLayer
              latestReadings={waterReadings}
              visible={isWaterMode}
              mode={mode as "water_consumption" | "water_quality"}
            />
          </Pane>

          {/* Traffic routes */}
          <Pane name="routesPane" style={{ zIndex: 450 }}>
            <RoutesOverlay mode={mode} trafficStats={trafficRouteStats} />
          </Pane>
        </MapContainer>

        {[
          "temperature",
          "air_quality",
          "water_consumption",
          "water_quality",
          "traffic_congestion",
        ].includes(mode) && (
          <DashboardBar
            mode={mode}
            districtStats={envStats}
            waterStats={waterStats}
            trafficStats={trafficRouteStats}
            connected={currentConnected}
            loading={currentLoading}
          />
        )}

        {!currentLoading && currentError && (
          <div className="absolute top-28 left-6 right-6 z-1001 pointer-events-none">
            <StateNotice
              variant="error"
              message={`${currentError}. Les dernières données affichées peuvent être obsolètes.`}
              className="mx-auto max-w-2xl shadow-sm pointer-events-auto"
            />
          </div>
        )}

        {!currentLoading && !currentError && !currentConnected && !currentHasData && (
          <div className="absolute top-28 left-6 right-6 z-1001 pointer-events-none">
            <StateNotice
              variant="disconnected"
              message="Le backend n'est pas connecté. Lancez l'API et les producteurs Kafka pour alimenter la carte."
              className="mx-auto max-w-2xl shadow-sm pointer-events-auto"
            />
          </div>
        )}

        {!currentLoading && !currentError && currentConnected && !currentHasData && (
          <div className="absolute top-28 left-6 right-6 z-1001 pointer-events-none">
            <StateNotice
              variant="empty"
              message="Connexion active, mais aucune mesure n'est disponible pour cette couche."
              className="mx-auto max-w-2xl shadow-sm pointer-events-auto"
            />
          </div>
        )}

        {/* Legends */}
        <div className="absolute bottom-6 right-6 z-1000 flex flex-col gap-2">
          {mode === "temperature" && (
            <Legend
              title="🌡️ Température"
              items={[
                { color: "#93c5fd", label: "< 15°C" },
                { color: "#60a5fa", label: "15 – 20°C" },
                { color: "#fbbf24", label: "20 – 25°C" },
                { color: "#f59e0b", label: "25 – 29°C" },
                { color: "#f97316", label: "29 – 32°C" },
                { color: "#ef4444", label: "32 – 35°C" },
                { color: "#dc2626", label: "> 35°C" },
              ]}
            />
          )}
          {mode === "air_quality" && (
            <Legend
              title="🌬️ Qualité de l'Air (AQI)"
              items={[
                { color: "#22c55e", label: "0 – 50 (Bon)" },
                { color: "#84cc16", label: "51 – 100 (Moyen)" },
                { color: "#eab308", label: "101 – 150 (Sensible)" },
                { color: "#f97316", label: "151 – 200 (Mauvais)" },
                { color: "#ef4444", label: "201 – 300 (Très Mauvais)" },
                { color: "#7f1d1d", label: "> 300 (Dangereux)" },
              ]}
            />
          )}
          {(mode === "water_consumption" || mode === "water_quality") && (
            <Legend
              title={
                mode === "water_consumption"
                  ? "💧 Débit d'Eau"
                  : "🧪 Qualité d'Eau (pH)"
              }
              items={
                mode === "water_consumption"
                  ? [
                      { color: "#d1fae5", label: "0 – 5 L/min" },
                      { color: "#34d399", label: "5 – 15 L/min" },
                      { color: "#3b82f6", label: "15 – 25 L/min" },
                      { color: "#1d4ed8", label: "> 25 L/min" },
                    ]
                  : [
                      { color: "#f87171", label: "< 6.5 (Acide)" },
                      { color: "#34d399", label: "6.5 – 8.5 (Sain)" },
                      { color: "#818cf8", label: "> 8.5 (Basique)" },
                    ]
              }
            />
          )}
          {mode === "traffic_congestion" && (
            <Legend
              title="🚦 Congestion Routière"
              items={[
                { color: "#22c55e", label: "Fluide" },
                { color: "#f59e0b", label: "Dense" },
                { color: "#f97316", label: "Congestion" },
                { color: "#ef4444", label: "Forte Congestion" },
              ]}
            />
          )}
        </div>
      </div>

      {/* Right Resizer */}
      <div
        onMouseDown={startResizingRight}
        className={`relative z-1100 w-1.5 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors shrink-0 ${isResizingRight ? "bg-blue-500" : "bg-gray-200"}`}
      />

      {/* Right Sidebar */}
      <div
        style={{ width: rightWidth }}
        className="h-full bg-[#fafaf8] relative transition-[width] duration-75 ease-out overflow-y-auto shrink-0"
      >
        <div className="flex flex-col gap-2 min-w-[250px]">
          {mode === "temperature" ? (
            <>
              <TemperatureStats
                districtStats={envStats}
                history={envHistory}
                connected={envConnected}
                loading={envLoading}
                error={envError}
              />
              <TemperatureAlerts alerts={envAlerts} onAcknowledge={envAck} />
            </>
          ) : mode === "air_quality" ? (
            <AirQualityStats
              districtStats={envStats}
              history={envHistory}
              connected={envConnected}
              loading={envLoading}
              error={envError}
            />
          ) : mode === "traffic_congestion" ? (
            <TrafficStats
              routeStats={trafficRouteStats}
              history={trafficHistory}
              connected={trafficConnected}
              loading={trafficLoading}
            />
          ) : mode === "water_consumption" || mode === "water_quality" ? (
            <WaterStats
              districtStats={waterStats}
              history={waterHistory}
              connected={waterConnected}
              loading={waterLoading}
            />
          ) : (
            <GenericPlaceholderStats
              title={activeDomain.label}
              icon={activeDomain.icon}
              colorClass={activeDomain.colorClass}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Legend({
  title,
  items,
}: {
  title: string;
  items: { color: string; label: string }[];
}) {
  return (
    <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-sm p-2 w-max ">
      <h3 className="text-[11px] font-bold text-gray-800 mb-2 uppercase tracking-tight">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-gray-600 font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
