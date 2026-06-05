"use client";

import { AlertTriangle, Database, Loader, ServerOff } from "lucide-react";

type StateNoticeVariant = "loading" | "error" | "disconnected" | "empty";

const variantConfig = {
  loading: {
    icon: Loader,
    iconClass: "text-green-500 animate-spin",
    title: "Chargement des données",
    tone: "border-green-500/20 bg-green-500/10 text-green-400",
  },
  error: {
    icon: AlertTriangle,
    iconClass: "text-green-600",
    title: "Erreur API",
    tone: "border-green-500/20 bg-green-500/10 text-green-400",
  },
  disconnected: {
    icon: ServerOff,
    iconClass: "text-green-600",
    title: "Backend déconnecté",
    tone: "border-green-500/20 bg-green-500/10 text-green-400",
  },
  empty: {
    icon: Database,
    iconClass: "text-gray-500",
    title: "Aucune donnée",
    tone: "border-slate-800 bg-slate-950 text-slate-400",
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
      className={`flex items-center gap-3 rounded-2xl border p-4 shadow-2xl shadow-black/20 ${config.tone} ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
        <Icon className={`h-5 w-5 ${config.iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black">{title ?? config.title}</p>
        <p className="mt-0.5 text-sm font-medium opacity-80">{message}</p>
      </div>
    </div>
  );
}
