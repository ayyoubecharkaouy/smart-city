import { Car, Droplet, Wind, Thermometer, Zap, Lightbulb, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DomainId = 
  | "traffic_congestion" 
  | "water_consumption" 
  | "water_quality" 
  | "air_quality" 
  | "temperature" 
  | "energy_consumption" 
  | "street_lighting" 
  | "waste_level";

export interface SubDomain {
  id: DomainId;
  label: string;
  icon: LucideIcon;
  colorClass: string; 
  bgClass: string;
}

export interface DomainCategory {
  items: SubDomain[];
}

export const SMART_CITY_DOMAINS: DomainCategory[] = [
  {
    items: [
      { id: "traffic_congestion", label: "Congestion Detection", icon: Car, colorClass: "text-emerald-600", bgClass: "bg-emerald-300" },
    ]
  },
  {
    items: [
      { id: "water_consumption", label: "Water Consumption", icon: Droplet, colorClass: "text-green-600", bgClass: "bg-green-300" },
      { id: "water_quality", label: "Water Quality", icon: Droplet, colorClass: "text-green-600", bgClass: "bg-green-300" },
    ]
  },
  {
    items: [
      { id: "air_quality", label: "Air Quality", icon: Wind, colorClass: "text-green-600", bgClass: "bg-green-300" },
      { id: "temperature", label: "Temperature", icon: Thermometer, colorClass: "text-green-600", bgClass: "bg-green-300" },
    ]
  },
  {
    items: [
      { id: "energy_consumption", label: "Energy Consumption", icon: Zap, colorClass: "text-green-600", bgClass: "bg-green-300" },
      { id: "street_lighting", label: "Smart Street Lighting", icon: Lightbulb, colorClass: "text-green-600", bgClass: "bg-green-300" },
    ]
  },
  {
    items: [
      { id: "waste_level", label: "Fill Level", icon: Trash2, colorClass: "text-green-600", bgClass: "bg-green-300" },
    ]
  }
];
