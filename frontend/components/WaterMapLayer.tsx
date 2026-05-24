"use client";

import { GeoJSON } from "react-leaflet";
import { memo, useCallback, useMemo } from "react";
import type { FeatureCollection, Feature } from "geojson";
import type { Layer } from "leaflet";
import { zonesGeoJSON as zonesData } from "@/data/zones"; 
import type { DistrictWater } from "@/lib/types";
import { getWaterFlowColor, getPhColor } from "@/lib/types";
import { renderToString } from "react-dom/server";
import { Droplet, Activity, Gauge } from "lucide-react";

interface WaterMapLayerProps {
  districtStats: Map<string, DistrictWater>;
  visible: boolean;
  mode: "water_consumption" | "water_quality";
}

const findDistrictData = (feature: Feature, districtStats: Map<string, DistrictWater>) => {
  const id = feature.properties?.id;
  const name = feature.properties?.name;
  return districtStats.get(id) || districtStats.get(name) || null;
};

const buildPopup = (district: string, stats: DistrictWater, mode: string) => {
  return renderToString(
    <div className="p-1 min-w-[160px]">
      <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-1">
        <span className="font-bold text-gray-800">{district}</span>
      </div>
      <div className="space-y-2">
        <div className={`flex items-center justify-between ${mode === 'water_consumption' ? 'bg-blue-50 p-1.5 rounded' : ''}`}>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Débit</span>
          </div>
          <span className="text-[11px] font-bold text-gray-800">{stats.avg_flow.toFixed(2)} L/min</span>
        </div>
        
        <div className={`flex items-center justify-between ${mode === 'water_quality' ? 'bg-cyan-50 p-1.5 rounded' : ''}`}>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Droplet className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Qualité (pH)</span>
          </div>
          <span className="text-[11px] font-bold text-gray-800">{stats.avg_ph.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-gray-500 pt-1 border-t border-gray-50 mt-1">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[10px]">Volume Total</span>
          </div>
          <span className="text-[10px] font-bold">{stats.total_volume.toFixed(1)} L</span>
        </div>
      </div>
    </div>
  );
};

function WaterMapLayer({ districtStats, visible, mode }: WaterMapLayerProps) {
  const geoData = useMemo(() => zonesData as unknown as FeatureCollection, []);

  const styleFn = useCallback((feature?: Feature) => {
    if (!feature) return {};
    const stats = findDistrictData(feature, districtStats);

    if (!stats) return { fillColor: "#f3f4f6", fillOpacity: 0.1, weight: 1, color: "#d1d5db" };

    const fillColor = mode === "water_consumption" 
      ? getWaterFlowColor(stats.avg_flow)
      : getPhColor(stats.avg_ph);

    return {
      fillColor,
      fillOpacity: 0.6,
      weight: 2,
      color: "#ffffff",
      className: "district-polygon",
    };
  }, [districtStats, mode]);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const stats = findDistrictData(feature, districtStats);
    if (stats) {
      layer.bindPopup(buildPopup(stats.district, stats, mode), { className: "custom-popup" });
    }
  }, [districtStats, mode]);

  if (!visible) return null;

  return (
    <GeoJSON
      key={`water-layer-${mode}-${districtStats.size}`}
      data={geoData}
      style={styleFn}
      onEachFeature={onEachFeature}
    />
  );
}

export default memo(WaterMapLayer);
