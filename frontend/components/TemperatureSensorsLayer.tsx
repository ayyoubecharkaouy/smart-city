"use client";

import { useEffect, useState } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { TemperatureReading } from "@/lib/types";
import { getTemperatureFillColor, getAqiFillColor } from "@/lib/types";
import { sensorsData } from "@/data/sensors";

interface EnvironmentSensorsLayerProps {
  latestReadings: TemperatureReading[];
  visible: boolean;
  mode: "temperature" | "air_quality";
}

export default function EnvironmentSensorsLayer({
  latestReadings,
  visible,
  mode,
}: EnvironmentSensorsLayerProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [animatingSensors, setAnimatingSensors] = useState<Set<string>>(
    new Set(),
  );

  // Track map zoom
  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => {
      map.off("zoomend", onZoom);
    };
  }, [map]);

  // Watch for new readings and trigger animation
  useEffect(() => {
    if (!latestReadings || latestReadings.length === 0) return;

    const now = Date.now();
    const newAnims = new Set<string>();

    latestReadings.forEach((reading) => {
      const timeDiff = now - new Date(reading.timestamp).getTime();
      // If reading is newer than 3 seconds
      if (timeDiff < 3000) {
        newAnims.add(reading.sensor_id);
      }
    });

    if (newAnims.size > 0) {
      const startTimeout = window.setTimeout(() => {
        setAnimatingSensors((prev) => {
          const merged = new Set(prev);
          newAnims.forEach((id) => merged.add(id));
          return merged;
        });
      }, 0);

      // Clear the animation after 2.5 seconds
      const timeout = window.setTimeout(() => {
        setAnimatingSensors((prev) => {
          const next = new Set(prev);
          newAnims.forEach((id) => next.delete(id));
          return next;
        });
      }, 2500);

      return () => {
        window.clearTimeout(startTimeout);
        window.clearTimeout(timeout);
      };
    }
  }, [latestReadings]);

  if (!visible) return null;

  return (
    <>
      {sensorsData.map((sensor) => {
        const reading = latestReadings?.find((r) => r.sensor_id === sensor.id);
        const isAnimating = animatingSensors.has(sensor.id);

        let color = "#9ca3af"; // Gray for no data
        let valueStr = "—";
        let aqiStatus = "";
        let timeStr = "Aucune donnée";

        if (reading) {
          if (mode === "temperature") {
            color = getTemperatureFillColor(reading.temperature);
            valueStr = reading.temperature.toFixed(1) + " °C";
          } else {
            const aqi = reading.air_quality?.aqi || 0;
            color = getAqiFillColor(aqi);
            valueStr = `AQI ${Math.round(aqi)}`;
            aqiStatus = reading.air_quality?.status || "";
          }
          
          timeStr = "MAJ: " + new Date(reading.timestamp).toLocaleTimeString("fr-FR");
        }

        // Calculate dynamic size based on zoom (base size 8 at zoom 13)
        const scale = Math.pow(1.4, zoom - 13);
        const currentSize = Math.max(2, Math.min(8, Math.round(4 * scale)));

        // Create a custom HTML icon with dynamic pixel sizes
        const iconHtml = `
          <div style="position: relative; width: ${currentSize}px; height: ${currentSize}px; display: flex; align-items: center; justify-content: center;">
            ${isAnimating ? `<span style="background-color: ${color}; width: ${currentSize * 2.5}px; height: ${currentSize * 2.5}px; position: absolute;" class="animate-ping rounded-full opacity-75"></span>` : ""}
            <span class="relative inline-flex rounded-full border-[1.5px] border-white" style="width: ${currentSize}px; height: ${currentSize}px; background-color: ${color}; flex-shrink: 0;"></span>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "", // Disable default Leaflet background
          iconSize: [currentSize, currentSize],
          iconAnchor: [currentSize / 2, currentSize / 2],
        });

        return (
          <Marker
            key={sensor.id}
            position={[sensor.lat, sensor.lng]}
            icon={icon}
          >
            <Tooltip direction="top" offset={[0, -7]} opacity={1}>
              <div className="text-center font-sans">
                <div className="text-[10px] text-gray-400 mb-0.5 font-mono">
                  {sensor.id}
                </div>
                <div className="text-xs text-gray-700 font-bold">
                  {sensor.districtName}
                </div>
                <div className="font-black text-gray-900 text-sm mt-1">
                  {valueStr}
                </div>
                {aqiStatus && (
                  <div className="text-[9px] text-blue-400 font-bold uppercase mt-0.5">
                    {aqiStatus}
                  </div>
                )}
                <div className="text-[8px] text-gray-400 mt-1 uppercase tracking-tighter font-medium">
                  {timeStr}
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
