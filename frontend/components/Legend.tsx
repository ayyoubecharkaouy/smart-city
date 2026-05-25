"use client";

import { type MetricKey, METRICS, type ZoneProperties } from "@/data/zones";
import { getTrafficColor, getTrafficLabel } from "@/data/routes";
import AnimatedNumber from "@/components/AnimatedNumber";

interface LegendProps {
  activeMetric: MetricKey;
  zones: ZoneProperties[];
  showRoutes: boolean;
}

export default function Legend({
  activeMetric,
  zones,
  showRoutes,
}: LegendProps) {
  const metric = METRICS.find((m) => m.key === activeMetric)!;
  const values = zones.map((z) => z[activeMetric] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="absolute bottom-6 right-6 z-1000 /40 backdrop-blur-md border border-gray-200 rounded-sm p-2 w-[220px]  animate-[slideUp_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-700 text-xl">{metric.icon}</span>
        <h3 className="text-sm font-bold text-gray-800">
          {metric.label}hhhhhhhh
          {metric.unit && (
            <span className="font-normal text-gray-500 text-xs ml-1">
              ({metric.unit})
            </span>
          )}
        </h3>
      </div>

      {/* linear Bar */}
      <div className="mb-3">
        <div className="flex h-2.5 rounded-full overflow-hidden">
          {metric.colors.map((color, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            <AnimatedNumber value={min} />
          </span>
          <span className="text-xs text-gray-500">
            <AnimatedNumber value={(min + max) / 2} />
          </span>
          <span className="text-xs text-gray-500">
            <AnimatedNumber value={max} />
          </span>
        </div>
      </div>

      {/* Traffic Legend */}
      {showRoutes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Trafic routier
          </h4>
          <div className="flex flex-col gap-1">
            {(["low", "medium", "high", "critical"] as const).map((level) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-8 rounded-sm shrink-0"
                  style={{
                    backgroundColor: getTrafficColor(level),
                    height:
                      level === "low"
                        ? 2
                        : level === "medium"
                          ? 3
                          : level === "high"
                            ? 5
                            : 7,
                  }}
                />
                <span className="text-xs text-gray-600">
                  {getTrafficLabel(level)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
