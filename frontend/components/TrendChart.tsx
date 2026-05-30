"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  time: string;
  value: number;
  isLive?: boolean;
}

interface TrendChartProps {
  data: DataPoint[];
  color: string;
  label: string;
  unit: string;
}

export default function TrendChart({
  data,
  color,
  label,
  unit,
}: TrendChartProps) {
  // Use a simpler ID for the gradient
  const gradientId =
    "colorGradient-" +
    (label === "Température"
      ? "temp"
      : label === "AQI"
        ? "aqi"
        : label === "Débit"
          ? "flow"
          : "vitesse");

  return (
    <div className="w-full h-[220px] mt-4 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#173525"
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#8fa89a" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#8fa89a" }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              backgroundColor: "#06110b",
              border: "1px solid #173525",
            }}
            formatter={(val: unknown) => {
              const numVal = Number(val);
              return [isNaN(numVal) ? "0.0" : numVal.toFixed(1) + unit, label];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
