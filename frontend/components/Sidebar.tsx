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
import Image from "next/image";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Vue d'ensemble", icon: LayoutDashboard, href: "/" },
  { label: "Carte Interactive", icon: MapIcon, href: "/dashboard" },
  { label: "Données Spark", icon: Star, href: "/spark" },
  { label: "Analytiques", icon: LineChart, href: "/analytics" },
  { label: "Alertes", icon: Bell, href: "/alerts" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 flex flex-col h-screen shrink-0">
      <div className="p-2">
        <Image
          src="/images/logos/eljadida.png"
          alt="Logo"
          width={200}
          height={200}
          className="mx-auto"
        />

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
  Icon: any;
  href: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const [isclicked, setIsclicked] = useState(false);

  // Reset loading state when navigation finishes (pathname changes)
  useEffect(() => {
    setIsclicked(false);
  }, [pathname]);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
        isActive
          ? "bg-[#bfb693] text-white shadow-[#bfb693]/20"
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
