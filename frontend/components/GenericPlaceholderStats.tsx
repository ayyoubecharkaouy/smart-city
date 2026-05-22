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
    <div className=" border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-sm font-bold flex items-center gap-2 ${colorClass}`}
        >
          <Icon className="w-4 h-4" />
          {title}
        </h3>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          EN DÉVELOPPEMENT
        </span>
      </div>

      <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 flex gap-2 items-start">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Le flux Kafka pour le domaine <strong>{title}</strong> n&apos;est pas
          encore connecté. Espace réservé pour la future intégration des données
          en temps réel.
        </p>
      </div>

      <div className="space-y-2 opacity-40 grayscale pointer-events-none">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
