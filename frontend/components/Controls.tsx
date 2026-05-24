"use client";

import { SMART_CITY_DOMAINS } from "@/data/domains";
import type { DomainId } from "@/data/domains";
import { memo } from "react";

interface ControlsProps {
  mode: DomainId;
  onModeChange: (mode: DomainId) => void;
  kafkaConnected: boolean;
  districtCount: number;
  sensorCount: number;
}

function Controls({
  mode,
  onModeChange,
}: ControlsProps) {
  return (
    <div className="w-full flex flex-col bg-white rounded-4xl  py-12 h-max">
      {/* Data Displayed & Visualization Options */}
      <div className="space-y-2 px-2">
        {SMART_CITY_DOMAINS.map((category, idx) => (
          <div key={idx}>
            <div className="space-y-1">
              {category.items.map((item) => {
                const isActive = mode === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onModeChange(item.id)}
                    className={`cursor-pointer w-full flex items-center gap-2.5 px-1 pe-4 py-1 rounded-full font-semibold transition-all text-left ${
                      isActive
                        ? ` ring-2 ring-gray-200 ${item.colorClass} bg-white`
                        : "text-gray-900 hover:bg-gray-300 hover:text-gray-800"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 flex justify-center items-center rounded-full p-2 ${item.bgClass}`}
                    >
                      <Icon className={`w-6 h-6 text-black`} />
                    </div>

                    <span className="flex-1 text-base font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(Controls);
