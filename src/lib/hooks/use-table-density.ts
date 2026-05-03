"use client";

import { useState } from "react";

export type TableDensity = "compact" | "comfortable";

export function useTableDensity() {
  // Initialize state from localStorage
  const [density, setDensityState] = useState<TableDensity>(() => {
    if (typeof window === "undefined") return "comfortable";
    const stored = localStorage.getItem("table-density");
    if (stored === "compact" || stored === "comfortable") {
      return stored;
    }
    return "comfortable";
  });

  // Save to localStorage when changed
  const setDensity = (value: TableDensity) => {
    setDensityState(value);
    localStorage.setItem("table-density", value);
  };

  const rowPadding = density === "compact" ? "py-1" : "py-2.5";

  return {
    density,
    setDensity,
    rowPadding,
  };
}
