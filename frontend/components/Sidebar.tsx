"use client";

import Link from "next/link";
import Image from "next/image";
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
  { label: "Overview", icon: LayoutDashboard, href: APP_ROUTES.home },
  { label: "Interactive Map", icon: MapIcon, href: APP_ROUTES.map },
  { label: "Spark Data", icon: Star, href: APP_ROUTES.spark },
  { label: "Analytics", icon: LineChart, href: APP_ROUTES.analytics },
  { label: "Alerts", icon: Bell, href: APP_ROUTES.alerts },
  { label: "Settings", icon: Settings, href: APP_ROUTES.settings },
];

export default function Sidebar() {

  return (
    <aside className="fixed inset-x-0 bottom-0 z-2000 h-16 shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:static lg:h-screen lg:w-64 lg:border-r lg:border-t-0">
      <div className="flex h-full flex-col items-start lg:p-3">
        <div className="flex items-center gap-2 my-4">
          <Image src="/images/logos/app-logo.png" width={60} height={60} alt="Logo Smart City" />
          <div className="hidden px-3 py-4 lg:block">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Smart City
            </p>
            <h1 className="mt-1 text-lg font-black text-slate-800">
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
          ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
      onClick={() => {
        if (!isActive) setIsclicked(true);
      }}
    >
      {isclicked ? (
        <Loader className="w-5 h-5 animate-spin text-green-600" />
      ) : (
        <Icon
          className={`w-5 h-5 transition-colors ${
            isActive ? "text-white" : "text-slate-400 group-hover:text-green-600"
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
