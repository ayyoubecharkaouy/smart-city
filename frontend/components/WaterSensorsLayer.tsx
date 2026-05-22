"use client";

import { useEffect, useState } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { WaterReading } from "@/lib/types";
import { getWaterFlowColor, getPhColor } from "@/lib/types";
import { waterSensorsData } from "@/data/water_sensors";

interface WaterSensorsLayerProps {
  latestReadings: WaterReading[];
  visible: boolean;
  mode: "water_consumption" | "water_quality";
}

export default function WaterSensorsLayer({ latestReadings, visible, mode }: WaterSensorsLayerProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [animatingSensors, setAnimatingSensors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => { map.off("zoomend", onZoom); };
  }, [map]);

  useEffect(() => {
    if (!latestReadings.length) return;
    const now = Date.now();
    const newAnims = new Set<string>();
    latestReadings.forEach(r => {
      if (now - new Date(r.timestamp).getTime() < 3000) newAnims.add(r.sensor_id);
    });

    if (newAnims.size > 0) {
      const startTimeout = window.setTimeout(() => {
        setAnimatingSensors(prev => new Set([...prev, ...newAnims]));
      }, 0);
      const clearAnimationTimeout = window.setTimeout(() => {
        setAnimatingSensors(prev => {
          const next = new Set(prev);
          newAnims.forEach(id => next.delete(id));
          return next;
        });
      }, 2500);
      return () => {
        window.clearTimeout(startTimeout);
        window.clearTimeout(clearAnimationTimeout);
      };
    }
  }, [latestReadings]);

  if (!visible) return null;

  return (
    <>
      {waterSensorsData.map((sensor) => {
        const reading = latestReadings.find(r => r.sensor_id === sensor.id);
        const isAnimating = animatingSensors.has(sensor.id);

        let color = "#9ca3af";
        let valueStr = "—";
        let statusStr = "";

        if (reading) {
          if (mode === "water_consumption") {
            color = getWaterFlowColor(reading.water_flow.flow_rate_l_min);
            valueStr = `${reading.water_flow.flow_rate_l_min.toFixed(1)} L/min`;
            statusStr = reading.water_flow.status;
          } else {
            color = getPhColor(reading.water_quality.ph);
            valueStr = `pH ${reading.water_quality.ph.toFixed(2)}`;
            statusStr = reading.water_quality.status;
          }
        }

        const scale = Math.pow(1.4, zoom - 13);
        const currentSize = Math.max(4, Math.min(32, Math.round(8 * scale)));

        const iconHtml = `
          <div style="position: relative; width: ${currentSize}px; height: ${currentSize}px;">
            ${isAnimating ? `<span style="background-color: ${color}; width: ${currentSize * 2}px; height: ${currentSize * 2}px; left: ${-currentSize * 0.5}px; top: ${-currentSize * 0.5}px;" class="animate-ping absolute inline-flex rounded-full opacity-75"></span>` : ""}
            <span class="relative inline-flex rounded-full border-[1.5px] border-white" style="width: ${currentSize}px; height: ${currentSize}px; background-color: ${color};"></span>
          </div>
        `;

        const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [currentSize, currentSize], iconAnchor: [currentSize / 2, currentSize / 2] });

        return (
          <Marker key={sensor.id} position={[sensor.lat, sensor.lng]} icon={icon}>
            <Tooltip direction="top" offset={[0, -7]} opacity={1}>
              <div className="text-center font-sans">
                <div className="text-[10px] text-gray-400 font-mono">{sensor.id}</div>
                <div className="text-xs text-gray-700 font-bold">{sensor.districtName}</div>
                <div className="font-black text-blue-600 text-sm mt-1">{valueStr}</div>
                <div className="text-[9px] text-gray-400 uppercase mt-0.5">{statusStr}</div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
