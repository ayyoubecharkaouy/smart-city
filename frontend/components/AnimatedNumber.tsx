"use client";

import { memo, useMemo } from "react";
import NumberFlow from "@number-flow/react";

interface AnimatedNumberProps {
  value: number | string | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  compact?: boolean;
  keepLastValidValue?: boolean;
}

function parseNumber(value: AnimatedNumberProps["value"]): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function AnimatedNumber({
  value,
  decimals = 0,
  prefix,
  suffix,
  className,
  compact = false,
}: AnimatedNumberProps) {
  const parsedValue = useMemo(() => parseNumber(value), [value]);
  const safeValue = parsedValue ?? 0;

  const format = useMemo(
    () => ({
      notation: compact ? "compact" as const : "standard" as const,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
    [compact, decimals]
  );

  return (
    <NumberFlow
      className={className}
      value={safeValue}
      locales="fr-FR"
      prefix={prefix}
      suffix={suffix}
      format={format}
    />
  );
}

export default memo(AnimatedNumber);
