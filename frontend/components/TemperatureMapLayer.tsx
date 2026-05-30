"use client";

import { GeoJSON } from "react-leaflet";
import { memo, useCallback, useMemo } from "react";
import type { FeatureCollection, Feature } from "geojson";
import type { Layer } from "leaflet";
import { zonesGeoJSON } from "@/data/zones";
import type { DistrictTemperature } from "@/lib/types";
import { getTemperatureFillColor, getAqiFillColor } from "@/lib/types";
import { renderToString } from "react-dom/server";
import { Thermometer, Wind, Gauge } from "lucide-react";

interface EnvironmentMapLayerProps {
  districtStats: Map<string, DistrictTemperature>;
  visible: boolean;
  mode: "temperature" | "air_quality";
}

/**
 * Mapping between zone IDs / names in the GeoJSON and district names
 */
const findDistrictData = (
  feature: Feature,
  districtStats: Map<string, DistrictTemperature>
) => {
  const id = feature.properties?.id;
  const name = feature.properties?.name;
  return districtStats.get(id) || districtStats.get(name) || null;
};

const buildPopup = (district: string, stats: DistrictTemperature, mode: string) => {
  return renderToString(
    <div className="p-1 min-w-[150px]">
      <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-1">
        <span className="font-bold text-gray-800">{district}</span>
      </div>
      <div className="space-y-2">
        <div className={`flex items-center justify-between ${mode === 'temperature' ? 'bg-green-50 p-1.5 rounded' : ''}`}>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Thermometer className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Température</span>
          </div>
          <span className="text-[11px] font-bold text-gray-800">
            {stats.avg_temperature.toFixed(1)}°C
          </span>
        </div>
        
        {stats.avg_aqi !== undefined && (
          <div className={`flex items-center justify-between ${mode === 'air_quality' ? 'bg-green-50 p-1.5 rounded' : ''}`}>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Wind className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Qualité Air</span>
            </div>
            <span className="text-[11px] font-bold text-gray-800">
              AQI {Math.round(stats.avg_aqi)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-gray-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[10px]">Capteurs</span>
          </div>
          <span className="text-[10px] font-bold">{stats.sensor_count}</span>
        </div>
      </div>
    </div>
  );
};

function EnvironmentMapLayer({
  districtStats,
  visible,
  mode,
}: EnvironmentMapLayerProps) {
  const geoData = useMemo(
    () => zonesGeoJSON as unknown as FeatureCollection,
    [],
  );

  const styleFn = useCallback((feature?: Feature) => {
    if (!feature) return {};
    const stats = findDistrictData(feature, districtStats);

    if (!stats) {
      return {
        fillColor: "#0e2016",
        fillOpacity: 0.1,
        weight: 1,
        color: "#173525",
      };
    }

    const fillColor = mode === "temperature" 
      ? getTemperatureFillColor(stats.avg_temperature)
      : getAqiFillColor(stats.avg_aqi || 0);

    return {
      fillColor,
      fillOpacity: 0.6,
      weight: 2,
      color: "#e7f8ed",
      className: "district-polygon",
    };
  }, [districtStats, mode]);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const stats = findDistrictData(feature, districtStats);
    if (stats) {
      layer.bindPopup(buildPopup(stats.district, stats, mode), {
        className: "custom-popup",
      });
    }

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.8, weight: 3 });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.6, weight: 2 });
      },
    });
  }, [districtStats, mode]);

  if (!visible) return null;

  return (
    <GeoJSON
      data={geoData}
      style={styleFn}
      onEachFeature={onEachFeature}
      // Use key to force re-render when mode or data changes for smooth transition
      key={`env-layer-${mode}-${districtStats.size}`}
    />
  );
}

export default memo(EnvironmentMapLayer);
