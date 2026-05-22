"use client";

import { AlertTriangle, Database, Loader, ServerOff } from "lucide-react";

type StateNoticeVariant = "loading" | "error" | "disconnected" | "empty";

const variantConfig = {
  loading: {
    icon: Loader,
    iconClass: "text-blue-500 animate-spin",
    title: "Chargement des données",
    tone: "border-blue-100 bg-blue-50/60 text-blue-700",
  },
  error: {
    icon: AlertTriangle,
    iconClass: "text-rose-600",
    title: "Erreur API",
    tone: "border-rose-100 bg-rose-50/70 text-rose-700",
  },
  disconnected: {
    icon: ServerOff,
    iconClass: "text-amber-600",
    title: "Backend déconnecté",
    tone: "border-amber-100 bg-amber-50/70 text-amber-700",
  },
  empty: {
    icon: Database,
    iconClass: "text-gray-500",
    title: "Aucune donnée",
    tone: "border-gray-100 bg-gray-50 text-gray-600",
  },
};

interface StateNoticeProps {
  variant: StateNoticeVariant;
  title?: string;
  message: string;
  className?: string;
}

export default function StateNotice({
  variant,
  title,
  message,
  className = "",
}: StateNoticeProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 ${config.tone} ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/75">
        <Icon className={`h-5 w-5 ${config.iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black">{title ?? config.title}</p>
        <p className="mt-0.5 text-sm font-medium opacity-80">{message}</p>
      </div>
    </div>
  );
}
