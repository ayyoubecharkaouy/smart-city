"use client";

import { AlertTriangle, Database, Loader, ServerOff } from "lucide-react";

type StateNoticeVariant = "loading" | "error" | "disconnected" | "empty";

const variantConfig = {
  loading: {
    icon: Loader,
    iconClass: "text-green-600 animate-spin",
    title: "Loading data",
    tone: "border-green-200 bg-green-50 text-green-700",
  },
  error: {
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    title: "API Error",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  disconnected: {
    icon: ServerOff,
    iconClass: "text-red-500",
    title: "Backend disconnected",
    tone: "border-red-200 bg-red-50 text-red-700",
  },
  empty: {
    icon: Database,
    iconClass: "text-slate-400",
    title: "No data",
    tone: "border-slate-200 bg-slate-50 text-slate-500",
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
      className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${config.tone} ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60">
        <Icon className={`h-5 w-5 ${config.iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black">{title ?? config.title}</p>
        <p className="mt-0.5 text-sm font-medium opacity-80">{message}</p>
      </div>
    </div>
  );
}
