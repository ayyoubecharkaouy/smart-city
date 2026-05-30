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
  Settings,
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
  { label: "Réglages", icon: Settings, href: APP_ROUTES.settings },
];

export default function Sidebar() {

  return (
    <aside className="fixed inset-x-0 bottom-0 z-2000 h-16 shrink-0 lg:static lg:h-screen lg:w-64 lg:border-t-0">
      <div className="flex flex-col items-start h-full lg:p-2">
        <div className="flex items-center gap-2 my-4">
          <img src={'/images/logos/app-logo.png'} width={60} height={60} alt="Logo" />
          <div className="hidden px-3 py-4 lg:block">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#5f7668]">
              Smart City
            </p>
            <h1 className="mt-1 text-lg font-black text-[#e7f8ed]">
              El Jadida Ops
            </h1>
          </div>
        </div>
        <nav className="flex h-full items-center gap-1 overflow-x-auto px-2 lg:block lg:h-auto lg:space-y-1 lg:overflow-visible lg:px-0">
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
      aria-label={label}
      title={label}
      className={`flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200 group lg:min-w-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 ${
        isActive
          ? "bg-[#22C55E] text-[#031007] shadow-lg shadow-green-950/40"
          : "text-[#8fa89a] hover:bg-[#0e2016] hover:text-[#e7f8ed]"
      }`}
      onClick={() => {
        if (!isActive) setIsclicked(true);
      }}
    >
      {isclicked ? (
        <Loader className="w-5 h-5 animate-spin text-[#22C55E]" />
      ) : (
        <Icon
          className={`w-5 h-5 transition-colors ${
            isActive ? "text-[#031007]" : "text-[#6f8979] group-hover:text-[#22C55E]"
          }`}
        />
      )}
      <span className="max-w-14 truncate text-[10px] font-bold leading-none lg:hidden">
        {label}
      </span>
      <span className="hidden text-sm font-bold lg:inline">{label}</span>
    </Link>
  );
}
