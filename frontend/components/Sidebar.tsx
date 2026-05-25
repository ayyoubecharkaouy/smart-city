"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  Bell,
  Map as MapIcon,
  Star,
  Loader,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { APP_ROUTES } from "@/lib/constants";

const navItems = [
  { label: "Vue d'ensemble", icon: LayoutDashboard, href: APP_ROUTES.home },
  { label: "Carte Interactive", icon: MapIcon, href: APP_ROUTES.map },
  { label: "Données Spark", icon: Star, href: APP_ROUTES.spark },
  { label: "Analytiques", icon: LineChart, href: APP_ROUTES.analytics },
  { label: "Alertes", icon: Bell, href: APP_ROUTES.alerts },
];

export default function Sidebar() {

  return (
    <aside className="w-64 flex flex-col h-screen shrink-0">
      <div className="p-2">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              label={item.label}
              Icon={item.icon}
              href={item.href}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SidebarItem({
  label,
  Icon,
  href,
}: {
  label: string;
  Icon: LucideIcon;
  href: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const [isclicked, setIsclicked] = useState(false);

  // Reset loading state when navigation finishes (pathname changes)
  useEffect(() => {
    const timeout = window.setTimeout(() => setIsclicked(false), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
        isActive
          ? "bg-[#e85d04] text-white"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
      onClick={() => {
        if (!isActive) setIsclicked(true);
      }}
    >
      {isclicked ? (
        <Loader className="w-5 h-5 animate-spin text-gray-400" />
      ) : (
        <Icon
          className={`w-5 h-5 transition-colors ${
            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
          }`}
        />
      )}
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}
