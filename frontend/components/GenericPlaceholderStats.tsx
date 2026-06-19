"use client";

import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface GenericPlaceholderStatsProps {
  title: string;
  icon: LucideIcon;
  colorClass: string;
}

export default function GenericPlaceholderStats({
  title,
  icon: Icon,
  colorClass,
}: GenericPlaceholderStatsProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-sm font-bold flex items-center gap-2 ${colorClass}`}
        >
          <Icon className="w-4 h-4" />
          {title}
        </h3>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          IN DEVELOPMENT
        </span>
      </div>

      <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 flex gap-2 items-start">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          The Kafka stream for the <strong>{title}</strong> domain is not
          yet connected. Space reserved for future real-time data integration.
        </p>
      </div>

      <div className="space-y-2 opacity-40 grayscale pointer-events-none">
        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
