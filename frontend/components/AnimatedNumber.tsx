"use client";

import NumberFlow from "@number-flow/react";

interface AnimatedNumberProps {
  value: number | string | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  compact?: boolean;
}

export default function AnimatedNumber({
  value,
  decimals = 0,
  prefix,
  suffix,
  className,
  compact = false,
}: AnimatedNumberProps) {
  const normalizedValue = typeof value === "string" ? value.replace(/[^\d.-]/g, "") : value;
  const numericValue = Number(normalizedValue);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return (
    <NumberFlow
      className={className}
      value={safeValue}
      locales="fr-FR"
      prefix={prefix}
      suffix={suffix}
      format={{
        notation: compact ? "compact" : "standard",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }}
    />
  );
}
