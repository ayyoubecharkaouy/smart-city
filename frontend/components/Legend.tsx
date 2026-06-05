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
    <div className="absolute bottom-6 right-6 z-1000 w-[220px] animate-[slideUp_0.3s_ease-out] rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl text-green-500">{metric.icon}</span>
        <h3 className="text-sm font-bold text-slate-100">
          {metric.label}
          {metric.unit && (
            <span className="ml-1 text-xs font-normal text-slate-500">
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
          <span className="text-xs text-slate-500">
            <AnimatedNumber value={min} />
          </span>
          <span className="text-xs text-slate-500">
            <AnimatedNumber value={(min + max) / 2} />
          </span>
          <span className="text-xs text-slate-500">
            <AnimatedNumber value={max} />
          </span>
        </div>
      </div>

      {/* Traffic Legend */}
      {showRoutes && (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <h4 className="mb-2 text-xs font-semibold text-slate-300">
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
                <span className="text-xs text-slate-400">
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
