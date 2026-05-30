"use client";

import { AlertTriangle, Thermometer, Check } from "lucide-react";
import type { TemperatureAlert } from "@/lib/types";
import AnimatedNumber from "@/components/AnimatedNumber";

interface TemperatureAlertsProps {
  alerts: TemperatureAlert[];
  onAcknowledge: (id: string) => void;
}

export default function TemperatureAlerts({
  alerts,
  onAcknowledge,
}: TemperatureAlertsProps) {
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const recentAlerts = alerts.slice(0, 20);

  if (recentAlerts.length === 0) return null;

  return (
    <div className=" border border-gray-200 rounded-sm  overflow-hidden">
      {/* Header */}
      <div className="px-2 py-3 border-b border-gray-100 flex items-center justify-between bg-green-50/50">
        <h3 className="text-sm font-bold text-green-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Alertes Température
        </h3>
        {activeAlerts.length > 0 && (
          <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
            <AnimatedNumber value={activeAlerts.length} />
          </span>
        )}
      </div>

      {/* Alerts list */}
      <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
        {recentAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`px-2 py-2.5 flex items-center justify-between transition-colors ${
              alert.acknowledged ? "opacity-50 bg-gray-50" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${
                  (alert.temperature ?? 0) >= 40
                    ? "bg-green-100 text-green-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <Thermometer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {alert.district ?? "—"} —{" "}
                  {alert.temperature != null ? (
                    <AnimatedNumber value={alert.temperature} decimals={1} suffix="°C" />
                  ) : "N/A"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {alert.sensor_id} ·{" "}
                  {new Date(alert.timestamp).toLocaleTimeString("fr-FR")}
                </p>
              </div>
            </div>

            {!alert.acknowledged && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="p-1 rounded hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
                title="Acquitter l'alerte"
              >
                <Check className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
